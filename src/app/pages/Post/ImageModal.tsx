import React from 'react'

interface PostImage {
  imageUrl: string
}

interface ImageModalProps {
  postImages: PostImage[]
  selectedImageIndex: number | null
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}

const ImageModal: React.FC<ImageModalProps> = ({
  postImages,
  selectedImageIndex,
  onClose,
  onPrevious,
  onNext
}) => {
  if (selectedImageIndex === null || !postImages) return null

  // Xử lý sự kiện phím
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowLeft' && selectedImageIndex > 0) {
      onPrevious()
    } else if (e.key === 'ArrowRight' && selectedImageIndex < postImages.length - 1) {
      onNext()
    }
  }

  return (
    <div
      className='fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50'
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className='relative max-w-5xl max-h-full p-4'>
        <img
          src={postImages[selectedImageIndex].imageUrl}
          alt={`Post content ${selectedImageIndex + 1}`}
          className='max-w-full max-h-full object-contain rounded-lg'
          onClick={(e) => e.stopPropagation()}
        />
        
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className='absolute -top-2 -right-2 text-white bg-red-500 hover:bg-red-600 rounded-full p-2 transition-colors shadow-lg'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>

        {/* Mũi tên điều hướng */}
        {postImages.length > 1 && (
          <>
            {selectedImageIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPrevious()
                }}
                className='absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-3 transition-colors shadow-lg'
              >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 19l-7-7 7-7' />
                </svg>
              </button>
            )}

            {selectedImageIndex < postImages.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onNext()
                }}
                className='absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full p-3 transition-colors shadow-lg'
              >
                <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
                </svg>
              </button>
            )}
          </>
        )}

        {/* Bộ đếm ảnh */}
        <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white bg-black bg-opacity-70 px-4 py-2 rounded-full text-sm font-medium'>
          {selectedImageIndex + 1} / {postImages.length}
        </div>
      </div>
    </div>
  )
}

export default ImageModal