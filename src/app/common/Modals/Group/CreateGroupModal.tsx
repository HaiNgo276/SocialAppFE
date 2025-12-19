import { Modal, Form, Input, Select, message, Button } from 'antd'
import { useState, useRef, ChangeEvent, useEffect } from 'react'
import { PictureOutlined, SmileOutlined } from '@ant-design/icons'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { groupService } from '@/app/services/group.service'
import { CreateGroupRequest } from '@/app/types/Group/GroupRequest'

interface CreateGroupModalProps {
  isModalOpen: boolean
  handleCancel: () => void
  onCreateGroupSuccess: () => void
}

const CreateGroupModal = ({ isModalOpen, handleCancel, onCreateGroupSuccess }: CreateGroupModalProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string>('')
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiWrapperRef = useRef<HTMLDivElement>(null)
  const descriptionRef = useRef<any>(null)

  // Xử lý click bên ngoài để đóng emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiWrapperRef.current && !emojiWrapperRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    if (showEmojiPicker) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showEmojiPicker])

  // Xử lý chọn emoji và chèn vào vị trí con trỏ trong textarea
  const handleEmojiSelect = (emojiData: any) => {
    const emoji = emojiData.native
    const textarea = descriptionRef.current?.resizableTextArea?.textArea
    const currentValue = form.getFieldValue('description') || ''

    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newText = currentValue.slice(0, start) + emoji + currentValue.slice(end)
    form.setFieldValue('description', newText)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.selectionStart = textarea.selectionEnd = start + emoji.length
    })
  }

  // Xử lý thay đổi ảnh và tạo preview
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    setImageFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Xử lý xóa ảnh đã chọn
  const handleRemoveImage = () => {
    setImageFile(null)
    setPreviewImage('')
  }

  // Xử lý tạo nhóm mới
  const handleCreateGroup = async (values: Omit<CreateGroupRequest, 'image'>) => {
    try {
      setLoading(true)

      const request: CreateGroupRequest = {
        ...values,
        image: imageFile || undefined
      }
      const response = await groupService.createGroup(request)

      if (response.groupId) {
        message.success('Group created successfully!')
        form.resetFields()
        setImageFile(null)
        setPreviewImage('')
        onCreateGroupSuccess()
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Unable to create group'
      message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Xử lý đóng modal và reset form
  const handleModalCancel = () => {
    form.resetFields()
    setImageFile(null)
    setPreviewImage('')
    setShowEmojiPicker(false)
    handleCancel()
  }

  return (
    <Modal
      title='Create New Group'
      open={isModalOpen}
      onCancel={handleModalCancel}
      footer={
        <div className='flex justify-between items-center'>
          <div className='flex items-center gap-3'>
            <Button icon={<PictureOutlined />} onClick={() => fileInputRef.current?.click()} disabled={loading}>
              {imageFile ? 'Change Image' : 'Select Image'}
            </Button>
            <div ref={emojiWrapperRef} className='relative'>
              <Button icon={<SmileOutlined />} onClick={() => setShowEmojiPicker((prev) => !prev)} disabled={loading} />
              {showEmojiPicker && (
                <div className='absolute bottom-full left-0 mb-2 z-20 h-[400px] overflow-hidden shadow-md bg-white'>
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
          </div>
          <Button type='primary' onClick={() => form.submit()} loading={loading}>
            Create Group
          </Button>
        </div>
      }
      width={600}
    >
      <Form form={form} layout='vertical' onFinish={handleCreateGroup} initialValues={{ isPublic: true }}>
        <Form.Item
          label='Group Name'
          name='name'
          rules={[
            { required: true, message: 'Please enter group name!' },
            { min: 3, message: 'Group name must be at least 3 characters!' },
            { max: 100, message: 'Group name must not exceed 100 characters!' }
          ]}
        >
          <Input placeholder='Enter group name' size='large' />
        </Form.Item>

        <Form.Item
          label='Description'
          name='description'
          rules={[
            { required: true, message: 'Please enter group description!' },
            { min: 10, message: 'Description must be at least 10 characters!' },
            { max: 500, message: 'Description must not exceed 500 characters!' }
          ]}
        >
          <Input.TextArea
            ref={descriptionRef}
            placeholder='Describe your group...'
            rows={4}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          label='Privacy'
          name='isPublic'
          rules={[{ required: true, message: 'Please select privacy setting!' }]}
          tooltip='Public groups can be discovered and joined by anyone. Private groups are invite-only.'
        >
          <Select size='large' placeholder='Select privacy setting'>
            <Select.Option value={true}>Public</Select.Option>
            <Select.Option value={false}>Private</Select.Option>
          </Select>
        </Form.Item>

        {previewImage && (
          <Form.Item label='Group Image'>
            <div className='relative w-full'>
              <img
                src={previewImage}
                alt='Preview'
                className='w-full h-auto object-cover rounded-lg border border-gray-200'
              />
              <button
                onClick={handleRemoveImage}
                className='absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold hover:bg-opacity-75 transition-all'
              >
                ×
              </button>
            </div>
          </Form.Item>
        )}
      </Form>

      <input type='file' accept='image/*' className='hidden' ref={fileInputRef} onChange={handleImageChange} />
    </Modal>
  )
}

export default CreateGroupModal