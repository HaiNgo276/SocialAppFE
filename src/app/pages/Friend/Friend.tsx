import React, { useState, useMemo, useEffect } from 'react'
import { Input, Empty, Tabs, message } from 'antd'
import { SearchOutlined, TeamOutlined, SendOutlined, UserOutlined } from '@ant-design/icons'
import { ActionType } from '@/app/types/Common'
import FriendCard from '@/app/components/Friend/FriendCard'
import RequestCard from '@/app/components/Friend/RequestCard'
import ActionConfirmModal from '@/app/common/Modals/ActionConfirmModal'
import { relationService } from '@/app/services/relation.service'
import { SentFriendRequestData } from '@/app/types/Relations/relations'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'
import { BaseResponse } from '@/app/types/Base/Responses/baseResponse'
import { UserDto } from '@/app/types/User/user.dto'

const FriendsList: React.FC = () => {
  const [friends, setFriends] = useState<UserDto[]>([])
  const [sentRequests, setSentRequests] = useState<SentFriendRequestData[]>([])
  const [receivedRequests, setReceivedRequests] = useState<SentFriendRequestData[]>([])

  const [searchText, setSearchText] = useState('')
  const [activeTab, setActiveTab] = useState('friends')

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<UserDto | null>(null)
  const [currentAction, setCurrentAction] = useState<ActionType>('unfriend')
  const [globalLoading, setGlobalLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const filteredFriends = useMemo(
    () => friends.filter((f: UserDto) => f.firstName.toLowerCase().includes(searchText.toLowerCase())),
    [friends, searchText]
  )
  const filteredSent = useMemo(
    () => sentRequests.filter((f) => f.receiver?.firstName.toLowerCase().includes(searchText.toLowerCase())),
    [sentRequests, searchText]
  )
  const filteredReceived = useMemo(
    () => receivedRequests.filter((f) => f.sender?.firstName.toLowerCase().includes(searchText.toLowerCase())),
    [receivedRequests, searchText]
  )

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setSearchText('')
  }

  const handleOpenModalAction = (type: ActionType, friend: UserDto) => {
    setSelectedFriend(friend)
    setCurrentAction(type)
    setModalOpen(true)
  }

  const handleConfirmModalAction = async () => {
    if (!selectedFriend) return
    setGlobalLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    // if (currentAction === 'unfriend' || currentAction === 'block') {
    //   setFriends((prev) => prev.filter((f) => f.id !== selectedFriend.id))
    // }
    setGlobalLoading(false)
    setModalOpen(false)
    setSelectedFriend(null)
  }

  const handleRequestAction = async (senderId: string, receiverId: string, type: 'accept' | 'decline' | 'cancel') => {
    setActionLoadingId(senderId)
    await new Promise((resolve) => setTimeout(resolve, 800)) // Fake API

    // if (type === 'accept') {
    //   const request = receivedRequests.find((r) => r.id === id)
    //   if (request) {
    //     setFriends((prev) => [{ ...request, status: 'online' }, ...prev])
    //     setReceivedRequests((prev) => prev.filter((r) => r.id !== id))
    //   }
    // } else if (type === 'decline') {
    //   setReceivedRequests((prev) => prev.filter((r) => r.id !== id))
    // } else if (type === 'cancel') {
    //   setSentRequests((prev) => prev.filter((r) => r.id !== id))
    // }

    setActionLoadingId(null)
  }

  const getFriends = async () => {
    try {
      const res = await relationService.getFriendsList()
      if (res.status === 200) {
        const resData = res.data as ResponseHasData<UserDto[]>
        setFriends(resData.data as UserDto[])
      } else {
        message.error('Error while getting friend list')
      }
    } catch (e) {
      console.log('Error get list follower: ', e)
    }
  }

  const approveFriendRequest = async (senderId: string) => {
    try {
      const res = await relationService.approveFriendRequest(senderId)
      const resData = res.data as BaseResponse
      if (res.status === 200) {
        message.success(resData.message)
      } else {
        message.error(resData.message)
      }
    } catch (err) {
      message.error('Error while approving friend request')
    }
  }

  const declineFriendRequest = async (senderId: string) => {
    try {
      const res = await relationService.declineFriendRequest(senderId)
      const resData = res.data as BaseResponse
      if (res.status === 200) {
        message.success(resData.message)
      } else {
        message.error(resData.message)
      }
    } catch (err) {
      message.error('Error while approving friend request')
    }
  }

  const cancelFriendRequest = async (receiverId: string) => {
    try {
      const res = await relationService.cancelFriendRequest(receiverId)
      const resData = res.data as BaseResponse
      if (res.status === 200) {
        message.success(resData.message)
      } else {
        message.error(resData.message)
      }
    } catch (err) {
      message.error('Error while approving friend request')
    }
  }

  const getFriendRequestsReceived = async () => {
    try {
      const res = await relationService.getFriendRequestsReceived()
      if (res.status === 200) {
        const resData = res.data as ResponseHasData<SentFriendRequestData[]>
        setReceivedRequests(resData.data as SentFriendRequestData[])
      } else {
        message.error('Get request failed!')
      }
    } catch (err) {
      message.error('Get request failed!')
    }
  }

  useEffect(() => {
    getFriendRequestsReceived()
    getFriends()
  }, [])

  const renderSearchBar = (placeholder: string) => (
    <Input
      prefix={<SearchOutlined className='text-gray-400' />}
      placeholder={placeholder}
      value={searchText}
      onChange={(e) => setSearchText(e.target.value)}
      allowClear
      className='mb-6 py-2 rounded-lg'
    />
  )

  const items = [
    {
      key: 'friends',
      label: (
        <span>
          <TeamOutlined className='mr-2' />
          Friends ({friends.length})
        </span>
      ),
      children: (
        <div className='mt-4'>
          {renderSearchBar('Search friends...')}
          {filteredFriends.length > 0 ? (
            <div className='grid grid-cols-1 gap-3'>
              {filteredFriends.map((friend: any) => (
                <FriendCard key={friend.id} friend={friend} onAction={handleOpenModalAction} />
              ))}
            </div>
          ) : (
            <Empty description='No friends found' className='my-10' />
          )}
        </div>
      )
    },
    {
      key: 'received',
      label: (
        <span>
          <UserOutlined className='mr-2' />
          Requests ({receivedRequests.length})
        </span>
      ),
      children: (
        <div className='mt-4'>
          {renderSearchBar('Search received requests...')}
          {filteredReceived.length > 0 ? (
            <div className='grid grid-cols-1 gap-3'>
              {filteredReceived.map((req) => (
                <RequestCard
                  key={req.senderId}
                  request={req}
                  type='received'
                  onConfirm={() => approveFriendRequest(req.senderId)}
                  onDelete={() => declineFriendRequest(req.senderId)}
                  loading={actionLoadingId === req.senderId}
                />
              ))}
            </div>
          ) : (
            <Empty description='No new requests' className='my-10' />
          )}
        </div>
      )
    },
    {
      key: 'sent',
      label: (
        <span>
          <SendOutlined className='mr-2' />
          Sent ({sentRequests.length})
        </span>
      ),
      children: (
        <div className='mt-4'>
          {renderSearchBar('Search sent requests...')}
          {filteredSent.length > 0 ? (
            <div className='grid grid-cols-1 gap-3'>
              {filteredSent.map((req) => (
                <RequestCard
                  key={req.receiverId}
                  request={req}
                  type='sent'
                  onDelete={(id) => cancelFriendRequest(req.receiverId)}
                  loading={actionLoadingId === req.senderId}
                />
              ))}
            </div>
          ) : (
            <Empty description='No sent requests found' className='my-10' />
          )}
        </div>
      )
    }
  ]

  return (
    <div className='mx-auto max-w-3xl p-4 md:p-6'>
      <div className='bg-white rounded-2xl shadow-sm border border-gray-200 p-6'>
        <h1 className='text-2xl font-bold mb-4 text-gray-800'>Friends List</h1>
        <Tabs activeKey={activeTab} onChange={handleTabChange} items={items} className='custom-tabs' />
      </div>

      <ActionConfirmModal
        open={modalOpen}
        friend={selectedFriend}
        type={currentAction}
        loading={globalLoading}
        onCancel={() => setModalOpen(false)}
        onConfirm={handleConfirmModalAction}
      />
    </div>
  )
}

export default FriendsList
