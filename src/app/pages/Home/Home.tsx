import CreatePostModal from '@/app/common/Modals/CreatePostModal'
import Post from '../Post/Post'
import { usePosts } from '@/app/hook/usePosts'
import { Avatar, Typography, Spin, Alert, Button, Empty, message } from 'antd'
import { useState, useEffect, useCallback } from 'react'
import { ReloadOutlined } from '@ant-design/icons'
import { userService } from '@/app/services/user.service'
import { UserDto } from '@/app/types/User/user.dto'
import { SeenPost } from '@/app/types/Post/Post'
import { useSeenPost } from '@/app/hook/useSeenPost'

const { Title, Text } = Typography

const Home = () => {
  const defaultUser: UserDto = {
    id: '',
    avatarUrl: '',
    firstName: 'Guest',
    lastName: '',
    email: '',
    userName: '',
    status: ''
  }
  const [isOpenCreatePost, setIsOpenCreatePost] = useState<boolean>(false)

  const [userInfo, setUserInfo] = useState<UserDto>(defaultUser)

  // Lấy user info khi component mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await userService.getUserInfoByToken()
        if (response.status === 200 && response.data) {
          if ('id' in response.data) {
            const userData = response.data as UserDto
            setUserInfo(userData)
          }
        }
      } catch (error) {
        message.error('Error fetching current user')
      }
    }
    fetchCurrentUser()
  }, [])

  const {
    posts,
    loading,
    error,
    hasMore,
    refetch,
    loadMore,
    clearError,
    handlePostCreated,
    handlePostUpdated,
    handlePostDeleted,
    handleSeenPost
  } = usePosts()

  // Đóng modal tạo bài đăng
  const handleCloseCreatePost = () => {
    setIsOpenCreatePost(false)
  }

  // Xử lý tạo bài đăng mới
  const handleCreatePostSuccess = async () => {
    setIsOpenCreatePost(false)
    handlePostCreated()
  }

  const { addSeen, flushNow } = useSeenPost(async (postsInfo: SeenPost[]) => {
    handleSeenPost(postsInfo)
  })

  useEffect(() => {
    return () => {
      flushNow()
    }
  }, [flushNow])

  // Cuộn vô hạn được cải thiện với giới hạn tần suất
  const handleScroll = useCallback(() => {
    const scrollTop = document.documentElement.scrollTop
    const scrollHeight = document.documentElement.scrollHeight
    const clientHeight = window.innerHeight

    // Tải thêm khi người dùng cuộn đến 80% trang
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight

    if (scrollPercentage > 0.8 && !loading && hasMore) {
      loadMore()
    }
  }, [loading, hasMore, loadMore])

  // Thêm sự kiện cuộn với giới hạn tần suất
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const throttledScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleScroll, 100) // Giới hạn để tránh gọi quá nhiều
    }

    window.addEventListener('scroll', throttledScroll)
    return () => {
      window.removeEventListener('scroll', throttledScroll)
      clearTimeout(timeoutId)
    }
  }, [handleScroll])

  // Hiển thị cảnh báo lỗi
  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 py-6'>
        <div className='max-w-2xl mx-auto px-4'>
          <Alert
            message='Failed to load data'
            description={error}
            type='error'
            action={
              <Button
                size='small'
                danger
                onClick={() => {
                  clearError()
                  refetch()
                }}
              >
                <ReloadOutlined /> Try again
              </Button>
            }
            closable
            onClose={clearError}
          />
        </div>
      </div>
    )
  }

  // Hiển thị trạng thái tải ban đầu
  if (loading && posts.length === 0) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Spin size='large' />
          <div className='mt-4'>
            <Text type='secondary'>Loading posts...</Text>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 py-6'>
      <CreatePostModal
        isModalOpen={isOpenCreatePost}
        handleCancel={handleCloseCreatePost}
        onCreatePostSuccess={handleCreatePostSuccess}
        currentUser={userInfo}
      />

      <div className='max-w-2xl mx-auto px-4'>
        {/* Create Post Section */}
        <div className='bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200'>
          <div
            onClick={() => setIsOpenCreatePost(true)}
            className='flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors'
          >
            <Avatar size={48} src={userInfo?.avatarUrl} />
            <div className='flex-1 bg-neutral-100 rounded-full px-4 py-3 text-neutral-600 hover:bg-neutral-200 transition-colors'>
              What's on your mind?
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div>
          {posts.length > 0 ? (
            <>
              <div className='space-y-4'>
                {posts.map((feed) => (
                  <div key={feed.feedId}>
                    <Post
                      {...feed.post}
                      feedId={feed.feedId}
                      feedCreatedAt={feed.createdAt}
                      currentUserId={userInfo?.id || ''}
                      onPostUpdated={handlePostUpdated}
                      onPostDeleted={handlePostDeleted}
                      onSeen={addSeen}
                      currentUser={userInfo}
                    />
                  </div>
                ))}
              </div>

              {/* Chỉ báo tải cho cuộn vô hạn */}
              {loading && (
                <div className='text-center py-6'>
                  <Spin />
                  <div className='mt-2'>
                    <Text type='secondary'>Loading more posts...</Text>
                  </div>
                </div>
              )}

              {/* Nút tải thêm */}
              {!loading && hasMore && (
                <div className='text-center py-6'>
                  <Button onClick={loadMore} type='default' size='large'>
                    Load more posts
                  </Button>
                </div>
              )}

              {/* Thông báo hết bài đăng */}
              {!hasMore && posts.length > 0 && (
                <div className='text-center py-6'>
                  <Text type='secondary'>🎉 You’ve reached the end of all posts!</Text>
                </div>
              )}
            </>
          ) : (
            /* Trạng thái trống */
            <div className='bg-white rounded-xl shadow-sm border border-gray-200 p-8'>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <div>
                    <Title level={4} type='secondary' className='mb-2'>
                      No posts yet
                    </Title>
                    <Text type='secondary'>Be the first to share something interesting!</Text>
                  </div>
                }
              >
                <Button type='primary' onClick={() => setIsOpenCreatePost(true)} className='mt-4'>
                  Create the first post
                </Button>
              </Empty>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default Home
