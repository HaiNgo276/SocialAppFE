import { useState, useEffect, useCallback } from 'react'
import { PostData, SeenPost } from '../types/Post/Post'
import { postService } from '../services/post.service'
import { message } from 'antd'
import { FeedDto } from '../types/Base/Responses/Feed/FeedDto.dto'

interface UsePostsReturn {
  posts: FeedDto[]
  loading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => Promise<void>
  refetch: () => Promise<void>
  clearError: () => void
  handlePostCreated: () => void
  handlePostUpdated: (updatedPost: PostData) => void
  handlePostDeleted: (postId: string) => void
  handleSeenPost: (post: SeenPost[]) => void
}

const POSTS_PER_PAGE = 10

export const usePosts = (): UsePostsReturn => {
  const [posts, setPosts] = useState<FeedDto[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [currentSkip, setCurrentSkip] = useState<number>(0)

  // Lấy danh sách bài đăng
  const fetchPosts = useCallback(
    async (reset: boolean = false) => {
      if (loading) return

      try {
        setLoading(true)
        setError(null)

        const skip = reset ? 0 : currentSkip
        const response = await postService.getAllPosts(skip, POSTS_PER_PAGE)

        if (response.message && response.message.includes('successfully')) {
          const postsData = response.posts || []

          if (reset) {
            setPosts(postsData)
            setCurrentSkip(POSTS_PER_PAGE)
          } else {
            setPosts((prev) => [...prev, ...postsData])
            setCurrentSkip((prev) => prev + POSTS_PER_PAGE)
          }
          // Kiểm tra còn bài đăng để tải không
          setHasMore(postsData.length === POSTS_PER_PAGE)
        } else {
          throw new Error('Failed to load posts')
        }
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load posts'
        setError(errorMessage)
        message.error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [currentSkip, loading]
  )

  // Làm mới danh sách bài đăng
  const refetch = useCallback(async () => {
    setCurrentSkip(0)
    await fetchPosts(true)
  }, [fetchPosts])

  // Các function để reload sau khi có thay đổi
  const handlePostCreated = useCallback(async () => {
    await refetch()
  }, [refetch])

  const handlePostUpdated = useCallback((updatedPost: PostData) => {
    setPosts((prevFeeds) =>
      prevFeeds.map((feed) =>
        feed.post.id === updatedPost.id ? { ...feed, post: { ...feed.post, ...updatedPost } } : feed
      )
    )
  }, [])

  const handleSeenPost = (postsInfo: SeenPost[]) => {
    try {
      postService.seenPost(postsInfo)
    } catch (err) {
      console.log('Seen post failed')
    }
  }

  const handlePostDeleted = useCallback((postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((feed) => feed.post.id !== postId))
  }, [])

  // Tải thêm bài đăng
  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await fetchPosts(false)
    }
  }, [fetchPosts, loading, hasMore])

  // Xóa thông báo lỗi
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Tải bài đăng lần đầu khi component được gắn
  useEffect(() => {
    fetchPosts(true)
  }, [])

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refetch,
    clearError,
    handlePostCreated,
    handlePostUpdated,
    handlePostDeleted,
    handleSeenPost
  }
}
