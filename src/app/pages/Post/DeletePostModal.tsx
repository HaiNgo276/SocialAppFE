import React from 'react'
import { Modal, message } from 'antd'
import { ExclamationCircleOutlined } from '@ant-design/icons'
import { postService } from '@/app/services/post.service'

interface DeletePostModalProps {
  isOpen: boolean
  onClose: () => void
  onDeleteSuccess: () => void
  postId: string
}

const DeletePostModal: React.FC<DeletePostModalProps> = ({ isOpen, onClose, onDeleteSuccess, postId }) => {
  const handleDelete = async () => {
    try {
      message.loading({ content: 'Deleting post...', key: 'deletePost' })
      await postService.deletePost(postId)
      message.success({
        content: 'Post deleted successfully!',
        key: 'deletePost',
        duration: 3
      })

      onDeleteSuccess()
      onClose()
    } catch (error) {
      console.error('Error deleting post:', error)
      message.error({
        content: 'Failed to delete post. Please try again.',
        key: 'deletePost',
        duration: 5
      })
    }
  }

  return (
    <Modal
      title={
        <div className='flex items-center'>
          <ExclamationCircleOutlined className='text-red-500 mr-2' />
          Delete post
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      onOk={handleDelete}
      okText='Delete'
      cancelText='Cancel'
      okType='danger'
      centered
      width={420}
    >
      <div className='py-4'>
        <p>Are you sure you want to delete this post?</p>
        <p className='text-gray-500 text-sm mt-2'>
          This action cannot be undone. The post and all its comments will be permanently deleted.
        </p>
      </div>
    </Modal>
  )
}

export default DeletePostModal