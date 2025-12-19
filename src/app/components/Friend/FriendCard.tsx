import React from 'react'
import { Dropdown, Button, MenuProps } from 'antd'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEllipsisVertical, faComment, faUserXmark, faBan } from '@fortawesome/free-solid-svg-icons'
import { ActionType } from '@/app/types/Common'
import { useNavigate } from 'react-router-dom'
import { UserDto } from '@/app/types/User/user.dto'

interface FriendCardProps {
  friend: UserDto
  onAction: (type: ActionType, friend: UserDto) => void
}

const statusColor: { [key: string]: string } = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-yellow-500'
}

const FriendCard: React.FC<FriendCardProps> = ({ friend, onAction }) => {
  const navigate = useNavigate()
  const menuItems: MenuProps['items'] = [
    {
      key: 'message',
      icon: <FontAwesomeIcon icon={faComment} className='text-gray-500' />,
      label: `Message`,
      onClick: () => console.log('Navigate to chat:', friend.id)
    },
    {
      type: 'divider'
    },
    {
      key: 'unfriend',
      icon: <FontAwesomeIcon icon={faUserXmark} />,
      label: 'Unfriend',
      danger: true,
      onClick: () => onAction('unfriend', friend)
    },
    {
      key: 'block',
      icon: <FontAwesomeIcon icon={faBan} />,
      label: 'Block',
      danger: true,
      onClick: () => onAction('block', friend)
    }
  ]

  return (
    <div className='flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-100'>
      <div className='flex gap-4 items-center'>
        <div className='relative'>
          <img src={friend.avatarUrl || ''} className='h-12 w-12 rounded-full object-cover border border-gray-200' />
          <span
            className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${statusColor[friend.status.toLowerCase() as keyof typeof statusColor]}`}
          ></span>
        </div>

        <div>
          <h4
            className='font-semibold text-gray-900 text-base hover:underline hover:cursor-pointer'
            onClick={() => navigate(`/profile/${friend.userName}`)}
          >
            {friend.lastName + ' ' + friend.firstName}
          </h4>
          <p className='text-xs text-gray-500 capitalize'>{friend.status}</p>
        </div>
      </div>

      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement='bottom'>
        <Button type='text' shape='circle' className='text-gray-400 hover:text-gray-600 hover:bg-gray-100'>
          <FontAwesomeIcon icon={faEllipsisVertical} />
        </Button>
      </Dropdown>
    </div>
  )
}

export default FriendCard
