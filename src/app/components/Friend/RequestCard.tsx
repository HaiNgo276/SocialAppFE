import React from 'react'
import { Button } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faClock, faXmark } from '@fortawesome/free-solid-svg-icons'
import { useNavigate } from 'react-router-dom'
import { SentFriendRequestData } from '@/app/types/Relations/relations'
import { getTimeAgo } from '@/app/helper'

interface RequestCardProps {
  request: SentFriendRequestData
  type: 'sent' | 'received'
  onConfirm?: (senderId: string, receiverId: string) => void
  onDelete?: (senderId: string, receiverId: string) => void
  loading?: boolean
}

const RequestCard: React.FC<RequestCardProps> = ({ request, type, onConfirm, onDelete, loading }) => {
  const navigate = useNavigate()
  return (
    <div className='flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-100'>
      <div className='flex items-center gap-4'>
        <img
          src={request?.sender?.avatarUrl || '/placeholder.svg'}
          className='h-14 w-14 rounded-full object-cover border border-gray-200'
        />

        <div>
          <h3
            className='font-semibold text-gray-900 text-base hover:underline hover:cursor-pointer'
            onClick={() => navigate(`/profile/${request?.sender?.userName}`)}
          >
            {request?.sender?.lastName || '' + request?.sender?.firstName || ''}
          </h3>

          {
            <p className='flex items-center gap-1.5 text-xs text-gray-500 mt-1'>
              <FontAwesomeIcon icon={faClock} />
              {getTimeAgo(String(request.createdAt))}
            </p>
          }
        </div>
      </div>

      <div className='flex items-center gap-2'>
        {type === 'received' ? (
          <>
            <Button
              type='primary'
              size='large'
              className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700'
              onClick={() => onConfirm?.(request.senderId, request.receiverId)}
              loading={loading}
            >
              <FontAwesomeIcon icon={faCheck} />
              Confirm
            </Button>

            <Button
              type='default'
              size='large'
              className='flex items-center gap-2 bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
              onClick={() => onDelete?.(request.senderId, request.receiverId)}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faXmark} />
              Delete
            </Button>
          </>
        ) : (
          <Button
            danger
            size='large'
            type='default'
            className='flex items-center gap-2 hover:bg-red-50'
            onClick={() => onDelete?.(request.senderId, request.receiverId)}
            loading={loading}
          >
            <FontAwesomeIcon icon={faXmark} />
            Cancel Request
          </Button>
        )}
      </div>
    </div>
  )
}

export default RequestCard
