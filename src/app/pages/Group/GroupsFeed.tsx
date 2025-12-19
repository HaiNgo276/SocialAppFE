import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography, Spin, Empty, message, Avatar } from 'antd'
import { TeamOutlined } from '@ant-design/icons'
import { groupService } from '@/app/services/group.service'
import { PostData } from '@/app/types/Post/Post'
import { UserDto } from '@/app/types/User/user.dto'
import { GroupRole } from '@/app/types/Group/group.dto'
import { userService } from '@/app/services/user.service'
import Post from '../Post/Post'
import PostDropdownMenu from '../Post/PostDropdownMenu'
import { getTimeAgo } from '@/app/helper'

const { Text } = Typography

const GroupsFeed = () => {
  const navigate = useNavigate()
  const defaultUser: UserDto = {
    id: '',
    avatarUrl: '',
    firstName: 'Guest',
    lastName: '',
    email: '',
    userName: '',
    status: ''
  }

  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserDto>(defaultUser)
  const [myGroupIds, setMyGroupIds] = useState<string[]>([])
  const [dropdownStates, setDropdownStates] = useState<{[key: string]: boolean}>({})

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser.id) {
      fetchMyGroupsAndPosts()
    }
  }, [currentUser.id])

  // Lấy thông tin người dùng hiện tại
  const fetchCurrentUser = async () => {
    try {
      const response = await userService.getUserInfoByToken()
      if (response.status === 200 && response.data && 'id' in response.data) {
        setCurrentUser(response.data as UserDto)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  // Lấy tất cả nhóm và bài viết của người dùng
  const fetchMyGroupsAndPosts = async () => {
    try {
      setLoading(true)
      const groupsResponse = await groupService.getMyGroups(0, 50)

      const approvedGroups = groupsResponse.groups.filter(group => {
        const userStatus = group.groupUsers?.find(gu => gu.userId === currentUser.id)
        return userStatus && userStatus.roleName !== GroupRole.Pending
      })
      setMyGroupIds(approvedGroups.map(group => group.id))
      const allPosts: PostData[] = []
      approvedGroups.forEach(group => {
        if (group.posts && group.posts.length > 0) {
          const postsWithGroup = (group.posts as unknown as PostData[]).map(post => ({
            ...post,
            group: {
              id: group.id,
              name: group.name,
              imageUrl: group.imageUrl,
              isPublic: group.isPublic
            }
          }))
          allPosts.push(...postsWithGroup)
        }
      })
      // Sắp xếp bài viết theo ngày tạo mới nhất
      allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setPosts(allPosts)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to load posts'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePostUserClick = (e: React.MouseEvent, userName: string) => {
    e.stopPropagation()
    navigate(`/profile/${userName}`)
  }

  const handlePostGroupClick = (e: React.MouseEvent, groupId: string | undefined) => {
    e.stopPropagation()
    if (!groupId) return

    const isJoined = myGroupIds.includes(groupId)
    if (isJoined) {
      navigate(`/groups/${groupId}`)
    } else {
      navigate(`/group/${groupId}`)
    }
  }

  const handlePostUpdated = () => {
    fetchMyGroupsAndPosts()
  }

  const toggleDropdown = (postId: string) => {
    setDropdownStates(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }))
  }

  const closeDropdown = (postId: string) => {
    setDropdownStates(prev => ({
      ...prev,
      [postId]: false
    }))
  }

  const renderPrivacyIcon = (isPublic?: boolean) => {
    if (isPublic === undefined) return null

    return isPublic ? (
      <svg className='w-3.5 h-3.5 text-gray-500' fill='currentColor' viewBox='0 0 20 20'>
        <path
          fillRule='evenodd'
          d='M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z'
          clipRule='evenodd'
        />
      </svg>
    ) : (
      <svg className='w-3.5 h-3.5 text-gray-500' fill='currentColor' viewBox='0 0 20 20'>
        <path
          fillRule='evenodd'
          d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
          clipRule='evenodd'
        />
      </svg>
    )
  }
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Spin size='large' />
      </div>
    )
  }

  return (
    <div className='max-w-2xl mx-auto py-6 px-4'>
      {/* Header */}
      <div className='mb-6'>
        <Text type='secondary'>View the latest posts from groups you've joined</Text>
      </div>

      {/* Posts */}
      {posts.length > 0 ? (
        <div className='space-y-4'>
          {posts.map((post) => {
            const hasGroup = post.group !== undefined && post.group !== null
            const user = post.user
            const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
            return (
              <div key={post.id}>
                {hasGroup && post.group && (
                  <div className='bg-white rounded-t-lg border border-b-0 border-gray-200 p-4 pb-2'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3 flex-1'>
                        <div onClick={(e) => handlePostGroupClick(e, post.group!.id)} className='cursor-pointer'>
                          <Avatar src={post.group.imageUrl} size={40} icon={<TeamOutlined />} />
                        </div>
                        <div className='flex-1'>
                          <div
                            className='font-semibold text-gray-900 hover:underline cursor-pointer text-[15px]'
                            onClick={(e) => handlePostGroupClick(e, post.group!.id)}
                          >
                            {post.group.name}
                          </div>
                          <div className='flex items-center gap-2 mt-1'>
                            <div
                              onClick={(e) => handlePostUserClick(e, user?.userName || '')}
                              className='cursor-pointer'
                            >
                              <Avatar
                                src={user?.avatarUrl}
                                size={20}
                                className='w-5 h-5 rounded-full object-cover'
                                style={{ minWidth: 20, minHeight: 20 }}
                              >
                                {user?.firstName?.[0] || user?.lastName?.[0] || ''}
                              </Avatar>
                            </div>
                            <div className='flex items-center gap-1'>
                              <span
                                className='text-[13px] text-gray-600 hover:underline cursor-pointer font-medium'
                                onClick={(e) => handlePostUserClick(e, user?.userName || '')}
                              >
                                {fullName}
                              </span>
                              <span className='text-[13px] text-gray-400'>·</span>
                              <span className='text-[13px] text-gray-500'>{getTimeAgo(post.createdAt)}</span>
                              {post.group?.isPublic !== undefined && (
                                <>
                                  <span className='text-[8px] text-gray-400'>•</span>
                                  {renderPrivacyIcon(post.group.isPublic)}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className='relative'>
                        <button
                          onClick={() => toggleDropdown(post.id)}
                          className='text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100'
                        >
                          <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                            <path d='M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z' />
                          </svg>
                        </button>
                        <PostDropdownMenu
                          isOpen={dropdownStates[post.id] || false}
                          onClose={() => closeDropdown(post.id)}
                          postId={post.id}
                          isOwner={currentUser?.id === post.user?.id}
                          onEdit={() => closeDropdown(post.id)}
                          onDeleteClick={() => closeDropdown(post.id)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className={hasGroup ? 'rounded-t-none' : ''}>
                  <Post
                    {...post}
                    currentUserId={currentUser?.id || ''}
                    currentUser={currentUser}
                    onPostUpdated={handlePostUpdated}
                    onPostDeleted={handlePostUpdated}
                    hideHeader={hasGroup}
                    onSeen={() => {}}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Empty description='No posts yet from your groups' image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  )
}

export default GroupsFeed