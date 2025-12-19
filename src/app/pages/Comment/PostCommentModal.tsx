import React, { useState, useEffect, useRef } from 'react'
import { Avatar, message } from 'antd'
import {
  CloseOutlined,
  ShareAltOutlined,
  MessageOutlined,
  PictureOutlined,
  SendOutlined,
  MoreOutlined
} from '@ant-design/icons'
import { commentService } from '@/app/services/comment.service'
import { CommentDto } from '@/app/types/Comment/CommentResponses'
import ImageCarousel from '../Post/ImageCarousel'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import CommentItem from './CommentItem'
import { UserDto } from '@/app/types/User/user.dto'
import PostDropdownMenu from '../Post/PostDropdownMenu'
import EditPostModal from '../Post/EditPostModal'
import DeletePostModal from '../Post/DeletePostModal'
import { PostData } from '@/app/types/Post/Post'
import { getTimeAgo } from '@/app/helper'

interface PostCommentModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  currentUserId: string
  currentUser: UserDto
  postContent: string
  postUser: any
  postImages?: any[]
  postCreatedAt: string
  postPrivacy: string
  totalLiked: number
  totalComment: number
  postReactionUsers: any[]
  onCommentCountChange?: (newCount: number) => void
  onPostReaction?: (postId: string, reaction: string) => void
  onPostUpdated?: (updatedPost: PostData) => void
  onPostDeleted?: (postId: string) => void
}

// Hàm chuyển đổi biểu tượng reaction thành văn bản
const getReactionText = (reaction: string): string => {
  const reactionMap: { [key: string]: string } = {
    '👍': 'Like',
    '❤️': 'Love',
    '😂': 'Haha',
    '😮': 'Wow',
    '😢': 'Sad',
    '😡': 'Angry'
  }
  return reactionMap[reaction] || 'Like'
}

