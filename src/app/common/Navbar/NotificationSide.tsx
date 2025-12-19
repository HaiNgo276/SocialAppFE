import { notificationService } from '@/app/services/notification.service'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'
import { NotificationDto } from '@/app/types/Notification/notification.dto'
import { useEffect, useState } from 'react'
import { Avatar } from 'antd'
import { chatService } from '@/app/services/chat.service'
import dayjs from 'dayjs'
import { useUnread } from '../Contexts/UnreadContext'
import { useNavigate } from 'react-router-dom'

const NotificationSide: React.FC<{ show: boolean }> = ({ show }) => {
  const navigate = useNavigate()
  const [skip, setSkip] = useState(0)
  const [take, setTake] = useState(10)
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const { setUnreadNotis } = useUnread()

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getNotis(skip, take)
      if (response.status === 200) {
        const resData = response.data as ResponseHasData<NotificationDto[]>
        setNotifications(resData.data as NotificationDto[])
      } else {
        return
      }
    } catch (err) {
      return
    }
  }

  const formatNotiTime = (time: Date) => {
    const now = dayjs()
    const updated = dayjs(time)

    const diffMinutes = now.diff(updated, 'minute')
    const diffHours = now.diff(updated, 'hour')
    const diffDays = now.diff(updated, 'day')

    if (diffMinutes < 60) return `${diffMinutes}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays <= 7) return `${diffDays}d`
    return updated.format('DD/MM/YYYY')
  }

  const highlightText = (content: string, highlights: { offset: number; length: number }[]) => {
    const parts = []
    let currentIndex = 0
    const sortedHighlights = [...(highlights ?? [])].sort((a, b) => a.offset - b.offset)

    for (const h of sortedHighlights) {
      const { offset, length } = h
      if (currentIndex < offset) {
        parts.push({
          text: content.trim().slice(currentIndex, offset),
          highlight: false
        })
      }

      parts.push({
        text: content.trim().slice(offset, offset + length),
        highlight: true
      })
      currentIndex = offset + length
    }

    if (currentIndex < content.length) {
      parts.push({
        text: content.trim().slice(currentIndex),
        highlight: false
      })
    }
    return parts
  }

  const markNotiAsRead = async (notificationId: string) => {
    try {
      const response = await notificationService.markNotiAsRead(notificationId)
      if (response.status === 200) {
        setNotifications((prevNotis) => prevNotis.map((n) => (n.id === notificationId ? { ...n, unread: false } : n)))
        setUnreadNotis((prev: number) => prev - 1)
      } else {
        return
      }
    } catch (err) {
      return
    }
  }

  const markAllNotisAsRead = async () => {
    try {
      const response = await notificationService.markAllNotisAsRead()
      if (response.status === 200) {
        setNotifications((prevNotis) => prevNotis.map((n) => ({ ...n, unread: false })))
        setUnreadNotis(0)
      } else {
        return
      }
    } catch (err) {
      return
    }
  }

  useEffect(() => {
    fetchNotifications()
    chatService.updateNotification((newNoti: NotificationDto) => {
      setNotifications((prevNotis) => {
        const exists = prevNotis.some((noti) => noti.id === newNoti.id)

        if (exists) {
          // Update
          setUnreadNotis((prev: number) => prev + 1)
          return prevNotis.map((noti) => (noti.id === newNoti.id ? newNoti : noti))
        } else {
          // Thêm mới
          setUnreadNotis((prev: number) => prev + 1)
          return [newNoti, ...prevNotis]
        }
      })
    })
  }, [])
  return (
    <div
      className={`bg-gray-100 sticky h-screen top-0 bottom-0 text-black ${
        show ? 'w-[400px]' : 'w-0'
      } overflow-x-hidden transition-all duration-300 ease-in-out`}
    >
      <ul className='flex flex-col w-full divide-y divide-gray-300'>
        <button onClick={() => markAllNotisAsRead()} className='p-[8px] hover:bg-gray-300'>
          Mark all as read
        </button>
        {notifications.map((noti, index) => (
          <li
            key={index}
            className={`w-[96%] flex items-center gap-3 px-4 py-3 hover:bg-gray-400 ${noti.unread ? 'bg-gray-300' : ''} transition-colors duration-200 cursor-pointer`}
            onMouseEnter={() => {
              if (noti.unread) markNotiAsRead(noti.id)
            }}
            onClick={() => {
              navigate(`${noti.navigateUrl}`)
            }}
          >
            <div className='min-w-[60px] flex justify-center'>
              {noti.imageUrls.length >= 2 ? (
                <Avatar.Group>
                  <Avatar src={noti.imageUrls[0]} />
                  <Avatar src={noti.imageUrls[1]} />
                </Avatar.Group>
              ) : (
                <Avatar src={noti.imageUrls[0]} />
              )}
            </div>
            <div className='flex flex-col'>
              <span className='text-gray-800 leading-snug'>
                {highlightText(noti.content, noti.highlights ?? []).map((p, i) =>
                  p.highlight ? <strong key={i}>{p.text}</strong> : <span key={i}>{p.text}</span>
                )}
              </span>
              <span className='text-gray-500 text-sm'>{formatNotiTime(noti.updatedAt)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default NotificationSide
