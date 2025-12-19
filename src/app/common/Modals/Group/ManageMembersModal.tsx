import { Modal, List, Avatar, Tag, Button, message, Space, Typography, Popconfirm, Tooltip } from 'antd'
import { CrownOutlined, UserOutlined, StarOutlined, DeleteOutlined, UserDeleteOutlined } from '@ant-design/icons'
import { GroupDto, GroupUserDto } from '@/app/types/Group/group.dto'
import { groupService } from '@/app/services/group.service'
import { useState } from 'react'

const { Text } = Typography

interface ManageMembersModalProps {
  isModalOpen: boolean
  handleCancel: () => void
  group: GroupDto
  currentUserId: string
  onMembersUpdated: () => void
}

const ManageMembersModal = ({
  isModalOpen,
  handleCancel,
  group,
  currentUserId,
  onMembersUpdated
}: ManageMembersModalProps) => {
  const [loading, setLoading] = useState<string>('')

  // Lấy role của current user
  const currentUserRole = group.groupUsers?.find(gu => gu.userId === currentUserId)?.roleName || ''
  const isSuperAdmin = currentUserRole === 'SuperAdministrator'
  const isAdmin = currentUserRole === 'Administrator'

  // Đếm số admin hiện tại
  const adminCount =
    group.groupUsers?.filter(gu => gu.roleName === 'Administrator' || gu.roleName === 'SuperAdministrator').length || 0

  const handlePromote = async (targetUserId: string) => {
    try {
      setLoading(targetUserId)
      await groupService.promoteToAdmin(group.id, targetUserId)
      message.success('Successfully promoted user to admin!')
      onMembersUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to promote user'
      message.error(errorMessage)
    } finally {
      setLoading('')
    }
  }

  // Xử lý demote admin xuống user
  const handleDemote = async (targetUserId: string) => {
    try {
      setLoading(targetUserId)
      await groupService.demoteAdmin(group.id, targetUserId)
      message.success('Successfully demoted admin to member!')
      onMembersUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to demote admin'
      message.error(errorMessage)
    } finally {
      setLoading('')
    }
  }

  // Xử lý kick member
  const handleKick = async (targetUserId: string, memberName: string) => {
    try {
      setLoading(targetUserId)
      await groupService.kickMember(group.id, targetUserId)
      message.success(`Successfully kicked ${memberName} from the group!`)
      onMembersUpdated()
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to kick member'
      message.error(errorMessage)
    } finally {
      setLoading('')
    }
  }

  // Kiểm tra xem có thể kick member không
  const canKickMember = (member: GroupUserDto) => {
    const isSelf = member.userId === currentUserId
    const isMemberSuperAdmin = member.roleName === 'SuperAdministrator'
    const isMemberAdmin = member.roleName === 'Administrator'

    if (isSelf) return false
    if (isMemberSuperAdmin) return false
    if (isSuperAdmin && (isMemberAdmin || member.roleName === 'User')) {
      return true
    }
    if (isAdmin && member.roleName === 'User') {
      return true
    }
    return false
  }

  // Render action buttons cho mỗi member
  const renderActions = (member: GroupUserDto) => {
    const isSelf = member.userId === currentUserId
    const isMemberSuperAdmin = member.roleName === 'SuperAdministrator'
    const isMemberAdmin = member.roleName === 'Administrator'
    const isMemberUser = member.roleName === 'User'
    const memberName = member.user
      ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || 'this user'
      : 'this user'

    if (isSelf && isSuperAdmin) {
      return (
        <Tag color='gold' icon={<StarOutlined />}>
          You (Owner)
        </Tag>
      )
    }

    if (isSelf) {
      return <Text type='secondary'>You</Text>
    }
    if (!isSuperAdmin && !isAdmin) {
      return null
    }

    if (isMemberSuperAdmin) {
      return (
        <Tag color='gold' icon={<StarOutlined />}>
          Owner
        </Tag>
      )
    }

    const actions: React.ReactNode[] = []

    if (isSuperAdmin) {
      if (isMemberUser) {
        if (adminCount >= 10) {
          actions.push(
            <Tooltip key='promote' title='Maximum 10 admins reached'>
              <Button type='text' size='small' disabled>
                Make Admin
              </Button>
            </Tooltip>
          )
        } else {
          actions.push(
            <Popconfirm
              key='promote'
              title='Promote to Admin'
              description={`Make ${memberName} an admin?`}
              onConfirm={() => handlePromote(member.userId)}
              okText='Yes'
              cancelText='No'
            >
              <Button type='primary' size='small' ghost loading={loading === member.userId}>
                Make Admin
              </Button>
            </Popconfirm>
          )
        }
      }

      // SuperAdmin có thể demote Admin xuống User
      if (isMemberAdmin) {
        actions.push(
          <Popconfirm
            key='demote'
            title='Remove Admin Role'
            description={`Remove admin role from ${memberName}?`}
            onConfirm={() => handleDemote(member.userId)}
            okText='Yes'
            cancelText='No'
          >
            <Button danger size='small' type='text' loading={loading === member.userId} icon={<DeleteOutlined />}>
              Remove Admin
            </Button>
          </Popconfirm>
        )
      }
    }

    if (canKickMember(member)) {
      const kickReason = isSuperAdmin ? (isMemberAdmin ? 'Kick this admin?' : 'Kick this member?') : 'Kick this member?'
      actions.push(
        <Popconfirm
          key='kick'
          title='Kick Member'
          description={
            <Space direction='vertical' size={4}>
              <Text>{kickReason}</Text>
              <Text type='secondary' style={{ fontSize: '12px' }}>
                {memberName} will be removed from the group.
              </Text>
            </Space>
          }
          onConfirm={() => handleKick(member.userId, memberName)}
          okText='Kick'
          cancelText='Cancel'
          okButtonProps={{ danger: true }}
        >
          <Button danger size='small' loading={loading === member.userId} icon={<UserDeleteOutlined />}>
            Kick
          </Button>
        </Popconfirm>
      )
    }

    return actions.length > 0 ? <Space size='small'>{actions}</Space> : null
  }

  // Render role tag
  const renderRoleTag = (roleName: string) => {
    if (roleName === 'SuperAdministrator') {
      return (
        <Tag color='gold' icon={<StarOutlined />}>
          Owner
        </Tag>
      )
    }
    if (roleName === 'Administrator') {
      return (
        <Tag color='blue' icon={<CrownOutlined />}>
          Admin
        </Tag>
      )
    }
    return (
      <Tag color='default' icon={<UserOutlined />}>
        Member
      </Tag>
    )
  }

  // Sắp xếp members: SuperAdmin > Admin > User
  const sortedMembers = [...(group.groupUsers || [])].sort((a, b) => {
    const roleOrder = { 'SuperAdministrator': 0, 'Administrator': 1, 'User': 2 }
    const roleA = roleOrder[a.roleName as keyof typeof roleOrder] ?? 3
    const roleB = roleOrder[b.roleName as keyof typeof roleOrder] ?? 3
    return roleA - roleB
  })

  return (
    <Modal
      title={
        <Space direction='vertical' size={0}>
          <span>Manage Members</span>
          {!isSuperAdmin && !isAdmin && (
            <Text type='secondary' style={{ fontSize: '14px', fontWeight: 'normal' }}>
              Only admins can manage members
            </Text>
          )}
        </Space>
      }
      open={isModalOpen}
      onCancel={handleCancel}
      footer={null}
      width={650}
    >
      <div className='mb-4'>
        <Space split='|'>
          <Text type='secondary'>
            Total Members: <Text strong>{group.memberCount}</Text>
          </Text>
          <Text type='secondary'>
            Admins: <Text strong style={{ color: adminCount >= 10 ? '#ff4d4f' : undefined }}>{adminCount}/10</Text>
          </Text>
        </Space>
      </div>

      {!isSuperAdmin && isAdmin && (
        <div className='mb-4 p-3 bg-blue-50 rounded border border-blue-200'>
          <Text type='secondary' style={{ fontSize: '13px' }}>
            💡 As an admin, you can kick regular members. Only the owner can manage admin roles.
          </Text>
        </div>
      )}

      {!isSuperAdmin && !isAdmin && (
        <div className='mb-4 p-3 bg-blue-50 rounded border border-blue-200'>
          <Text type='secondary' style={{ fontSize: '13px' }}>
            💡 Only the group owner and admins can manage members.
          </Text>
        </div>
      )}

      <List
        dataSource={sortedMembers}
        renderItem={(member) => (
          <List.Item actions={[renderActions(member)]}>
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
                <Space direction='vertical' size={0}>
                  <Text type='secondary' style={{ fontSize: '12px' }}>
                    {member.user?.email || 'No email'}
                  </Text>
                  <Text type='secondary' style={{ fontSize: '12px' }}>
                    Joined: {new Date(member.joinedAt).toLocaleDateString('en-US')}
                  </Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    </Modal>
  )
}

export default ManageMembersModal