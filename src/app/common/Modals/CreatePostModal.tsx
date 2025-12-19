import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { Modal, Button, Input, Avatar, Flex, Typography, Divider, message } from 'antd'
import {
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  PictureOutlined,
  PaperClipOutlined,
  PlusOutlined,
  CloseOutlined,
  SmileOutlined
} from '@ant-design/icons'
// import EmojiPicker, { EmojiClickData } from 'emoji-picker-react'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { TextAreaRef } from 'antd/es/input/TextArea'
import { ModalProps } from '@/app/types/Common'
import { postService } from '@/app/services/post.service'
import { useUserStore } from '@/app/stores/auth'

const { TextArea } = Input
const { Text } = Typography

const CreatePostModal = ({ isModalOpen, handleCancel, onCreatePostSuccess, groupId, currentUser }: ModalProps) => {
  const { user } = useUserStore()
  const [privacy, setPrivacy] = useState<'Public' | 'Friends' | 'Private'>('Public')
  const [text, setText] = useState('')
  const [images, setImages] = useState<File[]>([])

  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const textAreaRef = useRef<TextAreaRef>(null)
  const emojiWrapperRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || ''
  const renderPrivacyIcon = () => {
    const iconClass = 'w-4 h-4 text-gray-500'

    switch (privacy) {
      case 'Public':
        return (
          <svg className={iconClass} fill='currentColor' viewBox='0 0 20 20'>
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0710 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z'
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

  const handlePrivacyClick = () => {
    if (privacy === 'Public') setPrivacy('Friends')
    else if (privacy === 'Friends') setPrivacy('Private')
    else setPrivacy('Public')
  }

  const handleEmojiSelect = (emojiData: any) => {
    const emoji = emojiData.native
    const textarea = textAreaRef.current?.resizableTextArea?.textArea
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = text.slice(0, start) + emoji + text.slice(end)
    setText(newText)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length
    })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiWrapperRef.current && !emojiWrapperRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmojiPicker])

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const filesArray = Array.from(e.target.files)
    setImages((prev) => [...prev, ...filesArray])
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handlePost = async () => {
    if (!text) {
      message.warning('Please enter content!')
      return
    }
    const formData = new FormData()
    formData.append('Content', text)
    formData.append('PostPrivacy', privacy)

    images.forEach((file) => {
      formData.append('Images', file)
    })
    if (groupId) {
      formData.append('GroupId', groupId)
    }

    setLoading(true)
    try {
      const res = await postService.createPost(formData)

      if (res?.message) {
        message.success('Post created successfully!')
        handleCancel()
        onCreatePostSuccess?.()
        resetValue()
      } else {
        message.error('Failed to create post, please try again!')
      }
    } catch (err) {
      console.error(err)
      message.error('An error occurred, please try again!')
    } finally {
      setLoading(false)
    }
  }

  const resetValue = () => {
    setText('')
    setImages([])
    setPrivacy('Public')
  }

  return (
    <Modal
      open={isModalOpen}
      onCancel={() => {
        handleCancel()
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
            </Flex>
          </Flex>
          <Flex gap='small' align='flex-start'>
            <Button className='flex items-center gap-1 text-s !px-2 hover:bg-neutral-200' onClick={handlePrivacyClick}>
              {renderPrivacyIcon()}
            </Button>
            <Button
              icon={<CloseOutlined />}
              onClick={() => {
                handleCancel()
                resetValue()
              }}
            />
          </Flex>
        </Flex>
      }
    >
      <TextArea
        ref={textAreaRef}
        placeholder='Tell us about your thoughts?'
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
            <div className='absolute top-full left-0 z-20 h-[400px] overflow-hidden shadow-md bg-white'>
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                previewPosition='none'
                theme='light'
                navPosition='top'
                perLine={8}
                emojiSize={22}
              />
            </div>
          )}
        </div>

        <Button icon={<UnorderedListOutlined />} />
        <Button icon={<OrderedListOutlined />} />
      </Flex>

      <Divider className='!my-0' />

      <div className='grid gap-2 pb-5' style={{ gridTemplateColumns: images.length === 1 ? '1fr' : '1fr 1fr' }}>
        {images.slice(0, 4).map((file, index) => (
          <div key={index} className='relative rounded-lg overflow-hidden'>
            <img src={URL.createObjectURL(file)} alt={`preview-${index}`} className='w-full h-auto object-contain' />
            <button
              onClick={() => removeImage(index)}
              className='absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold'
            >
              ×
            </button>
            {images.length > 4 && index === 3 && (
              <div className='absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white text-xl font-bold rounded-lg cursor-pointer'>
                +{images.length - 4}
              </div>
            )}
          </div>
        ))}
      </div>

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

        <Button loading={loading} type='primary' icon={<PlusOutlined />} onClick={handlePost}>
          Post
        </Button>
      </Flex>
    </Modal>
  )
}

export default CreatePostModal
