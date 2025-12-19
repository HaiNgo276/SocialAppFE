import React from 'react'

interface PostImage {
  imageUrl: string
}

interface ImageCarouselProps {
  postImages: PostImage[]
  currentImageIndex: number
  onImageClick: (index: number) => void
  onPrevious: () => void
  onNext: () => void
  onGoToImage: (index: number) => void
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({
  postImages,
  currentImageIndex,
  onImageClick,
  onPrevious,
  onNext,
  onGoToImage
}) => {
  if (!postImages || postImages.length === 0) return null

  const imageCount = postImages.length

  return (
    <div>
      <div className='relative bg-gray-100 rounded-lg overflow-hidden'>
        {/* HIỂN THỊ ẢNH CHÍNH */}
        <div className='relative h-64 md:h-80'>
          <img
            src={postImages[currentImageIndex].imageUrl}
            alt={`Post content ${currentImageIndex + 1}`}
            className='w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity'
            onClick={() => onImageClick(currentImageIndex)}
          />

          {/* MŨI TÊN ĐIỀU HƯỚNG */}
          {imageCount > 1 && (
            <>
              {currentImageIndex > 0 && (
                <button
                  onClick={onPrevious}
                  className='absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-colors'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M15 19l-7-7 7-7' />
                  </svg>
                </button>
              )}

              {currentImageIndex < imageCount - 1 && (
                <button
                  onClick={onNext}
                  className='absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full p-2 transition-colors'
                >
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>

        {/* CHẤM THUMBNAIL */}
        {imageCount > 1 && (
          <div className='absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2'>
            {postImages.map((_, index) => (
              <button
                key={index}
                onClick={() => onGoToImage(index)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50 hover:bg-opacity-70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageCarousel