import { conversationService } from '@/app/services/conversation.service'
import { userService } from '@/app/services/user.service'
import { BaseResponse } from '@/app/types/Base/Responses/baseResponse'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'
import { UserDto } from '@/app/types/User/user.dto'
import { SearchOutlined } from '@ant-design/icons'
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Avatar, ConfigProvider, Input, message, Modal } from 'antd'
import { useState } from 'react'

const ModalNewMessage: React.FC<{ isModalOpen: boolean; onClose: () => void }> = ({ isModalOpen, onClose }) => {
  const [users, setUsers] = useState<UserDto[]>([])
  const [selectdUsers, setSelectedUsers] = useState<string[]>([])

  const handleSelectUsers = (userId: string) => {
    if (selectdUsers.some((id) => id === userId)) {
      setSelectedUsers(selectdUsers.filter((id) => id !== userId))
    } else {
      setSelectedUsers([...selectdUsers, userId])
    }
    console.log(selectdUsers)
  }

  const searchUsers = async (keyword: string) => {
    try {
      const response = await userService.searchUsers(keyword)
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        const conversationData = response.data as ResponseHasData<UserDto[]>
        setUsers(conversationData.data as UserDto[])
      }
    } catch (err) {
      return
    }
  }

  const createConversation = async () => {
    if (selectdUsers.length < 1) {
      message.error('At least 2 users are required for a conversation')
      return
    }
    const conversationType = selectdUsers.length === 1 ? 'Personal' : 'Group'
    try {
      const response = await conversationService.createConversation(selectdUsers, conversationType)
      if (response.status === 400) {
        const res = response.data as BaseResponse
        message.error(res.message)
      } else if (response.status === 200) {
        const res = response.data as ResponseHasData<string>
        window.location.href = `/Inbox/${res.data}`
      }
    } catch (err) {
      message.error('Cannot create conversation')
    }
  }
  return (
    <div>
      <Modal
        footer=''
        title='Search User'
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isModalOpen}
        onCancel={onClose}
      >
        <ConfigProvider
          theme={{
            components: {
              Input: {
                activeBorderColor: 'none',
                activeBg: 'transparent',
                hoverBg: 'none',
                hoverBorderColor: 'none',
                activeShadow: '0 0 0 1px rgba(61, 61, 61, 0.14)'
              }
            }
          }}
        >
          <Input
            className='bg-[#ededf3]'
            size='large'
            placeholder='Search users by username or email or name'
            prefix={<SearchOutlined className='text-lg' />}
            onChange={(e) => {
              setTimeout(() => {
                searchUsers(e.target.value)
              }, 500)
            }}
          />
        </ConfigProvider>
        <ul className='flex flex-col gap-4 justify-center mt-4'>
          {users.map((user) => (
            <li
              key={user.id}
              onClick={() => handleSelectUsers(user.id)}
              className={`${selectdUsers.some((id) => id === user.id) ? 'bg-[#121212] text-white' : ''} flex gap-4 items-center cursor-default hover:bg-[#121212] hover:text-white px-[4px] py-[4px] rounded-[20px]`}
            >
              <Avatar src={user.avatarUrl} />
              <div className='flex flex-col justify-around'>
                <p className='text-sm'>{user.lastName + user.firstName}</p>
                <p className='text-xs'>{user.userName}</p>
              </div>
            </li>
          ))}
          <button
            onClick={() => createConversation()}
            className='bg-black text-white rounded-[20px] flex gap-2 items-center justify-center py-[8px]'
          >
            <p>Send new message</p>
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </ul>
      </Modal>
    </div>
  )
}

export default ModalNewMessage
