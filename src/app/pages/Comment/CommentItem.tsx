import React, { useState, useEffect, useRef } from 'react'
import { Avatar, message } from 'antd'
import { MoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { CommentDto } from '@/app/types/Comment/CommentResponses'
import { commentService } from '@/app/services/comment.service'
import { getTimeAgo } from '@/app/helper'

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

interface CommentItemProps {
  comment: CommentDto
  currentUserId: string
  loadComments: () => void
  onCommentCountChange?: (newCount: number) => void
  setEditingComment: (comment: CommentDto | null) => void
  setReplyTo: (replyTo: { id: string, name: string } | null) => void
  setContent: (content: string) => void
  setExistingImages: (images: any[]) => void
  setImagesToDelete: (images: string[]) => void
  totalComment: number
  level?: number
  parentUserName?: string
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  loadComments,
  onCommentCountChange,
  setEditingComment,
  setReplyTo,
  setContent,
  setExistingImages,
  setImagesToDelete,
  totalComment,
  level = 0,
  parentUserName
}) => {
  const availableReactions = ['👍', '❤️', '😂', '😮', '😢', '😡']
  const [showMenu, setShowMenu] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [showReplies, setShowReplies] = useState(false)
  const [showFullContent, setShowFullContent] = useState(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isHovering, setIsHovering] = useState(false)

  const [localReactions, setLocalReactions] = useState(comment.commentReactionUsers || [])

  const CHARACTER_LIMIT = 300
  const menuRef = useRef<HTMLDivElement>(null)
  const reactionBarRef = useRef<HTMLDivElement>(null)

  const fullName = `${comment.user?.firstName || ''} ${comment.user?.lastName || ''}`.trim()
  const isOwner = comment.userId === currentUserId

  const userReaction = localReactions?.find((r) => r.userId === currentUserId)
  const reactionCount = localReactions?.length || 0

  const isLongContent = comment.content.length > CHARACTER_LIMIT
  const displayContent = showFullContent || !isLongContent ? comment.content : comment.content.substring(0, CHARACTER_LIMIT) + '...'

  // Cập nhật localReactions khi comment prop thay đổi
  useEffect(() => {
    setLocalReactions(comment.commentReactionUsers || [])
  }, [comment.commentReactionUsers])

  // Hàm tính thống kê reaction
  const getReactionStats = () => {
    if (!localReactions || localReactions.length === 0) {
      return { uniqueReactions: [], total: 0 }
    }

    const reactionCounts: { [key: string]: number } = {}
    localReactions.forEach(r => {
      reactionCounts[r.reaction] = (reactionCounts[r.reaction] || 0) + 1
    })

    const sortedReactions = Object.entries(reactionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([emoji]) => emoji)

    return {
      uniqueReactions: sortedReactions.slice(0, 3),
      total: localReactions.length
    }
  }

  const { uniqueReactions, total: totalReactions } = getReactionStats()

  // Hàm tính tổng số phản hồi của bình luận
  const getTotalReplyCount = (comment: CommentDto): number => {
    if (!comment.replies || comment.replies.length === 0) return 0

    let total = comment.replies.length
    comment.replies.forEach(reply => {
      total += getTotalReplyCount(reply)
    })

    return total
  }

  const totalReplyCount = getTotalReplyCount(comment)

  // Hàm xử lý sự kiện click bên ngoài để đóng menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Hàm xử lý sự kiện click bên ngoài và phím Escape để đóng thanh reaction
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedOutsideReactionBar = reactionBarRef.current && !reactionBarRef.current.contains(target)

      if (showReactionPicker && clickedOutsideReactionBar) {
        setShowReactionPicker(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowReactionPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [showReactionPicker])

  // Hàm xử lý reaction cho bình luận
  const handleReaction = async (reaction: string) => {
    try {
      const currentUserReaction = localReactions.find(r => r.userId === currentUserId)
      let newReactions = [...localReactions]

      if (currentUserReaction) {
        if (currentUserReaction.reaction === reaction) {
          // Xóa reaction
          newReactions = localReactions.filter(r => r.userId !== currentUserId)
        } else {
          // Thay đổi reaction
          newReactions = localReactions.map(r => r.userId === currentUserId ? { ...r, reaction: reaction } : r)
        }
      } else {
        const newReaction = {
          id: Date.now().toString(),
          userId: currentUserId,
          reaction: reaction,
          user: comment.user
        }
        newReactions = [...localReactions, newReaction]
      }
      setLocalReactions(newReactions)

      const response = await commentService.reactionComment({
        commentId: comment.id,
        reaction
      })

      // Nếu API thất bại, revert lại
      if (!response.message?.includes('success')) {
        setLocalReactions(localReactions)
        message.error('Failed to perform reaction')
      }
    } catch (error) {
      // Revert nếu có lỗi
      setLocalReactions(localReactions)
      message.error('Failed to perform reaction')
    }
    setShowReactionPicker(false)
  }

  // Hàm xử lý khi di chuột vào khu vực reaction
  const handleMouseEnterReaction = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    const timeout = setTimeout(() => {
      setShowReactionPicker(true)
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
      setShowReactionPicker(false)
    }, 300)
    setHoverTimeout(timeout)
  }

  // Hàm xử lý khi nhấp vào nút Like
  const handleLikeClick = () => {
    if (userReaction) {
      handleReaction(userReaction.reaction)
    } else {
      handleReaction('👍')
    }
  }

  // Hàm xử lý xóa bình luận
  const handleDelete = async (commentId: string) => {
    try {
      const response = await commentService.deleteComment(commentId)
      if (response.message?.includes('success')) {
        message.success('Comment deleted successfully')
        loadComments()

        if (onCommentCountChange) {
          onCommentCountChange(Math.max(0, totalComment - 1))
        }
      } else {
        message.error(response.message || 'Failed to delete comment')
      }
    } catch (error) {
      message.error('An error occurred')
    }
  }

  // Hàm xử lý chỉnh sửa bình luận
  const handleEdit = (comment: CommentDto) => {
    setEditingComment(comment)
    setContent(comment.content)
    setReplyTo(null)

    if (comment.commentImages && comment.commentImages.length > 0) {
      setExistingImages([...comment.commentImages])
    } else {
      setExistingImages([])
    }

    setImagesToDelete([])
  }

  // Hàm xử lý trả lời bình luận
  const handleReply = (commentId: string, userName: string) => {
    setReplyTo({ id: commentId, name: userName })
    setEditingComment(null)
    setContent('')
    setExistingImages([])
    setImagesToDelete([])
  }

  return (
    <div className={`flex gap-2 ${level > 0 ? 'ml-10' : ''} mb-3`}>
      <Avatar src={comment.user?.avatarUrl} size={level > 0 ? 32 : 40} className='flex-shrink-0'>
        {comment.user?.firstName?.[0] || 'U'}
      </Avatar>

      <div className='flex-1'>
        {/* Container với MoreOutlined bên ngoài */}
        <div
          className='relative flex gap-2 items-start'
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Khung bình luận */}
          <div className='relative inline-block' style={{ maxWidth: '400px' }}>
            <div className='bg-gray-100 rounded-2xl px-3 py-2 relative'>
              <div className='flex items-center gap-2'>
                <p className='font-semibold text-sm'>{fullName}</p>
              </div>

              <p
                className='text-sm text-gray-800 break-words'
                style={{
                  paddingRight: totalReactions > 0 ? '50px' : '0',
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {level > 0 && parentUserName && ( <span className='font-bold text-black mr-1'>{parentUserName}</span>)}
                {displayContent}
              </p>

              {isLongContent && (
                <button
                  onClick={() => setShowFullContent(!showFullContent)}
                  className='text-xs font-semibold text-gray-600 hover:underline mt-1'
                >
                  {showFullContent ? 'Show less' : 'Show more'}
                </button>
              )}

              {comment.commentImages && comment.commentImages.length > 0 && (
                <div
                  className='mt-2 grid gap-2'
                  style={{
                    gridTemplateColumns: `repeat(auto-fit, minmax(100px, 1fr))`
                  }}
                >
                  {comment.commentImages.map((img) => (
                    <img
                      key={img.id}
                      src={img.imageUrl}
                      alt='Comment image'
                      className='rounded-lg max-h-60 w-full object-cover cursor-pointer hover:opacity-90'
                      onClick={() => window.open(img.imageUrl, '_blank')}
                    />
                  ))}
                </div>
              )}

              {totalReactions > 0 && (
                <div className='absolute bottom-[0px] right-[-16px] bg-gray-200 rounded-full px-1.5 py-0.5 shadow-sm flex items-center gap-0.5 cursor-pointer hover:border-gray-300 transition-colors'>
                  <div className='flex items-center -space-x-0.5'>
                    {uniqueReactions.map((reaction, idx) => (
                      <div
                        key={idx}
                        className='w-[16px] h-[16px] bg-gray-200 rounded-full flex items-center justify-center text-[10px]'
                        style={{ zIndex: 3 - idx }}
                      >
                        {reaction}
                      </div>
                    ))}
                  </div>
                  <span className='text-[11px] text-gray-600 font-medium ml-0.5'>{totalReactions}</span>
                </div>
              )}
            </div>
          </div>

          {/* MoreOutlined bên ngoài và bên phải */}
          <div className='relative flex-shrink-0' ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)} 
              className='text-gray-500 hover:text-gray-700 p-1 transition-opacity duration-200'
              style={{
                opacity: (isHovering || showMenu) ? 1 : 0,
                pointerEvents: (isHovering || showMenu) ? 'auto' : 'none'
              }}
            >
              <MoreOutlined style={{ fontSize: '16px', transform: 'rotate(90deg)' }} />
            </button>

            {isOwner && showMenu && (
              <div className='absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[120px] overflow-hidden'>
                <button
                  onClick={() => {
                    handleEdit(comment)
                    setShowMenu(false)
                  }}
                  className='w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 whitespace-nowrap'
                >
                  <EditOutlined style={{ fontSize: '14px' }} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    handleDelete(comment.id)
                    setShowMenu(false)
                  }}
                  className='w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600 whitespace-nowrap'
                >
                  <DeleteOutlined style={{ fontSize: '14px' }} />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className='flex items-center gap-3 ml-3 mt-1 text-xs font-semibold text-gray-600'>
          <span className='text-gray-500'>{getTimeAgo(comment.createdAt)}</span>

          <div className='relative'>
            <div className='relative' onMouseEnter={handleMouseEnterReaction} onMouseLeave={handleMouseLeaveReaction}>
              <button
                onClick={handleLikeClick}
                className={`hover:underline transition-colors ${userReaction ? 'text-blue-500 font-semibold' : ''}`}
              >
                {userReaction ? getReactionText(userReaction.reaction) : 'Like'}
              </button>

              {/* Thanh reaction */}
              {showReactionPicker && (
                <div
                  ref={reactionBarRef}
                  className='absolute z-50 flex gap-1 bg-white border border-gray-200 shadow-lg rounded-full py-1 px-2 bottom-full left-0 mb-1 animate-fadeInUp'
                  style={{ minWidth: '180px' }}
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
                      className='text-base cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:scale-110 p-0.5 rounded-full relative hover:bg-gray-100'
                      style={{
                        animationDelay: `${index * 50}ms`
                      }}
                      title={getReactionText(reaction)}
                    >
                      {reaction}

                      <div className='absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none'>
                        {getReactionText(reaction)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button onClick={() => handleReply(comment.id, fullName)} className='hover:underline flex items-center gap-1'>
            Reply
          </button>
        </div>

        {totalReplyCount > 0 && (
          <button
            onClick={() => setShowReplies(!showReplies)}
            className='ml-3 mt-2 text-xs font-semibold text-gray-600 hover:underline flex items-center gap-1'
          >
            <svg
              className={`w-3 h-3 transition-transform ${showReplies ? 'rotate-90' : ''}`}
              fill='currentColor'
              viewBox='0 0 20 20'
            >
              <path
                fillRule='evenodd'
                d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                clipRule='evenodd'
              />
            </svg>
            {showReplies ? 'Hide replies' : `View ${totalReplyCount} replies`}
          </button>
        )}

        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className='mt-2'>
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                loadComments={loadComments}
                onCommentCountChange={onCommentCountChange}
                setEditingComment={setEditingComment}
                setReplyTo={setReplyTo}
                setContent={setContent}
                setExistingImages={setExistingImages}
                setImagesToDelete={setImagesToDelete}
                totalComment={totalComment}
                level={level + 1}
                parentUserName={fullName}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CommentItem