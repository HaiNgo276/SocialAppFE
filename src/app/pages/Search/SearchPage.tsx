import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Input, Tabs, Spin, Avatar, Empty, message, Button } from 'antd'
import { SearchOutlined, UserOutlined, TeamOutlined, FileTextOutlined, UserAddOutlined, CheckOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { searchService } from '@/app/services/search.service'
import { SearchType, SearchResultDto } from '@/app/types/Search/SearchType'
import { userService } from '@/app/services/user.service'
import { UserDto } from '@/app/types/User/user.dto'
import { groupService } from '@/app/services/group.service'
import { GroupRole } from '@/app/types/Group/group.dto'
import { relationService } from '@/app/services/relation.service'
import Post from '@/app/pages/Post/Post'
import PostDropdownMenu from '@/app/pages/Post/PostDropdownMenu'
import { getTimeAgo } from '@/app/helper'
import EditPostModal from '@/app/pages/Post/EditPostModal'
import DeletePostModal from '@/app/pages/Post/DeletePostModal'

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryParam = searchParams.get('q') || ''

  const defaultUser: UserDto = {
    id: '',
    avatarUrl: '',
    firstName: 'Guest',
    lastName: '',
    email: '',
    userName: '',
    status: ''
  }

  const [searchValue, setSearchValue] = useState(queryParam)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResultDto | null>(null)
  const [activeTab, setActiveTab] = useState('users')
  const [currentUser, setCurrentUser] = useState<UserDto>(defaultUser)
  const [myGroupIds, setMyGroupIds] = useState<string[]>([])
  const [pendingGroupIds, setPendingGroupIds] = useState<string[]>([])
  const [friendIds, setFriendIds] = useState<string[]>([])
  const [sentRequestIds, setSentRequestIds] = useState<string[]>([])
  const [dropdownStates, setDropdownStates] = useState<{[key: string]: boolean}>({})
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({})

  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)

  useEffect(() => {
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
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    const fetchMyGroups = async () => {
      try {
        const response = await groupService.getMyGroups(0, 100)
        const approvedGroupIds = (response.groups || [])
          .filter(group => {
            const userStatus = group.groupUsers?.find(gu => gu.userId === currentUser?.id)
            return userStatus && userStatus.roleName !== GroupRole.Pending
          })
          .map(group => group.id)

        const pendingGroupIds = (response.groups || [])
          .filter(group => {
            const userStatus = group.groupUsers?.find(gu => gu.userId === currentUser?.id)
            return userStatus && userStatus.roleName === GroupRole.Pending
          })
          .map(group => group.id)

        setMyGroupIds(approvedGroupIds)
        setPendingGroupIds(pendingGroupIds)
      } catch (error) {
        console.error('Error fetching my groups:', error)
      }
    }

    if (currentUser?.id) {
      fetchMyGroups()
    }
  }, [currentUser?.id])

  useEffect(() => {
    const fetchFriendsAndRequests = async () => {
      try {
        const [friendsRes, sentRequestsRes] = await Promise.all([
          relationService.getFriendsList(),
          relationService.getFriendRequestsSent()
        ])

        if (friendsRes.status === 200 && friendsRes.data && 'data' in friendsRes.data) {
          const friends = friendsRes.data.data as UserDto[]
          setFriendIds(friends.map((f: UserDto) => f.id))
        }

        if (sentRequestsRes.status === 200 && sentRequestsRes.data && 'data' in sentRequestsRes.data) {
          const requests = sentRequestsRes.data.data as any[]
          setSentRequestIds(requests.map((r: any) => r.receiverId))
        }
      } catch (error) {
        console.error('Error fetching friends and requests:', error)
      }
    }

    if (currentUser?.id) {
      fetchFriendsAndRequests()
    }
  }, [currentUser?.id])

  useEffect(() => {
    if (queryParam) {
      setSearchValue(queryParam)
      handleSearch(queryParam, true)
    }
  }, [queryParam])

  const handleSearch = async (keyword: string, saveHistory: boolean = false) => {
    if (!keyword.trim()) {
      setSearchResults(null)
      return
    }

    setIsSearching(true)
    try {
      const response = await searchService.search(keyword, SearchType.All, 0, 50, saveHistory)
      setSearchResults(response.results || null)
    } catch (error) {
      console.error('Error searching:', error)
      message.error('Search failed. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddFriend = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setLoadingStates(prev => ({ ...prev, [userId]: true }))
    try {
      const response = await relationService.addFriend(userId)
      if (response.status === 200) {
        message.success('Friend request sent!')
        setSentRequestIds(prev => [...prev, userId])
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to send friend request'
      message.error(errorMessage)
    } finally {
      setLoadingStates(prev => ({ ...prev, [userId]: false }))
    }
  }

  const handleJoinGroup = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setLoadingStates(prev => ({ ...prev, [groupId]: true }))
    try {
      await groupService.joinGroup(groupId)
      message.success('Join request sent!')
      setPendingGroupIds(prev => [...prev, groupId])
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to send join request'
      message.error(errorMessage)
    } finally {
      setLoadingStates(prev => ({ ...prev, [groupId]: false }))
    }
  }

  const handleCancelJoinRequest = async (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setLoadingStates(prev => ({ ...prev, [groupId]: true }))
    try {
      await groupService.cancelJoinRequest(groupId)
      message.success('Join request cancelled')
      setPendingGroupIds(prev => prev.filter(id => id !== groupId))
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to cancel request'
      message.error(errorMessage)
    } finally {
      setLoadingStates(prev => ({ ...prev, [groupId]: false }))
    }
  }

  const handleEditPost = (postId: string) => {
    setEditingPostId(postId)
    closeDropdown(postId)
  }

  const handleDeletePost = (postId: string) => {
    setDeletingPostId(postId)
    closeDropdown(postId)
  }

  const handleSaveEditedPost = (updatedPost: any) => {
    setEditingPostId(null)
    handlePostUpdated()
    message.success('Post updated successfully')
  }

  const handleDeleteSuccess = () => {
    setDeletingPostId(null)
    handlePostUpdated()
    message.success('Post deleted successfully')
  }

  const handleSearchSubmit = async () => {
    if (searchValue.trim()) {
      try {
        await searchService.saveSearchHistory(searchValue.trim(), undefined, undefined)
      } catch (error) {
        console.error('Error saving search history:', error)
      }

      setSearchParams({ q: searchValue.trim() })
      handleSearch(searchValue.trim(), false)
    }
  }

  const handleUserClick = async (user: UserDto) => {
    navigate(`/profile/${user.userName}`)
  }

  const handleGroupClick = async (group: any) => {
    const isJoined = myGroupIds.includes(group.id)
    if (isJoined) {
      navigate(`/groups/${group.id}`)
    } else {
      navigate(`/group/${group.id}`)
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
    if (searchValue.trim()) {
      handleSearch(searchValue.trim(), false)
    }
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

  const renderUserButton = (user: UserDto) => {
    if (user.id === currentUser?.id) {
      return null
    }

    const isFriend = friendIds.includes(user.id)
    const isPending = sentRequestIds.includes(user.id)
    const isLoading = loadingStates[user.id]

    if (isFriend) {
      return (
        <Button type='default' icon={<CheckOutlined />} disabled className='bg-gray-100 text-gray-600 border-gray-300'>
          Friends
        </Button>
      )
    }

    if (isPending) {
      return (
        <Button
          type='default'
          icon={<ClockCircleOutlined />}
          disabled
          className='bg-blue-50 text-blue-600 border-blue-300'
        >
          Sent
        </Button>
      )
    }

    return (
      <Button
        type='primary'
        icon={<UserAddOutlined />}
        loading={isLoading}
        onClick={(e) => handleAddFriend(user.id, e)}
      >
        Add Friend
      </Button>
    )
  }

  const renderGroupButton = (groupId: string) => {
    const isJoined = myGroupIds.includes(groupId)
    const isPending = pendingGroupIds.includes(groupId)
    const isLoading = loadingStates[groupId]

    if (isJoined) {
      return (
        <Button type='default' icon={<CheckOutlined />} className='bg-gray-100 text-gray-600 border-gray-300'>
          Joined
        </Button>
      )
    }

    if (isPending) {
      return (
        <Button
          type='default'
          icon={<ClockCircleOutlined />}
          loading={isLoading}
          onClick={(e) => handleCancelJoinRequest(groupId, e)}
          className='bg-blue-50 text-blue-600 border-blue-300'
        >
          Pending
        </Button>
      )
    }

    return (
      <Button type='primary' loading={isLoading} onClick={(e) => handleJoinGroup(groupId, e)}>
        Join Group
      </Button>
    )
  }

  const renderUsers = () => {
    const users = searchResults?.users || []

    if (users.length === 0) {
      return (
        <div className='flex items-center justify-center h-64'>
          <Empty description='User not found' image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      )
    }

    return (
      <div className='grid grid-cols-1 gap-3'>
        {users.map((user) => (
          <div
            key={user.id}
            className='flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors'
            onClick={() => handleUserClick(user)}
          >
            <Avatar src={user.avatarUrl} size={56} icon={<UserOutlined />} />
            <div className='ml-4 flex-1 min-w-0'>
              <div className='font-semibold text-gray-900 text-base'>{user.userName}</div>
              <div className='text-sm text-gray-500'>{user.firstName}</div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>{renderUserButton(user)}</div>
          </div>
        ))}
      </div>
    )
  }

  const renderGroups = () => {
    const groups = searchResults?.groups || []

    if (groups.length === 0) {
      return (
        <div className='flex items-center justify-center h-64'>
          <Empty description='Group not found' image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      )
    }

    return (
      <div className='grid grid-cols-1 gap-3'>
        {groups.map((group) => (
          <div
            key={group.id}
            className='flex items-center p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors'
            onClick={() => handleGroupClick(group)}
          >
            <Avatar src={group.imageUrl} size={56} icon={<TeamOutlined />} />
            <div className='ml-4 flex-1 min-w-0'>
              <div className='font-semibold text-gray-900 text-base'>{group.name}</div>
              <div className='text-sm text-gray-500'>{group.isPublic ? 'Public' : 'Private'} Group</div>
            </div>
            <div onClick={(e) => e.stopPropagation()}>{renderGroupButton(group.id)}</div>
          </div>
        ))}
      </div>
    )
  }

  const renderPosts = () => {
    const posts = searchResults?.posts || []

    if (posts.length === 0) {
      return (
        <div className='flex items-center justify-center h-64'>
          <Empty description='Post not found' image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      )
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
          <path d='M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707l-.707-.707V8a6 6 0 00-6-6z' />
        </svg>
      )
    }

    return (
      <div className='space-y-4'>
        {posts.map((post) => {
          const hasPublicGroup = post.group?.isPublic === true
          const user = post.user
          const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
          return (
            <div key={post.id}>
              {hasPublicGroup && post.group && (
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
                          <div onClick={(e) => handlePostUserClick(e, user?.userName || '')} className='cursor-pointer'>
                            <Avatar
                              src={user?.avatarUrl}
                              size={20}
                              className='w-5 h-5 rounded-full object-cover '
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
                        onEdit={() => handleEditPost(post.id)}
                        onDeleteClick={() => handleDeletePost(post.id)}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className={hasPublicGroup ? 'rounded-t-none' : ''}>
                <Post
                  {...post}
                  currentUserId={currentUser?.id || ''}
                  currentUser={currentUser}
                  onSeen={() => {}}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostUpdated}
                  hideHeader={hasPublicGroup}
                />
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const items = [
    {
      key: 'users',
      label: (
        <span>
          <UserOutlined className='mr-2' />
          Users ({searchResults?.totalUsersCount || 0})
        </span>
      ),
      children: renderUsers()
    },
    {
      key: 'groups',
      label: (
        <span>
          <TeamOutlined className='mr-2' />
          Groups ({searchResults?.totalGroupsCount || 0})
        </span>
      ),
      children: renderGroups()
    },
    {
      key: 'posts',
      label: (
        <span>
          <FileTextOutlined className='mr-2' />
          Posts ({searchResults?.totalPostsCount || 0})
        </span>
      ),
      children: renderPosts()
    }
  ]

  return (
    <div className='mx-auto max-w-4xl p-4 md:p-6'>
      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6'>
        <h1 className='text-2xl font-bold mb-6 text-gray-800'>Search Results</h1>
        <div className='mb-6'>
          <Input
            placeholder='Search for users, groups, posts...'
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onPressEnter={handleSearchSubmit}
            suffix={
              isSearching ? (
                <Spin size='small' />
              ) : (
                <SearchOutlined
                  className='text-gray-400 cursor-pointer hover:text-gray-600 transition-colors' 
                  onClick={handleSearchSubmit}
                />
              )
            }
            size='large'
            className='rounded-lg'
          />
        </div>

        {searchResults && (
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            items={items}
            className='custom-tabs'
          />
        )}

        {!searchResults && !isSearching && searchValue && (
          <div className='flex items-center justify-center h-64'>
            <Empty description='Start searching to see results' />
          </div>
        )}
      </div>
      {/* Edit Post Modal */}
      {editingPostId && (
        <EditPostModal
          isOpen={true}
          onClose={() => setEditingPostId(null)}
          postId={editingPostId}
          onSave={handleSaveEditedPost}
          currentUser={currentUser}
        />
      )}

      {/* Delete Post Modal */}
      {deletingPostId && (
        <DeletePostModal
          isOpen={true}
          onClose={() => setDeletingPostId(null)}
          onDeleteSuccess={handleDeleteSuccess}
          postId={deletingPostId}
        />
      )}
    </div>
  )
}

export default SearchPage