import { Modal, List, Avatar, Button, message, Space, Typography, Popconfirm, Empty, Spin } from 'antd'
import { CheckOutlined, CloseOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { GroupUserDto } from '@/app/types/Group/group.dto'
import { groupService } from '@/app/services/group.service'
import { useState, useEffect } from 'react'

const { Text, Title } = Typography

interface PendingJoinRequestsModalProps {
  isModalOpen: boolean
  handleCancel: () => void
  groupId: string
  onRequestsUpdated: () => void
}

const PendingJoinRequestsModal = ({
  isModalOpen,
  handleCancel,
  groupId,
  onRequestsUpdated
}: PendingJoinRequestsModalProps) => {
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string>('')
  const [pendingRequests, setPendingRequests] = useState<GroupUserDto[]>([])

  useEffect(() => {
    if (isModalOpen) {
      fetchPendingRequests()
    }
  }, [isModalOpen, groupId])

  const fetchPendingRequests = async () => {
    try {
      setLoading(true)
      const response = await groupService.getPendingJoinRequests(groupId, 0, 50)
      setPendingRequests(response.pendingRequests || [])
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to load pending requests'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (targetUserId: string, userName: string) => {
    try {
      setActionLoading(targetUserId)
      await groupService.approveJoinRequest(groupId, targetUserId)
      message.success(`Approved ${userName}'s request to join!`)
      await fetchPendingRequests()
      onRequestsUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to approve request'
      message.error(errorMessage)
    } finally {
      setActionLoading('')
    }
  }

  const handleReject = async (targetUserId: string, userName: string) => {
    try {
      setActionLoading(targetUserId)
      await groupService.rejectJoinRequest(groupId, targetUserId)
      message.success(`Rejected ${userName}'s request`)
      await fetchPendingRequests()
      onRequestsUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to reject request'
      message.error(errorMessage)
    } finally {
      setActionLoading('')
    }
  }

  const renderActions = (request: GroupUserDto) => {
    const userName = request.user
      ? `${request.user.firstName || ''} ${request.user.lastName || ''}`.trim() || 'this user'
      : 'this user'

    return (
      <Space>
        <Popconfirm
          title='Approve Request'
          description={`Allow ${userName} to join the group?`}
          onConfirm={() => handleApprove(request.userId, userName)}
          okText='Approve'
          cancelText='Cancel'
          okButtonProps={{ type: 'primary' }}
        >
          <Button type='primary' icon={<CheckOutlined />} loading={actionLoading === request.userId} size='small'>
            Approve
          </Button>
        </Popconfirm>

        <Popconfirm
          title='Reject Request'
          description={`Reject ${userName}'s request to join?`}
          onConfirm={() => handleReject(request.userId, userName)}
          okText='Reject'
          cancelText='Cancel'
          okButtonProps={{ danger: true }}
        >
          <Button danger icon={<CloseOutlined />} loading={actionLoading === request.userId} size='small'>
            Reject
          </Button>
        </Popconfirm>
      </Space>
    )
  }

  return (
    <Modal
      title={
        <Space direction='vertical' size={0}>
          <Title level={4} style={{ margin: 0 }}>
            Join Requests
          </Title>
          <Text type='secondary' style={{ fontSize: '14px', fontWeight: 'normal' }}>
            Manage pending requests to join this group
          </Text>
        </Space>
      }
      open={isModalOpen}
      onCancel={handleCancel}
      footer={null}
      width={650}
    >
      {loading ? (
        <div className='text-center py-8'>
          <Spin size='large' />
        </div>
      ) : pendingRequests.length > 0 ? (
        <>
          <div className='mb-4'>
            <Text type='secondary'>
              Pending Requests: <Text strong>{pendingRequests.length}</Text>
            </Text>
          </div>

          <List
            dataSource={pendingRequests}
            renderItem={(request) => (
              <List.Item actions={[renderActions(request)]}>
                <List.Item.Meta
                  avatar={
                    <Avatar size={48} src={request.user?.avatarUrl}>
                      {request.user?.firstName?.[0]?.toUpperCase() || 'U'}
                    </Avatar>
                  }
                  title={
                    <Space>
                      <span>
                        {request.user
                          ? `${request.user.firstName || ''} ${request.user.lastName || ''}`.trim() || 'Unknown User'
                          : 'Unknown User'}
                      </span>
                      <ClockCircleOutlined style={{ color: '#faad14' }} />
                    </Space>
                  }
                  description={
                    <Space direction='vertical' size={0}>
                      <Text type='secondary' style={{ fontSize: '12px' }}>
                        {request.user?.email || 'No email'}
                      </Text>
                      <Text type='secondary' style={{ fontSize: '12px' }}>
                        Requested: {new Date(request.joinedAt).toLocaleDateString('en-US')}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </>
      ) : (
        <Empty description='No pending join requests' image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Modal>
  )
}

export default PendingJoinRequestsModal