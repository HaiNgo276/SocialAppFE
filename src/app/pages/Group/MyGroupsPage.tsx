import { useState, useEffect } from 'react'
import { Typography, Spin, Empty, Row, Col, message } from 'antd'
import { groupService } from '@/app/services/group.service'
import { userService } from '@/app/services/user.service'
import { GroupDto, GroupRole } from '@/app/types/Group/group.dto'
import { UserDto } from '@/app/types/User/user.dto'
import GroupCard from '../../components/Group/GroupCard'

const { Title, Text } = Typography

interface MyGroupsPageProps {
  onGroupsUpdate?: () => void
}

const MyGroupsPage = ({ onGroupsUpdate }: MyGroupsPageProps) => {
  const [groups, setGroups] = useState<GroupDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null)

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser?.id) {
      fetchMyGroups()
    }
  }, [currentUser])

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

  // Lấy danh sách các nhóm của người dùng
  const fetchMyGroups = async () => {
    try {
      setLoading(true)
      const response = await groupService.getMyGroups(0, 100)

      const approvedGroups = (response.groups || []).filter(group => {
        const userStatus = group.groupUsers?.find(gu => gu.userId === currentUser?.id)
        return userStatus && userStatus.roleName !== GroupRole.Pending
      })

      setGroups(approvedGroups)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to load your groups'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Xử lý khi xóa nhóm
  const handleGroupDeleted = (groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId))
    if (onGroupsUpdate) onGroupsUpdate()
  }

  // Xử lý khi cập nhật nhóm
  const handleGroupUpdated = (updatedGroup: GroupDto) => {
    setGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g))
    if (onGroupsUpdate) onGroupsUpdate()
  }

  return (
    <div className='max-w-7xl mx-auto py-6 px-4'>
      {/* Header */}
      <div className='mb-6'>
        <Title level={4}>All groups you've joined ({groups.length})</Title>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className='text-center py-12'>
          <Spin size='large' />
          <div className='mt-4'>
            <Text type='secondary'>Loading your groups...</Text>
          </div>
        </div>
      ) : groups.length > 0 ? (
        <Row gutter={[16, 16]}>
          {groups.map((group) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={group.id}>
              <GroupCard
                group={group}
                showActions={true}
                isJoined={true}
                isPending={false}
                currentUserId={currentUser?.id || ''}
                onGroupDeleted={handleGroupDeleted}
                onGroupUpdated={handleGroupUpdated}
                onJoinSuccess={() => fetchMyGroups()}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Empty description="You haven't joined any groups yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  )
}

export default MyGroupsPage