import React from 'react'
import { Modal, Button } from 'antd'
import { ActionType } from '@/app/types/Common'
import { UserDto } from '@/app/types/User/user.dto'

interface Props {
  open: boolean
  friend: UserDto | null
  type: ActionType
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
}

const actionConfig: Record<ActionType, { title: string; buttonText: string; danger: boolean }> = {
  unfriend: {
    title: 'Unfriend',
    buttonText: 'Unfriend',
    danger: true
  },
  unfollow: {
    title: 'Unfollow',
    buttonText: 'Unfollow',
    danger: false
  },
  block: {
    title: 'Block',
    buttonText: 'Block user',
    danger: true
  }
}

const ActionConfirmModal: React.FC<Props> = ({ open, friend, type, onCancel, onConfirm, loading }) => {
  if (!friend) return null

  const config = actionConfig[type]

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      closable={false}
      width={400}
      className='overflow-hidden pb-0'
    >
      <div className='flex flex-col items-center text-center pt-4'>
        <div className='relative mb-4'>
          <img
            src={friend.avatarUrl || ''}
            className='h-20 w-20 rounded-full object-cover border-2 border-gray-100 shadow-sm'
          />
        </div>

        <h3 className='text-lg font-semibold text-gray-800 mb-1'>
          {config.title} {friend.firstName}?
        </h3>
        <p className='text-gray-500 text-sm mb-6 px-4'>
          Are you sure you want to proceed? This action cannot be undone immediately.
        </p>

        <div className='w-full grid grid-cols-2 gap-3 mt-2'>
          <Button
            size='large'
            onClick={onCancel}
            className='rounded-lg font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 border-gray-200'
          >
            Cancel
          </Button>
          <Button
            size='large'
            type={config.danger ? 'primary' : 'default'}
            danger={config.danger}
            onClick={onConfirm}
            loading={loading}
            className={`rounded-lg font-medium shadow-none ${!config.danger ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}
          >
            {config.buttonText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ActionConfirmModal
