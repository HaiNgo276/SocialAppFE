import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Typography,
  Button,
  Spin,
  Space,
  Tag,
  message,
  Modal,
  Avatar,
  Card,
  Tabs,
  Empty,
  Dropdown,
  List,
  Badge
} from 'antd'
import type { MenuProps } from 'antd'
import {
  GlobalOutlined,
  LockOutlined,
  UserOutlined,
  FileTextOutlined,
  CheckOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  CrownOutlined,
  StarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  BellOutlined
} from '@ant-design/icons'
import { groupService } from '@/app/services/group.service'
import { GroupDto, GroupRole } from '@/app/types/Group/group.dto'
import { PostData } from '@/app/types/Post/Post'
import Post from '../Post/Post'
import CreatePostModal from '@/app/common/Modals/CreatePostModal'
import EditGroupModal from '@/app/common/Modals/Group/EditGroupModal'
import ManageMembersModal from '@/app/common/Modals/Group/ManageMembersModal'
import PendingJoinRequestsModal from '@/app/common/Modals/Group/PendingJoinRequestsModal'
import { userService } from '@/app/services/user.service'
import { UserDto } from '@/app/types/User/user.dto'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

const GroupDetail = () => {
  const defaultUser: UserDto = {
    id: '',
    avatarUrl: '',
    firstName: 'Guest',
    lastName: '',
    email: '',
    userName: '',
    status: ''
  }
  const { groupId } = useParams<{ groupId: string }>()
  const navigate = useNavigate()

  const [group, setGroup] = useState<GroupDto | null>(null)
  const [posts, setPosts] = useState<PostData[]>([])
  const [loading, setLoading] = useState(true)
  const [isJoined, setIsJoined] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [isEditGroupOpen, setIsEditGroupOpen] = useState(false)
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false)
  const [isPendingRequestsOpen, setIsPendingRequestsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserDto>(defaultUser)
  const [pendingRequestCount, setPendingRequestCount] = useState(0)

  // Kiểm tra role của người dùng hiện tại
  const currentUserRole = group?.groupUsers?.find((gu) => gu.userId === currentUser?.id)?.roleName || ''
  const isSuperAdmin = currentUserRole === 'SuperAdministrator'
  const isAdmin = currentUserRole === GroupRole.Administrator || isSuperAdmin

  // Lấy thông tin người dùng hiện tại
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

  // Lấy chi tiết nhóm
  useEffect(() => {
    const fetchGroupDetail = async () => {
      if (!groupId) return

      try {
        setLoading(true)
        const response = await groupService.getGroupById(groupId)

        if (response.group) {
          setGroup(response.group)
          const userStatus = response.group.groupUsers?.find((gu) => gu.userId === currentUser.id)

          if (userStatus) {
            if (userStatus.roleName === GroupRole.Pending) {
              setIsPending(true)
              setIsJoined(false)
            } else {
              setIsJoined(true)
              setIsPending(false)
            }
          } else {
            setIsJoined(false)
            setIsPending(false)
          }

          if (response.group.posts) {
            setPosts(response.group.posts as unknown as PostData[])
          }

          // Đếm số pending requests (chỉ cho admin)
          if (
            userStatus &&
            (userStatus.roleName === GroupRole.Administrator || userStatus.roleName === GroupRole.SuperAdministrator)
          ) {
            const pendingCount =
              response.group.groupUsers?.filter((gu) => gu.roleName === GroupRole.Pending).length || 0
            setPendingRequestCount(pendingCount)
          }
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch group details'
        message.error(errorMessage)
        navigate('/groups')
      } finally {
        setLoading(false)
      }
    }

    if (currentUser.id) {
      fetchGroupDetail()
    }
  }, [groupId, navigate, currentUser.id])

  // Refresh group data
  const refreshGroupData = async () => {
    if (!groupId) return
    try {
      const response = await groupService.getGroupById(groupId)
      if (response.group) {
        setGroup(response.group)
        const userStatus = response.group.groupUsers?.find((gu) => gu.userId === currentUser.id)
        if (userStatus) {
          if (userStatus.roleName === GroupRole.Pending) {
            setIsPending(true)
            setIsJoined(false)
          } else {
            setIsJoined(true)
            setIsPending(false)
          }
        } else {
          setIsJoined(false)
          setIsPending(false)
        }

        if (response.group.posts) {
          setPosts(response.group.posts as unknown as PostData[])
        }

        // Update pending count
        if (
          userStatus &&
          (userStatus.roleName === GroupRole.Administrator || userStatus.roleName === GroupRole.SuperAdministrator)
        ) {
          const pendingCount = response.group.groupUsers?.filter((gu) => gu.roleName === GroupRole.Pending).length || 0
          setPendingRequestCount(pendingCount)
        }
      }
    } catch (error) {
      console.error('Error refreshing group data:', error)
    }
  }

  // Xử lý tham gia nhóm
  const handleJoinGroup = async () => {
    if (!groupId) return

    try {
      await groupService.joinGroup(groupId)
      message.success('Join request sent! Waiting for approval.')
      await refreshGroupData()
      setIsPending(true)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to send join request'
      message.error(errorMessage)
    }
  }

  // Xử lý hủy yêu cầu tham gia
  const handleCancelJoinRequest = async () => {
    if (!groupId) return

    try {
      await groupService.cancelJoinRequest(groupId)
      message.success('Join request cancelled')
      setIsPending(false)
      await refreshGroupData()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to cancel request'
      message.error(errorMessage)
    }
    // Modal.confirm({
    //   title: 'Cancel Join Request',
    //   content: 'Are you sure you want to cancel your join request?',
    //   okText: 'Cancel Request',
    //   cancelText: 'Keep Request',
    //   okType: 'danger',
    //   onOk: async () => {
    //     try {
    //       await groupService.cancelJoinRequest(groupId)
    //       message.success('Join request cancelled')
    //       setIsPending(false)
    //       await refreshGroupData()
    //     } catch (error: any) {
    //       const errorMessage = error?.response?.data?.message || 'Unable to cancel request'
    //       message.error(errorMessage)
    //     }
    //   }
    // })
  }

  // Xử lý rời khỏi nhóm
  const handleLeaveGroup = async () => {
    if (!groupId) return

    Modal.confirm({
      title: 'Leave Group',
      content: 'Are you sure you want to leave this group?',
      okText: 'Leave',
      cancelText: 'Cancel',
      okType: 'danger',
      onOk: async () => {
        try {
          await groupService.leaveGroup(groupId)
          message.success('Successfully left the group!')
          setIsJoined(false)
          navigate('/groups')
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || 'Unable to leave group'
          message.error(errorMessage)
        }
      }
    })
  }

  // Xử lý xóa nhóm
  const handleDeleteGroup = async () => {
    if (!groupId) return

    Modal.confirm({
      title: 'Delete Group',
      content: 'Are you sure you want to delete this group? This action cannot be undone.',
      okText: 'Delete',
      cancelText: 'Cancel',
      okType: 'danger',
      onOk: async () => {
        try {
          await groupService.deleteGroup(groupId)
          message.success('Successfully deleted the group!')
          navigate('/groups')
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || 'Unable to delete group'
          message.error(errorMessage)
        }
      }
    })
  }

  const handlePostCreated = async () => {
    setIsCreatePostOpen(false)
    await refreshGroupData()
  }

  const handleEditGroupSuccess = (updatedGroup: GroupDto) => {
    setGroup(updatedGroup)
    setIsEditGroupOpen(false)
    message.success('Group has been updated!')
  }

  const handleMembersUpdated = async () => {
    await refreshGroupData()
  }

  // Menu cho pending request
  const pendingMenuItems: MenuProps['items'] = [
    {
      key: 'cancel',
      label: 'Cancel Request',
      icon: <CloseOutlined />,
      danger: true,
      onClick: handleCancelJoinRequest
    }
  ]

  // Menu cho người dùng đã tham gia (User và Admin có thể leave)
  const joinedMenuItems: MenuProps['items'] = [
    {
      key: 'leave',
      label: 'Leave Group',
      icon: <DeleteOutlined />,
      danger: true,
      onClick: handleLeaveGroup
    }
  ]

  // Menu cho admin (Admin và SuperAdmin)
  const adminMenuItems: MenuProps['items'] = [
    {
      key: 'pending-requests',
      label: (
        <Space>
          <span>Join Requests</span>
          {pendingRequestCount > 0 && <Badge count={pendingRequestCount} style={{ backgroundColor: '#52c41a' }} />}
        </Space>
      ),
      icon: <BellOutlined />,
      onClick: () => setIsPendingRequestsOpen(true)
    },
    {
      key: 'manage',
      label: 'Manage Members',
      icon: <TeamOutlined />,
      onClick: () => setIsManageMembersOpen(true)
    },
    {
      key: 'edit',
      label: 'Edit Group',
      icon: <EditOutlined />,
      onClick: () => setIsEditGroupOpen(true)
    },

    ...(isSuperAdmin
      ? []
      : [
          {
            key: 'leave',
            label: 'Leave Group',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: handleLeaveGroup
          }
        ]),
    ...(isSuperAdmin
      ? [
          {
            key: 'delete',
            label: 'Delete Group',
            icon: <DeleteOutlined />,
            danger: true,
            onClick: handleDeleteGroup
          }
        ]
      : [])
  ]

  // Render role tag
  const renderRoleTag = (roleName: string) => {
    if (roleName === GroupRole.SuperAdministrator) {
      return (
        <Tag color='gold' icon={<StarOutlined />}>
          Owner
        </Tag>
      )
    }
    if (roleName === GroupRole.Administrator) {
      return (
        <Tag color='blue' icon={<CrownOutlined />}>
          Admin
        </Tag>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Spin size='large' />
      </div>
    )
  }

  if (!group) {
    return null
  }

  return (
    <div className='max-w-4xl mx-auto py-6 px-4'>
      <CreatePostModal
        isModalOpen={isCreatePostOpen}
        handleCancel={() => setIsCreatePostOpen(false)}
        onCreatePostSuccess={handlePostCreated}
        groupId={groupId}
        currentUser={currentUser}
      />

      {group && (
        <>
          <EditGroupModal
            isModalOpen={isEditGroupOpen}
            handleCancel={() => setIsEditGroupOpen(false)}
            onEditGroupSuccess={handleEditGroupSuccess}
            group={group}
          />
          <ManageMembersModal
            isModalOpen={isManageMembersOpen}
            handleCancel={() => setIsManageMembersOpen(false)}
            group={group}
            currentUserId={currentUser.id}
            onMembersUpdated={handleMembersUpdated}
          />
          <PendingJoinRequestsModal
            isModalOpen={isPendingRequestsOpen}
            handleCancel={() => setIsPendingRequestsOpen(false)}
            groupId={groupId || ''}
            onRequestsUpdated={handleMembersUpdated}
          />
        </>
      )}

      {/* Group Header with Image */}
      <Card className='mb-6 overflow-hidden'>
        <div className='relative -mt-6 -mx-6 mb-4'>
          {group.imageUrl && (
            <div className='w-full h-64 overflow-hidden'>
              <img
                src={group.imageUrl}
                alt={group.name}
                className='w-full h-full object-cover'
                style={{ maxWidth: '100%', display: 'block' }}
              />
            </div>
          )}
        </div>

        <Space direction='vertical' size='large' style={{ width: '100%' }}>
          <div className='flex justify-between items-start'>
            <div className='flex-1'>
              <Title level={2} className='mb-2'>
                {group.name}
              </Title>
              <Space>
                <Tag
                  icon={group.isPublic ? <GlobalOutlined /> : <LockOutlined />}
                  color={group.isPublic ? 'blue' : 'orange'}
                >
                  {group.isPublic ? 'Public Group' : 'Private Group'}
                </Tag>
              </Space>
            </div>

            <Space>
              {!isJoined && !isPending ? (
                <Button type='primary' size='large' onClick={handleJoinGroup}>
                  Join Group
                </Button>
              ) : isPending ? (
                <Dropdown menu={{ items: pendingMenuItems }} trigger={['click']}>
                  <Button icon={<ClockCircleOutlined />} type='default'>
                    Request Pending
                  </Button>
                </Dropdown>
              ) : (
                <>
                  {isAdmin ? (
                    <Dropdown menu={{ items: adminMenuItems }} trigger={['click']} placement='bottomRight'>
                      <Button icon={<MoreOutlined />}>
                        {pendingRequestCount > 0 && <Badge count={pendingRequestCount} offset={[10, 0]} />}
                      </Button>
                    </Dropdown>
                  ) : (
                    <Dropdown menu={{ items: joinedMenuItems }} trigger={['click']}>
                      <Button icon={<CheckOutlined />} type='default'>
                        Joined
                      </Button>
                    </Dropdown>
                  )}
                </>
              )}
            </Space>
          </div>

          <Paragraph className='text-base'>{group.description}</Paragraph>

          <div className='flex gap-6'>
            <Space size='small'>
              <UserOutlined className='text-gray-500' />
              <Text strong>{group.memberCount}</Text>
              <Text type='secondary'>members</Text>
            </Space>
            <Space size='small'>
              <FileTextOutlined className='text-gray-500' />
              <Text strong>{group.postCount}</Text>
              <Text type='secondary'>posts</Text>
            </Space>
          </div>
        </Space>
      </Card>

      {/* Content */}
      {isJoined && !isPending ? (
        <Tabs defaultActiveKey='posts' size='large'>
          <TabPane tab='Discussion' key='posts'>
            <div className='bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200'>
              <div
                onClick={() => setIsCreatePostOpen(true)}
                className='flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors'
              >
                <Avatar size={48} src={currentUser?.avatarUrl} />
                <div className='flex-1 bg-neutral-100 rounded-full px-4 py-3 text-neutral-600 hover:bg-neutral-200 transition-colors'>
                  What's on your mind...
                </div>
              </div>
            </div>

            {posts.length > 0 ? (
              <div className='space-y-4'>
                {posts.map((post) => (
                  <Post
                    key={post.id}
                    {...post}
                    currentUserId={currentUser?.id || ''}
                    currentUser={currentUser}
                    onPostUpdated={handlePostCreated}
                    onPostDeleted={handlePostCreated}
                    onSeen={() => {}}
                  />
                ))}
              </div>
            ) : (
              <Empty description='No posts yet' image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Button type='primary' onClick={() => setIsCreatePostOpen(true)}>
                  Create the first post
                </Button>
              </Empty>
            )}
          </TabPane>

          <TabPane tab='Members' key='members'>
            <Card>
              <Title level={4} className='mb-0'>
                Members ({group.groupUsers?.length || 0})
              </Title>
              <List
                dataSource={group.groupUsers || []}
                renderItem={(member) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar size={48} src={member.user?.avatarUrl}>
                          {member.user?.firstName?.[0]?.toUpperCase() || 'U'}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <span>
                            {member.user
                              ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'Unknown User'
                              : 'Unknown User'}
                          </span>
                          {renderRoleTag(member.roleName)}
                        </Space>
                      }
                      description={
                        <Text type='secondary'>Joined: {new Date(member.joinedAt).toLocaleDateString('en-US')}</Text>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </TabPane>

          <TabPane tab='About' key='about'>
            <Card>
              <Space direction='vertical' size='large' style={{ width: '100%' }}>
                <div>
                  <Title level={4}>About this group</Title>
                  <Paragraph>{group.description}</Paragraph>
                </div>
                <div>
                  <Title level={4}>Privacy</Title>
                  <Paragraph>
                    {group.isPublic
                      ? 'This is a public group. Anyone can see posts and members.'
                      : 'This is a private group. Only members can see posts.'}
                  </Paragraph>
                </div>
              </Space>
            </Card>
          </TabPane>
        </Tabs>
      ) : isPending ? (
        <Card>
          <Empty
            description={
              <Space direction='vertical'>
                <Text>Your join request is pending approval</Text>
                <Text type='secondary'>Please wait for an administrator to approve your request</Text>
              </Space>
            }
            image={<ClockCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />}
          />
        </Card>
      ) : (
        <Card>
          <Empty
            description='Join this group to view posts and interact with members'
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type='primary' size='large' onClick={handleJoinGroup}>
              Join Group
            </Button>
          </Empty>
        </Card>
      )}
    </div>
  )
}

export default GroupDetail
