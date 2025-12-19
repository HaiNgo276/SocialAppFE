import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { Modal, Button, Input, Avatar, Flex, Typography, Divider, message } from 'antd'
import {
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  PictureOutlined,
  PaperClipOutlined,
  SaveOutlined,
  CloseOutlined,
  SmileOutlined,
  GlobalOutlined,
  UsergroupAddOutlined,
  LockOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import Picker from '@emoji-mart/react'
import { TextAreaRef } from 'antd/es/input/TextArea'
import { postService } from '@/app/services/post.service'
import { PostData, PostImage } from '@/app/types/Post/Post'
import { UserDto } from '@/app/types/User/user.dto'

const { TextArea } = Input
const { Text } = Typography

interface EditPostModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  onSave: (updatedPost: PostData) => void
  currentUser: UserDto
}

const EditPostModal: React.FC<EditPostModalProps> = ({ isOpen, onClose, postId, onSave, currentUser }) => {
  const [privacy, setPrivacy] = useState<'Public' | 'Friends' | 'Private'>('Public')
  const [text, setText] = useState('')
  const [originalImages, setOriginalImages] = useState<PostImage[]>([])
  const [existingImages, setExistingImages] = useState<PostImage[]>([])
  const [newImages, setNewImages] = useState<File[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [fetchingPost, setFetchingPost] = useState<boolean>(false)

  const textAreaRef = useRef<TextAreaRef>(null)
  const emojiWrapperRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || ''

  // Lấy dữ liệu bài viết khi modal mở
  useEffect(() => {
    if (isOpen && postId) {
      fetchPostData()
    }
  },[isOpen, postId])

  // Lấy dữ liệu bài viết từ server theo ID
  const fetchPostData = async () => {
    setFetchingPost(true)
    try {
      const response = await postService.getPostById(postId)
      const post = response.post
      setText(post.content || '')
      setPrivacy(post.postPrivacy || 'Public')

      const images = post.postImages || []
      setOriginalImages(images)
      setExistingImages(images)
    } catch (error) {
      console.error('Error fetching post:', error)
      message.error('Unable to load post data!')
    } finally {
      setFetchingPost(false)
    }
  }

  const getPrivacyIcon = () => {
    switch (privacy) {
      case 'Public':
        return <GlobalOutlined className='text-blue-500' />
      case 'Friends':
        return <UsergroupAddOutlined className='text-green-500' />
      case 'Private':
        return <LockOutlined className='text-red-500' />
    }
  }

  // Hàm xử lý thay đổi quyền riêng tư khi click
  const handlePrivacyClick = () => {
    if (privacy === 'Public') setPrivacy('Friends')
    else if (privacy === 'Friends') setPrivacy('Private')
    else setPrivacy('Public')
  }

  // Hàm xử lý khi chọn emoji
  const handleEmojiSelect = (emoji: any) => {
    const emojiChar = emoji.native
    const textarea = textAreaRef.current?.resizableTextArea?.textArea
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = text.slice(0, start) + emojiChar + text.slice(end)
    setText(newText)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + emojiChar.length
    })
  }

  // Hàm effect để ẩn emoji picker khi click ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiWrapperRef.current && !emojiWrapperRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmojiPicker])

  // Hàm xử lý khi thay đổi ảnh
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const filesArray = Array.from(e.target.files)
    setNewImages((prev) => [...prev, ...filesArray])
    e.target.value = ''
  }

  // Hàm xóa ảnh hiện tại theo ID
  const removeExistingImage = (imageId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
  }

  // Hàm xóa ảnh mới theo index
  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Hàm xác nhận và xóa tất cả ảnh
  const removeAllImages = () => {
    Modal.confirm({
      title: 'Confirm delete all images',
      content: 'Are you sure you want to delete all images? This action cannot be undone.',
      okText: 'Delete all',
      cancelText: 'Cancel',
      okType: 'danger',
      onOk() {
        setExistingImages([])
        setNewImages([])
        message.success('All images have been removed')
      }
    })
  }

  // Hàm xử lý lưu bài viết
  const handleSave = async () => {
    if (!text.trim()) {
      message.warning('Please enter the post content!')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('Content', text)
      formData.append('PostPrivacy', privacy)

      // Kiểm tra nếu xóa hết ảnh
      const hasNoImages = existingImages.length === 0 && newImages.length === 0
      const hadOriginalImages = originalImages.length > 0

      if (hasNoImages && hadOriginalImages) {
        formData.append('RemoveAllImages', 'true')
      } else {
        formData.append('RemoveAllImages', 'false')

        // Tìm những ảnh bị xóa (có trong original nhưng không có trong existing)
        const deletedImageIds = originalImages
          .filter(originalImg => !existingImages.find(existingImg => existingImg.id === originalImg.id))
          .map(img => img.id)

        deletedImageIds.forEach((imageId) => {
          formData.append('ImageIdsToDelete', imageId)
        })
        newImages.forEach((file) => {
          formData.append('NewImages', file)
        })
      }

      const response = await postService.updatePost(postId, formData)

      message.success('Post updated successfully!')
      onSave(response.post)
      onClose()
      resetValue()
    } catch (error) {
      console.error('Error updating post:', error)
      message.error('An error occurred, please try again!')
    } finally {
      setLoading(false)
    }
  }

  const resetValue = () => {
    setText('')
    setExistingImages([])
    setNewImages([])
    setPrivacy('Public')
  }

  // Tổng hợp tất cả images để hiển thị
  const allImages = [
    ...existingImages.map((img, index) => ({
      type: 'existing' as const,
      data: img,
      index
    })),
    ...newImages.map((file, index) => ({
      type: 'new' as const,
      data: file,
      index
    }))
  ]

  return (
    <Modal
      open={isOpen}
      onCancel={() => {
        onClose()
        resetValue()
      }}
      footer={null}
      width={700}
      closable={false}
      title={
        <Flex justify='space-between'>
          <Flex align='center' gap='small'>
            <Avatar size={40} src={currentUser?.avatarUrl} style={{ minWidth: 40, minHeight: 40 }}>
              {currentUser?.firstName?.[0] || currentUser?.lastName?.[0] || ''}
            </Avatar>
            <Flex vertical>
              <Text strong>{fullName}</Text>
              <Text type='secondary' style={{ fontSize: '12px' }}>
                Edit post
              </Text>
            </Flex>
          </Flex>
          <Flex gap='small' align='flex-start'>
            <Button className='flex items-center gap-1 text-s !px-2 hover:bg-neutral-200' onClick={handlePrivacyClick}>
              {getPrivacyIcon()}
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={() => {
                onClose()
                resetValue()
              }}
            />
          </Flex>
        </Flex>
      }
    >
      {fetchingPost ? (
        <div className='text-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto'></div>
          <p className='mt-2 text-gray-600'>Loading data...</p>
        </div>
      ) : (
        <>
          <TextArea
            ref={textAreaRef}
            placeholder='What’s on your mind?'
            autoSize={{ minRows: 3, maxRows: 6 }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{ marginBottom: '8px' }}
          />

          <Flex gap='small' style={{ marginBottom: '16px' }}>
            <Button icon={<BoldOutlined />} />
            <Button icon={<ItalicOutlined />} />
            <div ref={emojiWrapperRef} className='relative inline-block'>
              <Button icon={<SmileOutlined />} onClick={() => setShowEmojiPicker((prev) => !prev)} />
              {showEmojiPicker && (
                <div className='absolute top-full left-0 z-20 shadow-lg border rounded-lg bg-white'>
                  <Picker
                    data={async () => {
                      const response = await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data')
                      return response.json()
                    }}
                    onEmojiSelect={handleEmojiSelect}
                    theme='light'
                    previewPosition='none'
                    skinTonePosition='none'
                  />
                </div>
              )}
            </div>

            <Button icon={<UnorderedListOutlined />} />
            <Button icon={<OrderedListOutlined />} />
          </Flex>

          <Divider className='!my-0 pb-5' />

          {/* Hiển thị images */}
          {allImages.length > 0 && (
            <>
              <Flex justify='flex-end' align='center' style={{ marginBottom: '8px' }}>
                <Button size='small' type='text' danger icon={<DeleteOutlined />} onClick={removeAllImages}>
                  Remove all images
                </Button>
              </Flex>

              <div
                className='grid gap-2 pb-5'
                style={{ gridTemplateColumns: allImages.length === 1 ? '1fr' : '1fr 1fr' }}
              >
                {allImages.slice(0, 4).map((item, displayIndex) => (
                  <div key={`${item.type}-${item.index}`} className='relative rounded-lg overflow-hidden'>
                    <img
                      src={item.type === 'existing' ? item.data.imageUrl : URL.createObjectURL(item.data)}
                      alt={`preview-${displayIndex}`}
                      className='w-full h-auto object-contain'
                    />
                    <button
                      onClick={() => {
                        if (item.type === 'existing') {
                          removeExistingImage(item.data.id)
                        } else {
                          removeNewImage(item.index)
                        }
                      }}
                      className='absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-opacity-75'
                    >
                      ×
                    </button>
                    {allImages.length > 4 && displayIndex === 3 && (
                      <div className='absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white text-xl font-bold rounded-lg cursor-pointer'>
                        +{allImages.length - 4}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <Flex justify='space-between' align='center'>
            <Flex gap='small'>
              <Button icon={<PictureOutlined />} onClick={() => fileInputRef.current?.click()}>
                Picture/video
              </Button>
              <input
                type='file'
                accept='image/*'
                multiple
                className='hidden'
                ref={fileInputRef}
                onChange={handleImageChange}
              />

              <Button icon={<PaperClipOutlined />}>Attachment</Button>
            </Flex>

            <Button loading={loading} type='primary' icon={<SaveOutlined />} onClick={handleSave}>
              Save Change
            </Button>
          </Flex>
        </>
      )}
    </Modal>
  )
}

export default EditPostModal