import React, { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
interface PostDropdownMenuProps {
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
  onTurnOffNotifications?: () => void
  onDeleteClick?: () => void
  postId?: string
  isOwner?: boolean
}

const PostDropdownMenu: React.FC<PostDropdownMenuProps> = ({
  isOpen,
  onClose,
  onEdit,
  onTurnOffNotifications,
  onDeleteClick,
  postId,
  isOwner = false
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleEditClick = () => {
    onEdit?.()
    onClose()
  }

  const handleDeleteClick = () => {
    onDeleteClick?.()
    onClose()
  }

  const handleViewDetails = () => {
    if (postId) {
      navigate(`/post/${postId}`)
    }
    onClose()
  }

  return (
    <>
      <div
        ref={dropdownRef}
        className='absolute right-0 top-8 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-2 overflow-hidden'
      >
        {/* Xem chi tiết bài viết */}
        <button
          onClick={handleViewDetails}
          className='w-full flex items-center px-4 py-3 hover:bg-gray-50 text-left border-0 bg-transparent'
        >
          <svg
            className='w-5 h-5 mr-3 text-gray-600 flex-shrink-0'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
            />
          </svg>
          <span className='text-sm font-medium text-gray-900'>View post details</span>
        </button>

        {isOwner && (
          <>
            {/* Chỉnh sửa bài viết */}
            <button
              onClick={handleEditClick}
              className='w-full flex items-center px-4 py-3 hover:bg-gray-50 text-left border-0 bg-transparent'
            >
              <svg
                className='w-5 h-5 mr-3 text-gray-600 flex-shrink-0'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                />
              </svg>
              <span className='text-sm font-medium text-gray-900'>Edit post</span>
            </button>

            {/* Tắt thông báo */}
            {/* <button
              onClick={() => {
                onTurnOffNotifications?.()
                onClose()
              }}
              className='w-full flex items-start px-4 py-3 hover:bg-gray-50 text-left border-0 bg-transparent'
            >
              <svg className='w-5 h-5 mr-3 text-gray-600 flex-shrink-0 mt-0.5' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='text-sm font-medium text-gray-900 flex-1 leading-5'>
                Turn off notifications for this post
              </span>
            </button>

            <hr className='my-2' /> */}

            {/* Xóa bài viết */}
            <button
              onClick={handleDeleteClick}
              className='w-full flex items-start px-4 py-3 hover:bg-red-50 text-left border-0 bg-transparent group'
            >
              <svg
                className='w-5 h-5 mr-3 text-red-500 flex-shrink-0 mt-0.5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                />
              </svg>
              <div className='flex-1'>
                <div className='text-sm font-medium text-red-500 group-hover:text-red-700'>Delete post</div>
              </div>
            </button>
          </>
        )}
      </div>
    </>
  )
}

export default PostDropdownMenu