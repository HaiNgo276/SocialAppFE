import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { message, Spin } from 'antd'
import PostCommentModal from '../Comment/PostCommentModal'
import { postService } from '../../services/post.service'
import { userService } from '../../services/user.service'
import { PostData } from '../../types/Post/Post'
import { UserDto } from '../../types/User/user.dto'

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()

  const [post, setPost] = useState<PostData | null>(null)
  const [currentUser, setCurrentUser] = useState<UserDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!postId) {
        message.error('Post ID not found')
        navigate(-1)
        return
      }

      try {
        setLoading(true)
        // Lấy thông tin user hiện tại
        const userResponse = await userService.getUserInfoByToken()
        if (userResponse.status === 200 && userResponse.data && 'id' in userResponse.data) {
          setCurrentUser(userResponse.data as UserDto)
        }

        // Lấy thông tin bài post
        const postResponse = await postService.getPostById(postId)
        if (postResponse && postResponse.post) {
          setPost(postResponse.post)
        } else {
          message.error('Post not found')
          navigate(-1)
        }
      } catch (error) {
        console.error('Error fetching post:', error)
        message.error('Failed to load post')
        navigate(-1)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [postId, navigate])

  const handleClose = () => {
    navigate(-1)
  }

  const handleCommentCountChange = (newCount: number) => {
    if (post) {
      setPost({ ...post, totalComment: newCount })
    }
  }

  const handlePostReaction = async (postId: string, reaction: string) => {
    try {
      await postService.reactionPost(postId, reaction)
      // Reload lại post để cập nhật reactions
      const postResponse = await postService.getPostById(postId)
      if (postResponse && postResponse.post) {
        setPost(postResponse.post)
      }
    } catch (error) {
      message.error('Failed to react to post')
    }
  }

  const handlePostUpdated = (updatedPost: PostData) => {
    setPost(updatedPost)
  }

  const handlePostDeleted = () => {
    message.success('Post deleted successfully')
    navigate(-1)
  }

  if (loading) {
    return (
      <div className='fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center'>
        <div className='bg-white rounded-lg p-8'>
          <Spin size='large' />
          <div className='mt-4 text-center text-gray-600'>Loading post...</div>
        </div>
      </div>
    )
  }

  if (!post || !currentUser) {
    return null
  }

  return (
    <PostCommentModal
      isOpen={true}
      onClose={handleClose}
      postId={post.id}
      currentUserId={currentUser.id}
      currentUser={currentUser}
      postContent={post.content || ''}
      postUser={post.user}
      postImages={post.postImages}
      postCreatedAt={post.createdAt}
      postPrivacy={post.postPrivacy}
      totalLiked={post.totalLiked}
      totalComment={post.totalComment}
      postReactionUsers={post.postReactionUsers || []}
      onCommentCountChange={handleCommentCountChange}
      onPostReaction={handlePostReaction}
      onPostUpdated={handlePostUpdated}
      onPostDeleted={handlePostDeleted}
    />
  )
}

export default PostDetail