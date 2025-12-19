import { useState, useRef, useEffect } from 'react'
import { PostReactionDto } from '@/app/types/Post/Post'

interface PostReactionProps {
  postId: string
  reactions: PostReactionDto[]
  onSendReaction: (postId: string, reaction: string) => void
  currentUserId: string
  totalLiked: number
}

// Hàm helper để chuyển đổi biểu tượng reaction thành văn bản
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

const PostReaction: React.FC<PostReactionProps> = ({ postId, reactions, onSendReaction, currentUserId }) => {
  const availableReactions = ['👍', '❤️', '😂', '😮', '😢', '😡']
  const reactionBarRef = useRef<HTMLDivElement>(null)
  const [showReactionBar, setShowReactionBar] = useState<boolean>(false)
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)

  // Xử lý sự kiện click bên ngoài để đóng reaction bar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedOutsideReactionBar = reactionBarRef.current && !reactionBarRef.current.contains(target)

      if (showReactionBar && clickedOutsideReactionBar) {
        setShowReactionBar(false)
      }
    }

    // Xử lý sự kiện nhấn phím Escape để đóng reaction bar
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowReactionBar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [showReactionBar])

  // Xử lý khi người dùng chọn một reaction
  const handleReaction = (reaction: string) => {
    onSendReaction(postId, reaction)
    setShowReactionBar(false)
  }

  // Xử lý khi di chuột vào nút Like để hiển thị reaction bar
  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    const timeout = setTimeout(() => {
      setShowReactionBar(true)
    }, 300)
    setHoverTimeout(timeout)
  }

  // Xử lý khi di chuột ra khỏi nút Like để ẩn reaction bar
  const handleMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
      setHoverTimeout(null)
    }
    const timeout = setTimeout(() => {
      setShowReactionBar(false)
    }, 300)
    setHoverTimeout(timeout)
  }

  // Xử lý khi người dùng click vào nút Like
  const handleLikeClick = () => {
    const currentUserReaction = reactions?.find(r => r.userId === currentUserId)
    if (currentUserReaction) {
      handleReaction(currentUserReaction.reaction)
    } else {
      handleReaction('👍')
    }
  }

  const userReaction = reactions?.find(r => r.userId === currentUserId)

  return (
    <div className='relative'>
      <div className='relative' onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <button
          onClick={handleLikeClick}
          className={`flex items-center space-x-2 px-2 py-1 rounded-md text-sm transition-colors ${
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
              <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24' strokeWidth='2'>
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

        {/* Reaction Bar */}
        {showReactionBar && (
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
            onMouseLeave={handleMouseLeave}
          >
            {availableReactions.map((reaction, index) => {
              // const isCurrentReaction = userReaction?.reaction === reaction
              return (
                <div
                  key={reaction}
                  onClick={() => handleReaction(reaction)}
                  // className={`text-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:scale-110 p-0.5 rounded-full relative ${
                  //   isCurrentReaction ? 'bg-blue-100 ring-2 ring-blue-300' : 'hover:bg-gray-100'
                  // }`}
                  className='text-lg cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:scale-110 p-0.5 rounded-full relative hover:bg-gray-100'
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                  title={getReactionText(reaction)}
                >
                  {reaction}

                  {/* Tooltip hiển thị tên reaction */}
                  <div className='absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap'>
                    {getReactionText(reaction)}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default PostReaction