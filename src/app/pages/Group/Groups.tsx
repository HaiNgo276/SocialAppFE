import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Typography, Button, Input, Avatar, message, Spin } from 'antd'
import { PlusOutlined, SearchOutlined, UsergroupAddOutlined, ProfileOutlined, CompassOutlined } from '@ant-design/icons'
import { groupService } from '@/app/services/group.service'
import { GroupDto, GroupRole } from '@/app/types/Group/group.dto'
import { userService } from '@/app/services/user.service'
import { UserDto } from '@/app/types/User/user.dto'
import CreateGroupModal from '@/app/common/Modals/Group/CreateGroupModal'
import MyGroupsPage from './MyGroupsPage'
import GroupsFeed from './GroupsFeed'
import GroupsDiscover from './GroupsDiscover'

const { Title, Text } = Typography

const Groups = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [myGroups, setMyGroups] = useState<GroupDto[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeView, setActiveView] = useState<'feed' | 'discover' | 'my-groups'>('feed')
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser?.id) {
      fetchMyGroups()
    }
  }, [currentUser])

  // Phát hiện chế độ xem hiện tại từ URL
  useEffect(() => {
    if (location.pathname === '/groups') {
      setActiveView('feed')
    } else if (location.pathname === '/groups/discover') {
      setActiveView('discover')
    } else if (location.pathname === '/groups/my-groups') {
      setActiveView('my-groups')
    }
  }, [location.pathname])

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

  // Lấy danh sách nhóm của người dùng
  const fetchMyGroups = async () => {
    try {
      setLoading(true)
      const response = await groupService.getMyGroups(0, 50)

      const approvedGroups = (response.groups || []).filter(group => {
        const userStatus = group.groupUsers?.find(gu => gu.userId === currentUser?.id)
        return userStatus && userStatus.roleName !== GroupRole.Pending
      })

      setMyGroups(approvedGroups)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to fetch your groups'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Xử lý khi tạo nhóm thành công
  const handleCreateGroupSuccess = () => {
    setIsCreateModalOpen(false)
    fetchMyGroups()
  }

  // Lọc nhóm theo từ khóa tìm kiếm
  const filteredGroups = myGroups.filter(group =>group.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const isGroupDetailPage = location.pathname.startsWith('/groups/') && location.pathname.split('/').length === 3
  const currentGroupId = isGroupDetailPage ? location.pathname.split('/groups/')[1] : null

  // Xử lý click menu
  const handleMenuClick = (view: 'feed' | 'discover' | 'my-groups') => {
    setActiveView(view)
    if (view === 'feed') {
      navigate('/groups')
    } else if (view === 'discover') {
      navigate('/groups/discover')
    } else if (view === 'my-groups') {
      navigate('/groups/my-groups')
    }
  }

  // Render nội dung chính
  const renderMainContent = () => {
    if (isGroupDetailPage) {
      return <Outlet />
    }

    switch (activeView) {
      case 'feed':
        return <GroupsFeed />
      case 'discover':
        return <GroupsDiscover />
      case 'my-groups':
        return <MyGroupsPage onGroupsUpdate={fetchMyGroups} />
      default:
        return <GroupsFeed />
    }
  }

  return (
    <>
      <CreateGroupModal
        isModalOpen={isCreateModalOpen}
        handleCancel={() => setIsCreateModalOpen(false)}
        onCreateGroupSuccess={handleCreateGroupSuccess}
      />

      <div className='flex min-h-screen bg-gray-50'>
        {/* Left Sidebar - Groups List */}
        <div className='w-80 bg-white border-r border-gray-200 sticky top-0 h-screen overflow-y-auto z-[5] transition-all duration-300 flex-shrink-0'>
          <div className='p-4'>
            {/* Header */}
            <div className='mb-4'>
              <Title level={3} className='mb-1'>
                Groups
              </Title>
            </div>

            {/* Search */}
            <Input
              placeholder='Search groups'
              prefix={<SearchOutlined className='text-gray-400' />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='mb-4'
              size='large'
            />

            {/* Menu Items */}
            <div className='space-y-2 mb-4'>
              <div
                onClick={() => handleMenuClick('feed')}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  activeView === 'feed' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                <div className='w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center'>
                  <ProfileOutlined className='text-xl' />
                </div>
                <Text strong>Your Feed</Text>
              </div>

              <div
                onClick={() => handleMenuClick('discover')}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  activeView === 'discover' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                <div className='w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center'>
                  <CompassOutlined className='text-xl' />
                </div>
                <Text strong>Discover</Text>
              </div>

              <div
                onClick={() => handleMenuClick('my-groups')}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  activeView === 'my-groups' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                <div className='w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center'>
                  <UsergroupAddOutlined className='text-xl' />
                </div>
                <Text strong>Your Groups</Text>
              </div>
            </div>

            {/* Create Group Button */}
            <Button
              type='primary'
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
              block
              size='large'
              className='mb-4'
            >
              Create New Group
            </Button>

            {/* My Groups List */}
            <div className='border-t border-gray-200 pt-4'>
              <Text strong className='text-gray-700 mb-3 block'>
                Groups You've Joined
              </Text>

              {loading ? (
                <div className='text-center py-8'>
                  <Spin />
                </div>
              ) : filteredGroups.length > 0 ? (
                <div className='space-y-1'>
                  {filteredGroups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => navigate(`/groups/${group.id}`)}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        currentGroupId === group.id ? 'bg-blue-50' : 'hover:bg-gray-100'
                      }`}
                    >
                      <Avatar
                        size={36}
                        src={group.imageUrl}
                        style={{ backgroundColor: '#E2E5E9' }}
                        onError={() => {
                          console.log('Failed to load group image')
                          return false
                        }}
                      >
                        {group.name[0].toUpperCase()}
                      </Avatar>
                      <div className='flex-1 min-w-0'>
                        <Text
                          strong
                          className='block truncate'
                          style={{
                            color: currentGroupId === group.id ? '#1890ff' : 'inherit'
                          }}
                        >
                          {group.name}
                        </Text>
                        <Text type='secondary' className='text-xs block truncate'>
                          {group.memberCount} members
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className='text-center py-8'>
                  <Text type='secondary'>{searchTerm ? 'No groups found' : "You haven't joined any groups yet"}</Text>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='flex-1 min-w-0'>{renderMainContent()}</div>
      </div>
    </>
  )
}

export default Groups