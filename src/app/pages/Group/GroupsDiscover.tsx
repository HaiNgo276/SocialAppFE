import { useState, useEffect, useCallback } from 'react'
import { Typography, Button, Spin, Empty, Row, Col } from 'antd'
import { useGroups } from '@/app/hook/useGroups'
import { userService } from '@/app/services/user.service'
import { UserDto } from '@/app/types/User/user.dto'
import { GroupRole } from '@/app/types/Group/group.dto'
import GroupCard from '../../components/Group/GroupCard'

const { Title, Text } = Typography

const GroupsDiscover = () => {
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null)

  const { groups, loading, hasMore, fetchGroups, loadMore, refetch } = useGroups()

  useEffect(() => {
    fetchCurrentUser()
    fetchGroups(true)
  }, [])

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

  // Xử lý cuộn vô hạn
  const handleScroll = useCallback(() => {
    const scrollTop = document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = window.innerHeight
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

    if (scrollPercentage > 0.8 && !loading && hasMore) {
      loadMore()
    }
  }, [loading, hasMore, loadMore])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const throttledScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleScroll, 100)
    }

    window.addEventListener('scroll', throttledScroll)
    return () => {
      window.removeEventListener('scroll', throttledScroll)
      clearTimeout(timeoutId)
    }
  }, [handleScroll])

  return (
    <div className='max-w-6xl mx-auto py-6 px-4'>
      {/* Header */}
      <div className='mb-6'>
        <Title level={2}>Discover</Title>
        <Text type='secondary'>Find and join new groups</Text>
      </div>

      {/* Groups Grid */}
      {loading && groups.length === 0 ? (
        <div className='text-center py-12'>
          <Spin size='large' />
          <div className='mt-4'>
            <Text type='secondary'>Loading groups...</Text>
          </div>
        </div>
      ) : groups.length > 0 ? (
        <>
          <Row gutter={[16, 16]}>
            {groups.map((group) => {
              // Check if current user is already a member
              const userStatus = group.groupUsers?.find(gu => gu.userId === currentUser?.id)
              const isJoined = userStatus && userStatus.roleName !== GroupRole.Pending
              const isPending = userStatus?.roleName === GroupRole.Pending

              return (
                <Col xs={24} sm={12} lg={8} xl={6} key={group.id}>
                  <GroupCard
                    group={group}
                    showActions={true}
                    isJoined={!!isJoined}
                    isPending={!!isPending}
                    currentUserId={currentUser?.id || ''}
                    onJoinSuccess={() => refetch()}
                  />
                </Col>
              )
            })}
          </Row>

          {loading && (
            <div className='text-center py-6'>
              <Spin />
              <div className='mt-2'>
                <Text type='secondary'>Loading more groups...</Text>
              </div>
            </div>
          )}

          {!loading && hasMore && (
            <div className='text-center py-6'>
              <Button onClick={loadMore} type='default' size='large'>
                Load More Groups
              </Button>
            </div>
          )}

          {!hasMore && groups.length > 0 && (
            <div className='text-center py-6'>
              <Text type='secondary'>🎉 You've seen all the groups!</Text>
            </div>
          )}
        </>
      ) : (
        <Empty description='No groups found' image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  )
}

export default GroupsDiscover