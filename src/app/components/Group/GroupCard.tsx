import { Card, Button, Typography, Space, message, Avatar, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { UserOutlined, FileTextOutlined, EyeOutlined, ClockCircleOutlined, CloseOutlined } from '@ant-design/icons'
import { GroupDto, GroupRole } from '@/app/types/Group/group.dto'
import { groupService } from '@/app/services/group.service'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const { Title, Text } = Typography

interface GroupCardProps {
  group: GroupDto
  onGroupDeleted?: (groupId: string) => void
  onGroupUpdated?: (group: GroupDto) => void
  showActions?: boolean
  isJoined?: boolean
  isPending?: boolean
  onJoinSuccess?: () => void
  currentUserId?: string
}

const GroupCard = ({
  group,
  onGroupDeleted,
  onGroupUpdated,
  showActions = true,
  isJoined = false,
  isPending = false,
  onJoinSuccess,
  currentUserId = ''
}: GroupCardProps) => {
  const [loading, setLoading] = useState(false)
  const [joined, setJoined] = useState(isJoined)
  const [pending, setPending] = useState(isPending)
  const [currentGroup, setCurrentGroup] = useState(group)
  const navigate = useNavigate()

  const handleJoinGroup = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      setLoading(true)
      await groupService.joinGroup(currentGroup.id)
      message.success('Join request sent! Waiting for approval.')
      setPending(true)
      setJoined(false)
      if (onJoinSuccess) onJoinSuccess()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to send join request'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Xử lý hủy yêu cầu tham gia
  const handleCancelJoinRequest = async () => {
    try {
      setLoading(true)
      await groupService.cancelJoinRequest(currentGroup.id)
      message.success('Join request cancelled!')
      setPending(false)
      setJoined(false)
      if (onJoinSuccess) onJoinSuccess()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to cancel request'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }
  // Xử lý rời khỏi nhóm
  const handleLeaveGroup = async () => {
    try {
      setLoading(true)
      await groupService.leaveGroup(currentGroup.id)
      message.success('Successfully left the group!')
      setJoined(false)
      if (onJoinSuccess) onJoinSuccess()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to leave group'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Xử lý xóa nhóm
  const handleDeleteGroup = async () => {
    try {
      setLoading(true)
      await groupService.deleteGroup(currentGroup.id)
      message.success('Successfully deleted the group!')
      if (onGroupDeleted) onGroupDeleted(currentGroup.id)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to delete group'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Xử lý click button khi pending
  const handlePendingClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  // Xử lý xem nhóm
  const handleViewGroup = () => {
    if (joined) {
      navigate(`/groups/${currentGroup.id}`)
    } else {
      navigate(`/group/${currentGroup.id}`)
    }
  }

  // Menu cho pending request
  const pendingMenuItems: MenuProps['items'] = [
    {
      key: 'cancel',
      label: 'Cancel Request',
      icon: <CloseOutlined />,
      danger: true,
      onClick: (e) => {
        e?.domEvent?.stopPropagation()
        handleCancelJoinRequest()
      }
    }
  ]

  return (
    <>
      <Card
        hoverable
        className='group-card'
        onClick={handleViewGroup}
        style={{ height: '100%' }}
        cover={
          <div className='relative w-full h-48 bg-gray-200 overflow-hidden'>
            {currentGroup.imageUrl && currentGroup.imageUrl !== 'default-group-image.jpg' ? (
              <img src={currentGroup.imageUrl} alt={currentGroup.name} className='w-full h-full object-cover' />
            ) : (
              <div className='w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600'>
                <Avatar
                  size={80}
                  style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
                  className='text-white text-4xl font-bold'
                >
                  {currentGroup.name[0]?.toUpperCase() || 'G'}
                </Avatar>
              </div>
            )}
          </div>
        }
      >
        <div onClick={(e) => e.stopPropagation()}>
          <Space direction='vertical' size='middle' style={{ width: '100%' }}>
            {/* Header */}
            <div className='flex justify-between items-start'>
              <div className='flex-1'>
                <Title level={4} className='mb-1'>
                  {currentGroup.name}
                </Title>
              </div>
            </div>

            {/* Stats */}
            <div className='flex gap-4'>
              <Space size='small'>
                <UserOutlined className='text-gray-500' />
                <Text type='secondary'>{currentGroup.memberCount} members</Text>
              </Space>
              <Space size='small'>
                <FileTextOutlined className='text-gray-500' />
                <Text type='secondary'>{currentGroup.postCount} posts</Text>
              </Space>
            </div>

            {/* Actions */}
            {showActions && (
              <div className='flex gap-2'>
                {!joined && !pending ? (
                  <Button type='primary' onClick={handleJoinGroup} loading={loading} block>
                    Join Group
                  </Button>
                ) : pending ? (

                  <Dropdown menu={{ items: pendingMenuItems }} trigger={['click']} placement='bottomRight'>
                    <Button
                      icon={<ClockCircleOutlined />}
                      onClick={handlePendingClick}
                      type='default'
                      loading={loading}
                      block
                    >
                      Request Pending
                    </Button>
                  </Dropdown>
                ) : (
                  <>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewGroup()
                      }}
                      style={{ flex: 1 }}
                    >
                      View Group
                    </Button>
                  </>
                )}
              </div>
            )}
          </Space>
        </div>
      </Card>
    </>
  )
}

export default GroupCard