const PostCommentModal: React.FC<PostCommentModalProps> = ({
  isOpen,
  onClose,
  postId,
  currentUserId,
  currentUser,
  postContent,
  postUser,
  postImages = [],
  postCreatedAt,
  postPrivacy,
  totalLiked,
  totalComment,
  postReactionUsers,
  onCommentCountChange,
  onPostReaction,
  onPostUpdated,
  onPostDeleted
}) => {
  const availableReactions = ['👍', '❤️', '😂', '😮', '😢', '😡']

  const [currentPostContent, setCurrentPostContent] = useState(postContent)
  const [currentPostImages, setCurrentPostImages] = useState(postImages)
  const [currentPostPrivacy, setCurrentPostPrivacy] = useState(postPrivacy)

  const [comments, setComments] = useState<CommentDto[]>([])
  const [loading, setLoading] = useState(false)
  const [content, setContent] = useState('')
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [replyTo, setReplyTo] = useState<{ id: string, name: string } | null>(null)
  const [editingComment, setEditingComment] = useState<CommentDto | null>(null)
  const [showPostReactionPicker, setShowPostReactionPicker] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const [existingImages, setExistingImages] = useState<any[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([])
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)

  const [showDropdown, setShowDropdown] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const emojiWrapperRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const reactionBarRef = useRef<HTMLDivElement>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Hàm cập nhật nội dung bài viết khi thay đổi
  useEffect(() => {
    setCurrentPostContent(postContent)
    setCurrentPostImages(postImages)
    setCurrentPostPrivacy(postPrivacy)
  }, [postContent, postImages, postPrivacy])

  // Hàm tải danh sách bình luận
  const loadComments = async () => {
    try {
      setLoading(true)
      const response = await commentService.getCommentsByPostId(postId, 0, 100)
      if (response.comments) {
        setComments(response.comments)
      }
    } catch (error) {
      message.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  // Hàm xử lý tải bình luận khi modal mở
  useEffect(() => {
    if (isOpen) {
      loadComments()
    }
  }, [isOpen, postId])

  // Hàm điều chỉnh chiều cao textarea tự động
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [content])

  // Hàm xử lý sự kiện click bên ngoài để đóng bảng chọn emoji
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiWrapperRef.current && !emojiWrapperRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  // Hàm xử lý sự kiện click bên ngoài và phím Escape để đóng thanh reaction
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedOutsideReactionBar = reactionBarRef.current && !reactionBarRef.current.contains(target)

      if (showPostReactionPicker && clickedOutsideReactionBar) {
        setShowPostReactionPicker(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowPostReactionPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [showPostReactionPicker])

  // Hàm xử lý khi chọn emoji
  const handleEmojiSelect = (emojiData: any) => {
    const emoji = emojiData.native
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = content.slice(0, start) + emoji + content.slice(end)
    setContent(newText)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length
    })
  }

  // Hàm xử lý khi chọn hình ảnh
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const file = files[0]

    if (file.size > 10 * 1024 * 1024) {
      message.warning(`${file.name} is too large (maximum 10MB)`)
      return
    }

    setSelectedImages([file])
    const url = URL.createObjectURL(file)
    setPreviewUrls([url])
  }

  // Hàm xóa hình ảnh đã chọn
  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  // Hàm xóa hình ảnh hiện có
  const removeExistingImage = (imageId: string) => {
    setImagesToDelete((prev) => [...prev, imageId])
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  // Hàm gửi bình luận hoặc cập nhật bình luận
  const handleSubmit = async () => {
    if (!content.trim() && selectedImages.length === 0 && existingImages.length === 0) {
      message.warning('Please enter content or select an image')
      return
    }

    try {
      const formData = new FormData()
      formData.append('Content', content.trim())

      if (editingComment) {
        if (selectedImages.length > 0) {
          formData.append('NewImages', selectedImages[0])
        }
        imagesToDelete.forEach((imageId) => {
          formData.append('ImageIdsToDelete', imageId)
        })

        const response = await commentService.updateComment(editingComment.id, formData)

        if (response.message?.includes('success')) {
          loadComments()
          resetForm()
        } else {
          message.error(response.message || 'Failed to update comment')
        }
      } else {
        formData.append('PostId', postId)
        if (replyTo?.id) {
          formData.append('RepliedCommentId', replyTo.id)
        }

        if (selectedImages.length > 0) {
          formData.append('Images', selectedImages[0])
        }

        const response = await commentService.createComment(formData)

        if (response.message?.includes('success')) {
          loadComments()
          resetForm()

          if (onCommentCountChange) {
            onCommentCountChange(totalComment + 1)
          }
        } else {
          message.error(response.message || 'Failed to add comment')
        }
      }
    } catch (error) {
      console.error(error)
      message.error('An error occurred')
    }
  }

  // Hàm đặt lại form nhập liệu
  const resetForm = () => {
    setContent('')
    setSelectedImages([])
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setPreviewUrls([])
    setReplyTo(null)
    setEditingComment(null)
    setExistingImages([])
    setImagesToDelete([])
  }

  // Hàm xử lý reaction cho bài viết
  const handleReaction = (reaction: string) => {
    if (onPostReaction) {
      onPostReaction(postId, reaction)
    }
    setShowPostReactionPicker(false)
  }

  // Hàm xử lý khi di chuột vào khu vực reaction
  const handleMouseEnterReaction = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    const timeout = setTimeout(() => {
      setShowPostReactionPicker(true)
    }, 300)
    setHoverTimeout(timeout)
  }

  // Hàm xử lý khi di chuột rời khu vực reaction
  const handleMouseLeaveReaction = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    const timeout = setTimeout(() => {
      setShowPostReactionPicker(false)
    }, 300)
    setHoverTimeout(timeout)
  }

  // Hàm xử lý khi nhấp vào nút Like
  const handleLikeClick = () => {
    const currentUserReaction = postReactionUsers?.find(r => r.userId === currentUserId)
    if (currentUserReaction) {
      handleReaction(currentUserReaction.reaction)
    } else {
      handleReaction('👍')
    }
  }

  // Hàm chuyển đến hình ảnh trước đó
  const handlePreviousImage = () => {
    setCurrentImageIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : prevIndex))
  }

  // Hàm chuyển đến hình ảnh tiếp theo
  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) => prevIndex < currentPostImages.length - 1 ? prevIndex + 1 : prevIndex)
  }

  // Hàm chuyển đến hình ảnh cụ thể
  const handleGoToImage = (index: number) => {
    setCurrentImageIndex(index)
  }

  // Hàm xử lý mở modal chỉnh sửa bài viết
  const handleEditPost = () => {
    setShowEditModal(true)
    setShowDropdown(false)
  }

  // Hàm xử lý lưu bài viết đã chỉnh sửa
  const handleSavePost = (updatedPostData: PostData) => {
    setCurrentPostContent(updatedPostData.content || '')
    setCurrentPostImages(updatedPostData.postImages || [])
    setCurrentPostPrivacy(updatedPostData.postPrivacy || 'Public')
    if (onPostUpdated) {
      onPostUpdated(updatedPostData)
    }
    setShowEditModal(false)
  }

  // Hàm xử lý mở modal xóa bài viết
  const handleDeleteClick = () => {
    setShowDeleteModal(true)
    setShowDropdown(false)
  }

  // Hàm xử lý khi xóa bài viết thành công
  const handleDeleteSuccess = () => {
    if (onPostDeleted) {
      onPostDeleted(postId)
    }
    setShowDeleteModal(false)
    onClose()
  }

  // Hàm hiển thị biểu tượng quyền riêng tư
  const renderPrivacyIcon = () => {
    const iconClass = 'w-3 h-3 text-gray-500'

    switch (currentPostPrivacy) {
      case 'Public':
        return (
          <svg className={iconClass} fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z'
              clipRule='evenodd'
            />
          </svg>
        )
      case 'Friends':
        return (
          <svg className={iconClass} fill='currentColor' viewBox='0 0 20 20'>
            <path d='M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z' />
          </svg>
        )
      case 'Private':
        return (
          <svg className={iconClass} fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
              clipRule='evenodd'
            />
          </svg>
        )
      default:
        return null
    }
  }
  // Hàm hiển thị thông tin về các reaction và bình luận
  const renderReactionsInfo = () => {
    const hasReactions = postReactionUsers && postReactionUsers.length > 0
    const hasComments = totalComment > 0

    if (!hasReactions && !hasComments) {
      return null
    }

    const uniqueReactions = hasReactions ? Array.from(new Set(postReactionUsers.map((r) => r.reaction))) : []
    const currentUserReaction = hasReactions ? postReactionUsers.find((r) => r.userId === currentUserId) : null
    // Hàm lấy tên đầy đủ của người dùng
    const getFullName = (user: any) => {
      if (!user) return 'User'
      return `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'
    }
    // Hàm tạo văn bản hiển thị cho reaction
    const getReactionText = () => {
      if (!hasReactions) return ''

      if (postReactionUsers.length === 1) {
        return getFullName(postReactionUsers[0]?.user)
      } else if (postReactionUsers.length === 2) {
        if (currentUserReaction) {
          const otherUser = postReactionUsers.find((r) => r.userId !== currentUserId)?.user
          return otherUser ? `You and ${getFullName(otherUser)}` : 'You and 1 other person'
        }
        return `${getFullName(postReactionUsers[0]?.user)} and ${getFullName(postReactionUsers[1]?.user)}`
      } else {
        if (currentUserReaction) {
          return `You and ${postReactionUsers.length - 1} others`
        }
        return `${getFullName(postReactionUsers[0]?.user)} and ${postReactionUsers.length - 1} others`
      }
    }

    return (
      <div className='px-4 py-2.5 border-b border-gray-200'>
        <div className='flex items-center justify-between text-sm'>
          {hasReactions ? (
            <div className='flex items-center gap-2'>
              <div className='flex items-center -space-x-1'>
                {uniqueReactions.slice(0, 3).map((reaction, index) => (
                  <div
                    key={index}
                    className='w-[18px] h-[18px] bg-white rounded-full flex items-center justify-center text-xs shadow-sm border border-white'
                    style={{ zIndex: 3 - index }}
                  >
                    {reaction}
                  </div>
                ))}
              </div>
              <span className='hover:underline cursor-pointer text-gray-700'>{getReactionText()}</span>
            </div>
          ) : (
            <div></div>
          )}

          {hasComments && (
            <span className='text-gray-600 hover:underline cursor-pointer'>
              {totalComment} {totalComment === 1 ? 'comment' : 'comments'}
            </span>
          )}
        </div>
      </div>
    )
  }

  const fullName = `${postUser.firstName || ''} ${postUser.lastName || ''}`.trim()
  const userReaction = postReactionUsers?.find((r) => r.userId === currentUserId)
  const isCurrentUserPost = currentUserId === postUser.id

  if (!isOpen) return null

  return (
    <>
      <div className='fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-0 md:p-4'>
        <div className='bg-white w-full h-full md:h-[90vh] md:max-w-[1000px] md:rounded-xl flex flex-col overflow-hidden shadow-2xl'>
          <div className='relative px-4 py-3 border-b border-gray-200 bg-white flex justify-center items-center'>
            <h3 className='font-bold text-xl text-center'>{fullName}'s post</h3>

            <button
              onClick={onClose}
              className='absolute right-4 text-gray-500 hover:bg-gray-100 p-2 rounded-full transition'
            >
              <CloseOutlined style={{ fontSize: '20px' }} />
            </button>
          </div>

          <div className='flex-1 overflow-y-auto'>
            <div className='px-4 pt-3 pb-2'>
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-3'>
                  <Avatar src={postUser.avatarUrl} size={40}>
                    {postUser.firstName?.[0] || postUser.lastName?.[0] || ''}
                  </Avatar>
                  <div>
                    <h4 className='font-semibold text-sm hover:underline cursor-pointer'>{fullName}</h4>
                    <div className='flex items-center gap-1'>
                      <span className='text-xs text-gray-500'>{getTimeAgo(postCreatedAt)}</span>
                      <span className='text-gray-400'>·</span>
                      {renderPrivacyIcon()}
                    </div>
                  </div>
                </div>
                <div className='relative'>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className='text-gray-500 hover:bg-gray-100 p-2 rounded-full transition'
                  >
                    <MoreOutlined style={{ fontSize: '20px' }} />
                  </button>

                  <PostDropdownMenu
                    isOpen={showDropdown}
                    isOwner={isCurrentUserPost}
                    onClose={() => setShowDropdown(false)}
                    postId={postId}
                    onEdit={handleEditPost}
                    onDeleteClick={handleDeleteClick}
                  />
                </div>
              </div>
            </div>

            <div className='px-4 pb-3'>
              <p className='text-sm text-gray-900 whitespace-pre-wrap'>{currentPostContent}</p>
            </div>

            {currentPostImages && currentPostImages.length > 0 && (
              <div className='w-full flex items-center justify-center bg-black'>
                <ImageCarousel
                  postImages={currentPostImages}
                  currentImageIndex={currentImageIndex}
                  onImageClick={setCurrentImageIndex}
                  onPrevious={handlePreviousImage}
                  onNext={handleNextImage}
                  onGoToImage={handleGoToImage}
                />
              </div>
            )}

            {renderReactionsInfo()}

            <div className='px-4 py-2 border-b border-gray-200'>
              <div className='flex items-center justify-around'>
                <div className='relative'>
                  <div
                    className='relative'
                    onMouseEnter={handleMouseEnterReaction}
                    onMouseLeave={handleMouseLeaveReaction}
                  >
                    <button
                      onClick={handleLikeClick}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm transition-colors ${
                        userReaction ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {userReaction ? (
                        <>
                          <span className='text-lg'>{userReaction.reaction}</span>
                          <span className='font-medium'>{getReactionText(userReaction.reaction)}</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className='w-5 h-5'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                            strokeWidth='2'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3'
                            />
                          </svg>
                          <span className='font-medium'>Like</span>
                        </>
                      )}
                    </button>

                    {showPostReactionPicker && (
                      <div
                        ref={reactionBarRef}
                        className='absolute z-50 flex gap-1 bg-white border border-gray-200 shadow-lg rounded-full py-1 px-2 bottom-full left-0 mb-1 animate-fadeInUp'
                        style={{ minWidth: '200px' }}
                        onMouseEnter={() => {
                          if (hoverTimeout) {
                            clearTimeout(hoverTimeout)
                            setHoverTimeout(null)
                          }
                        }}
                        onMouseLeave={handleMouseLeaveReaction}
                      >
                        {availableReactions.map((reaction, index) => (
                          <div
                            key={reaction}
                            onClick={() => handleReaction(reaction)}
                            className='text-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:scale-110 p-0.5 rounded-full relative hover:bg-gray-100'
                            style={{
                              animationDelay: `${index * 50}ms`
                            }}
                            title={getReactionText(reaction)}
                          >
                            {reaction}

                            <div className='absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap'>
                              {getReactionText(reaction)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button className='flex items-center gap-2 px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition font-semibold text-sm'>
                  <MessageOutlined style={{ fontSize: '18px' }} />
                  <span>Comment</span>
                </button>

                <button className='flex items-center gap-2 px-4 py-2 rounded-md text-gray-600 hover:bg-gray-100 transition font-semibold text-sm'>
                  <ShareAltOutlined style={{ fontSize: '18px' }} />
                  <span>Share</span>
                </button>
              </div>
            </div>

            <div className='px-4 py-3'>
              {loading ? (
                <div className='text-center py-8 text-gray-500'>Loading...</div>
              ) : comments.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>No comments yet. Be the first to comment!</div>
              ) : (
                <div className='space-y-2'>
                  {comments.map((comment) => (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      currentUserId={currentUserId}
                      loadComments={loadComments}
                      onCommentCountChange={onCommentCountChange}
                      setEditingComment={setEditingComment}
                      setReplyTo={setReplyTo}
                      setContent={setContent}
                      setExistingImages={setExistingImages}
                      setImagesToDelete={setImagesToDelete}
                      totalComment={totalComment}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className='border-t border-gray-200 bg-white px-4 py-3'>
            {(replyTo || editingComment) && (
              <div className='flex items-center justify-between mb-2 px-3 py-2 bg-blue-50 rounded-lg text-sm'>
                <span className='text-gray-600 font-medium'>
                  {editingComment ? '✏️ Editing comment' : `💬 Replying to ${replyTo?.name}`}
                </span>
                <button onClick={resetForm} className='text-gray-500 hover:text-gray-700'>
                  <CloseOutlined style={{ fontSize: '14px' }} />
                </button>
              </div>
            )}

            {existingImages.length > 0 && (
              <div className='mb-2'>
                <div className='relative inline-block'>
                  <img src={existingImages[0].imageUrl} alt='Existing' className='w-16 h-16 object-cover rounded-lg' />
                  <button
                    onClick={() => removeExistingImage(existingImages[0].id)}
                    className='absolute -top-1 -right-1 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-900'
                  >
                    <CloseOutlined style={{ fontSize: '12px' }} />
                  </button>
                </div>
              </div>
            )}

            {previewUrls.length > 0 && (
              <div className='mb-2'>
                <div className='relative inline-block'>
                  <img src={previewUrls[0]} alt='Preview' className='w-16 h-16 object-cover rounded-lg' />
                  <button
                    onClick={() => removeImage(0)}
                    className='absolute -top-1 -right-1 bg-gray-800 text-white rounded-full p-1 hover:bg-gray-900'
                  >
                    <CloseOutlined style={{ fontSize: '12px' }} />
                  </button>
                </div>
              </div>
            )}

            <div className='flex gap-2 items-center'>
              <Avatar src={currentUser.avatarUrl} size={32} className='flex-shrink-0'>
                {currentUser.firstName?.[0] || ''}
              </Avatar>

              <div className='flex-1 bg-gray-100 rounded-full px-4 py-2 flex items-center gap-2'>
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  placeholder='Write a comment...'
                  className='flex-1 bg-transparent outline-none resize-none text-sm max-h-20'
                  rows={1}
                />

                <div className='flex items-center gap-1'>
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    onChange={handleImageSelect}
                    className='hidden'
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className='text-gray-500 hover:text-gray-700 p-1'
                  >
                    <PictureOutlined style={{ fontSize: '16px' }} />
                  </button>

                  <div ref={emojiWrapperRef} className='relative'>
                    <button
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      className='text-gray-500 hover:text-gray-700 p-1'
                    >
                      <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 100-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-.464 5.535a1 1 0 10-1.415-1.414 3 3 0 01-4.242 0 1 1 0 00-1.415 1.414 5 5 0 007.072 0z' 
                          clipRule='evenodd'
                        />
                      </svg>
                    </button>
                    {showEmojiPicker && (
                      <div className='absolute bottom-full right-0 mb-2 z-50'>
                        <Picker
                          data={data}
                          onEmojiSelect={handleEmojiSelect}
                          previewPosition='none'
                          theme='light'
                          perLine={8}
                          emojiSize={20}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(content.trim() || selectedImages.length > 0 || existingImages.length > 0) && (
                <button
                  onClick={handleSubmit}
                  className='text-blue-500 hover:text-blue-600 font-semibold text-sm px-3 items-center'
                >
                  <SendOutlined/>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <EditPostModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        postId={postId}
        onSave={handleSavePost}
        currentUser={currentUser}
      />

      <DeletePostModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDeleteSuccess={handleDeleteSuccess}
        postId={postId}
      />
    </>
  )
}

export default PostCommentModal