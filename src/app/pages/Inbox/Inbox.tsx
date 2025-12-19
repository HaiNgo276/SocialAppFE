import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Avatar, ConfigProvider, Divider, Input, List, message, Skeleton, Tooltip, Image } from 'antd'
import { PhoneOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheck,
  faCheckDouble,
  faCircleStop,
  faEllipsisVertical,
  faEye,
  faFaceSmile,
  faImage,
  faMicrophone,
  faPaperclip,
  faPause,
  faPenToSquare,
  faPlay,
  faPlus,
  faReply,
  faXmark
} from '@fortawesome/free-solid-svg-icons'
import RecordRTC, { StereoAudioRecorder } from 'recordrtc'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import WaveSurfer from 'wavesurfer.js'
import InfiniteScroll from 'react-infinite-scroll-component'

import { UserDto } from '@/app/types/User/user.dto'
import { MessageDto } from '@/app/types/Message/messge.dto'
import { ConversationDto } from '@/app/types/Conversation/conversation.dto'
import { ConversationUserDto } from '@/app/types/ConversationUser/conversationUser.dto'

import { userService } from '@/app/services/user.service'
import { chatService } from '@/app/services/chat.service'
import { messageService } from '@/app/services/message.service'
import { conversationService } from '@/app/services/conversation.service'
import { conversationUserService } from '@/app/services/conversation.user.service'

import { BaseResponse } from '@/app/types/Base/Responses/baseResponse'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'

import VoiceWave from '@/app/common/VoiceWave/VoiceWave'
import ModalNewMessage from './ModalNewMessage'
import { useUnread } from '@/app/common/Contexts/UnreadContext'

const Inbox: React.FC = () => {
  const navigate = useNavigate()
  const firstMessageRef = useRef<HTMLDivElement | null>(null)
  const newestMessageRef = useRef<HTMLDivElement | null>(null)
  const [conversation, setConversation] = useState<ConversationDto | null>(null)
  const [conversationUsers, setConversationUsers] = useState<ConversationUserDto[]>([])
  const [isChatFocused, setIsChatFocused] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const { conversationId } = useParams()
  const [userInfo, setUserInfo] = useState<UserDto | null>(null)
  const [receivers, setReceivers] = useState<UserDto[]>([])
  const messageEndRef = useRef<HTMLDivElement | null>(null)
  const [text, setText] = useState('')
  const [repliedMessagePreview, setRepliedMessagePreview] = useState<MessageDto | null>(null)
  const [skipMessages, setSkipMessages] = useState(0)
  const [takeMessages, setTakeMessages] = useState(20)
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagesPreview, setImagesPreview] = useState<string[]>([])
  const recorderRef = useRef<RecordRTC | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const waveformRef = useRef(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const [previewVoicePlaying, setPreviewVoicePlaying] = useState(false)
  const [conversations, setConversations] = useState<ConversationDto[]>([])

  const reactions = ['👍', '❤️', '😂', '😮', '😢']
  const reactionBarRef = useRef<HTMLDivElement>(null)
  const pickerEmotionRef = useRef<HTMLDivElement>(null)
  const [messageReactionBar, setMessageReactionBar] = useState<string | null>(null)
  const [fullyReactionSelection, setfullyReactionSelection] = useState<string | null>(null)

  const [isModalNewMessageOpen, setIsModalNewMessageOpen] = useState(false)

  const [messageUnseen, setMessageUnseen] = useState(0)
  const { setUnreadMessages } = useUnread()

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream
    recorderRef.current = new RecordRTC(stream, {
      type: 'audio',
      mimeType: 'audio/wav', // Định dạng đầu ra
      recorderType: StereoAudioRecorder,
      desiredSampRate: 16000 // Tần số lấy mẫu
    })
    recorderRef.current.startRecording()
    setIsRecording(true)
  }

  const stopRecording = () => {
    recorderRef.current?.stopRecording(() => {
      const blob = recorderRef.current?.getBlob()
      if (blob) {
        setAudioUrl(URL.createObjectURL(blob))
        setAudioBlob(blob)
      }
      streamRef.current?.getTracks().forEach((track) => track.stop())
      setIsRecording(false)
    })
  }

  const togglePreviewRecord = () => {
    wavesurferRef.current?.playPause()
  }

  const loadMoreMessage = () => {
    const firstVisible = firstMessageRef.current
    if (!firstVisible) return
    const oldTopId = firstVisible?.id
    setSkipMessages(skipMessages + 20)
    const element = document.getElementById(oldTopId || '')
    element?.scrollIntoView({ block: 'start' })
  }

  const handleSendMessage = () => {
    const formData = new FormData()
    formData.append('senderId', userInfo?.id || '')
    formData.append('conversationId', conversationId || '')
    formData.append('content', text)
    if (repliedMessagePreview !== null) formData.append('repliedMessageId', repliedMessagePreview.id)
    // Gửi ảnh và text
    if (imageFiles.length !== 0 && audioUrl === null) {
      imageFiles.forEach((file) => {
        formData.append('files', file)
      })
      formData.append('fileType', 'Image')
      onSendMessage(formData)
      if (text.trim() !== '') {
        setText('')
      }
      setImageFiles([])
      setImagesPreview([])
    }
    // Gửi voice
    else if (audioUrl !== null && audioBlob !== null && imageFiles.length === 0) {
      formData.append('files', new File([audioBlob], `${userInfo?.id}_${Date.now()}_voice.wav`, { type: 'audio/wav' }))
      formData.append('fileType', 'Voice')
      setAudioBlob(null)
      setAudioUrl(null)
      onSendMessage(formData)
      if (text.trim() !== '') {
        setText('')
      }
    }
    // Gửi text
    else if (imageFiles.length === 0 && audioUrl === null) {
      if (text.trim() !== '') {
        onSendMessage(formData)
        setText('')
      }
    } else {
      message.error('Can not send image and voice at the same time')
    }
    setRepliedMessagePreview(null)
  }

  const onSendMessage = async (sendMessageRequest: FormData) => {
    try {
      const sendMessageReponse = await messageService.sendMessage(sendMessageRequest)
      if (sendMessageReponse.status === 400) {
        const res = sendMessageReponse.data as BaseResponse
        message.error(res.message)
      } else if (sendMessageReponse.status === 200) {
        const res = sendMessageReponse.data as ResponseHasData<MessageDto>
        setMessages([...messages, res.data as MessageDto])
        updateItemInConversations(conversationId || '', res.data as MessageDto, null)
        setTimeout(() => {
          newestMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
        }, 100)
      }
    } catch (err) {
      message.error('Error while getting user infomation!')
    }
  }

  const fetchUserInfo = async () => {
    try {
      const response = await userService.getUserInfoByToken()
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        setUserInfo(response.data as UserDto)
      }
    } catch (err) {
      message.error('Error while getting user infomation!')
    }
  }

  const fetchConversation = async () => {
    try {
      const response = await conversationService.getConversation(conversationId || '')
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        const conversationData = response.data as ResponseHasData<ConversationDto>
        setConversation(conversationData.data as ConversationDto)
      }
    } catch (err) {
      return
    }
  }

  const fetchAllConversations = async () => {
    try {
      const response = await conversationService.getAllConversationsByUser()
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        const conversationUsersRes = response.data as ResponseHasData<ConversationDto[]>
        setConversations(conversationUsersRes.data as ConversationDto[])
      }
    } catch (err) {
      message.error('Error while getting list conversations')
    }
  }

  const fetchConversationUsers = async () => {
    try {
      const response = await conversationUserService.getConversationUser({
        senderId: userInfo?.id || '',
        conversationId: conversationId || '',
        conversationType: conversation?.type || ''
      })
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        const conversationUsersRes = response.data as ResponseHasData<ConversationUserDto[]>
        setConversationUsers(conversationUsersRes.data as ConversationUserDto[])
      }
    } catch (err) {
      return
    }
  }

  const fetchReceiversInfo = async () => {
    try {
      let userIds: string[] = []
      if (conversation?.type === 'Personal') {
        const otherId = conversationUsers.find((u) => u.userId !== userInfo?.id)?.userId
        if (otherId) userIds = [otherId]
      }
      if (!userIds.length) return
      const responses = await Promise.all(userIds.map((id) => userService.getUserInfoById(id)))
      setReceivers(responses.map((r) => r.data as UserDto))
    } catch (err) {
      message.error('Error while getting receiver infomation!')
    }
  }

  const getMessages = async (firstTime: boolean) => {
    try {
      const response = await messageService.getMessages(conversationId || '', skipMessages, takeMessages)
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        const dataResponse = response.data as ResponseHasData<MessageDto[]>
        if (firstTime) setMessages([...messages, ...(dataResponse.data as MessageDto[])])
        else setMessages([...(dataResponse.data as MessageDto[]), ...messages])
      }
    } catch (err) {
      message.error('Error while getting user infomation!')
    }
  }

  const handleImagesFileChange = (e: any) => {
    const selectedFiles: File[] = Array.from(e.target.files)
    setImageFiles(selectedFiles)

    const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file))
    setImagesPreview(previewUrls)
  }

  const navigateToInbox = (conversationId: string) => {
    setMessages([])
    setSkipMessages(0)
    setTimeout(() => {
      navigate(`/Inbox/${conversationId}`)
    }, 1000)
  }

  // Cập nhật item trong list conversation khi nhận được tin nhắn mới
  const updateItemInConversations = async (convId: string, newestMessage: MessageDto | null, status: string | null) => {
    try {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== convId) return conv
          const updatedConv = { ...conv }
          if (newestMessage) {
            updatedConv.newestMessage = newestMessage
          } else if (status && updatedConv.newestMessage) {
            updatedConv.newestMessage = {
              ...updatedConv.newestMessage,
              status
            }
          }
          return updatedConv
        })
      )
    } catch (err) {
      return
    }
  }

  // Handle seen
  useEffect(() => {
    if (!newestMessageRef.current) return
    if (document.visibilityState !== 'visible') return

    const textingArea = document.getElementById('scrollableDiv')
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (document.visibilityState !== 'visible') return
        console.log(entry.isIntersecting && isChatFocused)
        if (
          ((entry.isIntersecting && isChatFocused) || (entry.isIntersecting && isInputFocused)) &&
          messages[messages.length - 1].sender.id !== userInfo?.id
        ) {
          const updateMessageStatus = chatService.updateMessageStatus({
            messageId: messages[messages.length - 1].id,
            status: 'Seen'
          })
          if (!updateMessageStatus) return
          setMessageUnseen(messageUnseen - 1)
          updateItemInConversations(conversationId || '', null, 'Seen')
        }
      },
      {
        root: textingArea,
        threshold: 0.8
      }
    )

    observer.observe(newestMessageRef.current)

    return () => observer.disconnect()
  }, [messages, isChatFocused, isInputFocused])

  // Gửi reaction
  const handleSendReaction = async (messageId: string, reaction: string) => {
    try {
      const sendMessageReponse = await messageService.reactionMessage(messageId, reaction)
      if (sendMessageReponse.status === 400) {
        setMessageReactionBar(null)
        const res = sendMessageReponse.data as BaseResponse
        message.error(res.message)
      } else if (sendMessageReponse.status === 200) {
        setMessageReactionBar(null)
        setfullyReactionSelection(null)
        const res = sendMessageReponse.data as ResponseHasData<MessageDto>
        const updatedMessage = res.data as MessageDto
        setMessages((prev) => prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m)))
      }
    } catch (err) {
      message.error('Error while getting user infomation!')
    }
  }

  // Handle nhận
  useEffect(() => {
    chatService.start().then(() => {
      chatService.onReceivePrivateMessage(async (newReceivedMessage) => {
        if (conversationId !== undefined) {
          setMessages([...messages, newReceivedMessage])
          updateItemInConversations(newReceivedMessage.conversationId, newReceivedMessage, null)
        }
        const updateMessageStatus = await chatService.updateMessageStatus({
          messageId: newReceivedMessage.id,
          status: 'Delivered'
        })
        if (!updateMessageStatus) return
      })
    })

    return () => {
      chatService.offReceivePrivateMessage()
    }
  })

  // Lấy dữ liệu user, conversation và cho thẻ chat được focus
  useEffect(() => {
    fetchUserInfo()
    if (conversationId) fetchConversation()
    fetchAllConversations()
    // Kéo xuống tin nhắn dưới cùng
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })

    chatService.getUpdatedMessage((newestMessage: MessageDto) => {
      setMessages((prevMessages) =>
        prevMessages.map((m: MessageDto) => (m.id === newestMessage.id ? newestMessage : m))
      )
    })

    // Update user khi người dùng khác thay đổi trạng thái hoạt động
    chatService.updateUser((user: UserDto) => {
      setReceivers((prevReceivers) => prevReceivers.map((u: UserDto) => (u.id === user.id ? user : u)))
    })

    const textingArea = document.getElementById('scrollableDiv')
    if (!textingArea) return
    textingArea.tabIndex = 0 // Biến div thành focusable

    const handleFocus = () => setIsChatFocused(true)
    const handleBlur = () => setIsChatFocused(false)

    textingArea.addEventListener('focus', handleFocus)
    textingArea.addEventListener('blur', handleBlur)

    return () => {
      textingArea.removeEventListener('focus', handleFocus)
      textingArea.removeEventListener('blur', handleBlur)
    }
  }, [])

  // Xử lý click của reaction bar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const clickedOutsideReactionBar = reactionBarRef.current && !reactionBarRef.current.contains(target)
      const clickedOutsideEmojiPicker = pickerEmotionRef.current && !pickerEmotionRef.current.contains(target)

      if (messageReactionBar && clickedOutsideReactionBar && !fullyReactionSelection) {
        setMessageReactionBar(null)
      }
      if (fullyReactionSelection && clickedOutsideEmojiPicker) {
        setfullyReactionSelection(null)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMessageReactionBar(null)
        setfullyReactionSelection(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [messageReactionBar, fullyReactionSelection])

  // Lấy dữ liệu conversation
  useEffect(() => {
    if (conversationId) {
      fetchConversation()
    }
  }, [conversationId])

  // Lấy thông tin user trong conversation
  useEffect(() => {
    if (conversation && userInfo) {
      fetchConversationUsers()
    }
  }, [conversation])

  // Load thêm message khi kéo lên trên
  useEffect(() => {
    if (userInfo && conversationId) {
      if (skipMessages == 0) getMessages(true)
      else getMessages(false)
    }
  }, [userInfo, conversationId, skipMessages])

  // Lấy thông tin tất cả người nhận
  useEffect(() => {
    fetchReceiversInfo()
  }, [conversation, conversationUsers])

  // Gửi tin nhắn (Không cho gửi liên tục)
  useEffect(() => {
    if (!text) return

    const timeout = setTimeout(() => {
      // Gọi update messageDraft
    }, 2000)

    return () => clearTimeout(timeout)
  }, [text])

  // Xử lý preview voice
  useEffect(() => {
    if (!waveformRef.current) return

    wavesurferRef.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(167, 167, 167, 1)',
      progressColor: 'rgba(89, 89, 89, 1)',
      barWidth: 3,
      barGap: 2,
      barRadius: 2,
      height: 40,
      width: 121
    })

    wavesurferRef.current.load(audioUrl || '')

    wavesurferRef.current.on('play', () => setPreviewVoicePlaying(true))
    wavesurferRef.current.on('pause', () => setPreviewVoicePlaying(false))

    // Khi user click vào waveform → play
    wavesurferRef.current.once('interaction', () => {
      wavesurferRef.current?.play()
    })

    return () => {
      wavesurferRef.current?.destroy()
    }
  }, [audioUrl])

  useEffect(() => {
    let count = 0
    conversations.map((conversation) => {
      if (conversation.newestMessage?.senderId !== userInfo?.id && conversation.newestMessage?.status !== 'Seen')
        count++
    })
    setMessageUnseen(count)
    setUnreadMessages(count)
  }, [conversations])

  useEffect(() => {
    const baseTitle = 'FriCon'
    if (messageUnseen > 0) document.title = `(${messageUnseen}) ${baseTitle}`
    else document.title = baseTitle
  }, [messageUnseen])
  return (
    <div className='h-screen bg-[#212123] overflow-hidden'>
      <div className='flex h-[98%] bg-white rounded-[32px] m-[8px]'>
        <div className='w-[25%] m-[20px]'>
          <FontAwesomeIcon
            onClick={() => setIsModalNewMessageOpen(true)}
            className='float-right mb-2 cursor-pointer'
            icon={faPenToSquare}
          />
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
              placeholder='Search'
              prefix={<SearchOutlined className='text-lg' />}
            />
          </ConfigProvider>
          <div className='mt-4 flex flex-col gap-3'>
            {/* List cuộc trò chuyện */}
            {conversations.length === 0
              ? Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton className='mb-3' key={i} active avatar paragraph={{ rows: 1 }} />
                ))
              : conversations.map((conversation) => {
                  const seenByMe =
                    conversation.newestMessage?.senderId !== userInfo?.id &&
                    conversation.newestMessage?.status !== 'Seen'
                      ? false
                      : true
                  return (
                    <div
                      onClick={() => navigateToInbox(conversation.id)}
                      className={`flex items-center gap-2 cursor-pointer hover:bg-[#cbcdd1a6] ${conversation.id.toLowerCase() === conversationId?.toLowerCase() ? 'bg-[#cbcdd1a6]' : ''} rounded-[20px] py-[10px] px-[20px]`}
                    >
                      <Avatar
                        draggable='false'
                        className='select-none'
                        size={48}
                        src={conversation.conversationUsers[0].user.avatarUrl}
                      ></Avatar>
                      <div className='flex flex-col justify-around overflow-hidden'>
                        <p className={`text-lg font-medium select-none truncate ${seenByMe ? '' : 'font-bold'}`}>
                          {conversation.type === 'Personal'
                            ? conversation.conversationUsers[0].nickName
                            : conversation.conversationName}
                        </p>
                        <span
                          className={`text-xs truncate select-none ${seenByMe ? 'opacity-50' : 'font-bold text-black'}`}
                        >
                          {conversation.newestMessage?.senderId.toLowerCase() === userInfo?.id.toLowerCase() &&
                          (!conversation.newestMessage?.messageAttachments ||
                            conversation.newestMessage.messageAttachments.length === 0)
                            ? 'You: '
                            : ''}
                          {conversation.newestMessage?.content === ''
                            ? conversation.newestMessage.sender.firstName + ' sent attachments'
                            : conversation.newestMessage?.content}
                        </span>
                      </div>
                      {!seenByMe && <div className='text-blue-500 flex-1 text-right text-lg'>●</div>}
                    </div>
                  )
                })}
          </div>
        </div>
        {/* Tìm kiếm User để bắt đầu cuộc trò chuyện */}
        <ModalNewMessage isModalOpen={isModalNewMessageOpen} onClose={() => setIsModalNewMessageOpen(false)} />
        <div className='w-[100%] m-[12px] flex flex-col justify-between'>
          {/* Header */}
          <div className='flex justify-between py-0 px-[16px]'>
            <div className='flex flex-col'>
              {(() => {
                if (conversationUsers.length === 0) {
                  return <Skeleton active paragraph={{ rows: 0 }} />
                } else if (conversationUsers.length !== 0 && conversation?.type === 'Personal') {
                  return (
                    <h3 className='text-xl font-medium'>
                      {conversationUsers.find((u) => u.userId !== userInfo?.id)?.nickName}
                    </h3>
                  )
                } else if (conversationUsers.length !== 0 && conversation?.type === 'Group') {
                  return <h3 className='text-xl font-medium'>{conversation.conversationName}</h3>
                }
              })()}
              {conversationUsers.length !== 0 && conversation?.type === 'Personal' ? (
                <div className='text-xs opacity-50 flex gap-1 items-center'>
                  <span
                    className={`select-none mb-1 cursor-default text-lg ${receivers.find((u) => u.id !== userInfo?.id)?.status === 'Online' ? 'text-green-500' : 'text-gray-400'}`}
                  >
                    ●
                  </span>
                  <p>{receivers.find((u) => u.id !== userInfo?.id)?.status}</p>
                </div>
              ) : (
                <Skeleton active paragraph={{ rows: 0 }} />
              )}
            </div>
            {conversationId && (
              <div className='flex gap-[16px] items-center'>
                <SearchOutlined className='text-lg cursor-pointer' />
                <PhoneOutlined className='text-lg cursor-pointer' />
                <FontAwesomeIcon icon={faEllipsisVertical} className='text-lg cursor-pointer' />
              </div>
            )}
          </div>
          {/* Body */}

          {conversationId && (
            <div id='scrollableDiv' className='h-[100%] overflow-y-auto flex flex-col-reverse'>
              <InfiniteScroll
                dataLength={messages.length}
                next={loadMoreMessage}
                hasMore={true}
                style={{ display: 'flex', flexDirection: 'column-reverse' }}
                inverse={true}
                loader={<div></div>}
                endMessage={<Divider plain>It is all, nothing more 🤐</Divider>}
                scrollableTarget='scrollableDiv'
              >
                <List
                  style={{
                    overflow: 'visible',
                    paddingTop: '550px'
                  }}
                  dataSource={messages}
                  renderItem={(item, index) => {
                    const isMe = item.sender?.id == userInfo?.id
                    const isFirst = index === 18
                    return (
                      <div
                        id={`msg-${item.id}`}
                        ref={isFirst ? firstMessageRef : null}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end mb-[12px] mt-[16px]`}
                        key={item.id}
                      >
                        {!isMe && (
                          <a href='#' className='mr-2'>
                            <Avatar src={item.sender?.avatarUrl}></Avatar>
                          </a>
                        )}

                        <div className={`flex gap-1 ${item.content === '' ? '' : 'flex-col-reverse'} max-w-[70%]`}>
                          <div
                            className={`${item.messageAttachments.length === 0 ? 'flex items-center' : 'flex items-center'}`}
                          >
                            <div className={`flex ${isMe ? 'items-end' : 'items-start'} flex-col gap-1`}>
                              {(() => {
                                if (item.repliedMessage !== null && item.repliedMessage.content !== '') {
                                  return (
                                    <p
                                      className={`${isMe ? 'bg-gray-500 bg-opacity-20 float-right' : 'bg-gray-300 bg-opacity-60 float-left'} inline-block  p-[12px] rounded-[20px] break-all cursor-default self-end text-[#0000007a]`}
                                    >
                                      {item.repliedMessage.content}
                                    </p>
                                  )
                                } else if (
                                  item.repliedMessage !== null &&
                                  item.repliedMessage.content === '' &&
                                  item.repliedMessage.messageAttachments.length > 0 &&
                                  item.repliedMessage.messageAttachments[0].fileType === 'Image'
                                ) {
                                  return item.repliedMessage.messageAttachments.map((img, index) => (
                                    <Image
                                      className='rounded-[28px]'
                                      key={index}
                                      width={150}
                                      height={150}
                                      src={img.fileUrl}
                                      alt={`attachment-${index}`}
                                    />
                                  ))
                                } else if (
                                  item.repliedMessage !== null &&
                                  item.repliedMessage.content === '' &&
                                  item.repliedMessage.messageAttachments.length > 0 &&
                                  item.repliedMessage.messageAttachments[0].fileType !== 'Image'
                                ) {
                                  return (
                                    <p
                                      className={`${isMe ? 'bg-gray-500 bg-opacity-20 float-right' : 'bg-gray-300 bg-opacity-60 float-left'} inline-block  p-[12px] rounded-[20px] break-all cursor-default self-end text-[#0000007a]`}
                                    >
                                      Attachment
                                    </p>
                                  )
                                }
                              })()}
                              {(item.content !== '' || item.messageAttachments.length !== 0) && (
                                <div
                                  className='flex flex-col items-end gap-2 relative'
                                  ref={index === messages.length - 1 ? newestMessageRef : null}
                                >
                                  <ConfigProvider
                                    theme={{
                                      components: {
                                        Tooltip: {
                                          colorBgSpotlight: 'transparent',
                                          colorTextLightSolid: '#8f8f8fff',
                                          boxShadowSecondary: 'none'
                                        }
                                      }
                                    }}
                                  >
                                    <Tooltip
                                      placement={isMe ? 'left' : 'right'}
                                      title={
                                        <div className='flex gap-2'>
                                          <FontAwesomeIcon
                                            onClick={() => {
                                              setMessageReactionBar(item.id)
                                              setfullyReactionSelection(null)
                                            }}
                                            className='cursor-pointer'
                                            icon={faFaceSmile}
                                          />
                                          <FontAwesomeIcon
                                            onClick={() => {
                                              setRepliedMessagePreview(item)
                                              setfullyReactionSelection(null)
                                            }}
                                            className='cursor-pointer'
                                            icon={faReply}
                                          />
                                        </div>
                                      }
                                    >
                                      <div
                                        className={`${item.messageAttachments.length !== 0 && item.content != '' ? 'flex flex-col-reverse gap-2' : ''} relative inline-block rounded-[20px] break-all cursor-default self-end float-left'
                                      }`}
                                      >
                                        {/* Hiện content nếu có */}
                                        {item.content !== '' && (
                                          <p
                                            className={`${isMe ? 'bg-sky-400 float-right' : 'bg-gray-300'} p-[12px] rounded-[20px]`}
                                          >
                                            {item.content}
                                          </p>
                                        )}

                                        {/* Hiện attachment nếu có */}
                                        {item.messageAttachments.length !== 0 && (
                                          <div className='flex gap-2 flex-wrap mt-2'>
                                            {item.messageAttachments.map((att, index) => {
                                              switch (att.fileType) {
                                                case 'Image':
                                                  return (
                                                    <Image
                                                      key={index}
                                                      className='rounded-[28px]'
                                                      width={150}
                                                      height={150}
                                                      src={att.fileUrl}
                                                      alt={`attachment-${index}`}
                                                    />
                                                  )
                                                case 'Voice':
                                                  return (
                                                    <div
                                                      key={index}
                                                      className={`rounded-3xl ${isMe ? 'bg-sky-300' : 'bg-gray-300'}`}
                                                    >
                                                      <VoiceWave url={att.fileUrl} />
                                                    </div>
                                                  )
                                                default:
                                                  return <p key={index}>Error</p>
                                              }
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </Tooltip>

                                    {/* Hiện reaction summary */}
                                    {item.messageReactionUsers.length !== 0 && (
                                      <div
                                        className={`cursor-pointer absolute ${isMe ? 'left-[0]' : 'right-[0]'} ${
                                          index === messages.length - 1 && isMe ? 'bottom-[6px]' : 'bottom-[-12px]'
                                        } flex gap-1 text-sm bg-black py-[2px] px-[8px] rounded-[30px]`}
                                      >
                                        {[...new Set(item.messageReactionUsers.map((u) => u.reaction))]
                                          .slice(0, 4)
                                          .map((emoji) => (
                                            <div key={emoji}>{emoji}</div>
                                          ))}
                                        {item.messageReactionUsers.length > 1 && (
                                          <p className='text-white'>{item.messageReactionUsers.length}</p>
                                        )}
                                      </div>
                                    )}

                                    {/* Hiện list Reaction */}
                                    {messageReactionBar === item.id && (
                                      <div
                                        ref={reactionBarRef}
                                        className={`z-[100] flex gap-2 bg-black text-white rounded-[20px] py-[10px] px-[16px] absolute ${
                                          isMe ? 'left-[-160px]' : 'right-[-160px]'
                                        } top-[-50px]`}
                                      >
                                        {reactions.map((reaction) => (
                                          <div
                                            key={reaction}
                                            onClick={() => handleSendReaction(item.id, reaction)}
                                            className='text-lg cursor-pointer transition-transform duration-150 hover:-translate-y-1 hover:scale-110'
                                          >
                                            {reaction}
                                          </div>
                                        ))}
                                        <div className='text-lg cursor-pointer transition-transform duration-150 hover:-translate-y-1 hover:scale-110'>
                                          <FontAwesomeIcon
                                            onClick={() => {
                                              setfullyReactionSelection(item.id)
                                              setMessageReactionBar(null)
                                            }}
                                            icon={faPlus}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </ConfigProvider>

                                  {/* Emoji Picker */}
                                  {fullyReactionSelection === item.id && (
                                    <div
                                      className={`absolute z-[200] ${
                                        isMe ? 'left-[-300px]' : 'right-[-300px]'
                                      } top-[-437px]`}
                                      ref={pickerEmotionRef}
                                    >
                                      <Picker
                                        previewPosition='none'
                                        data={data}
                                        onEmojiSelect={(emoji: any) => handleSendReaction(item.id, emoji.native)}
                                      />
                                    </div>
                                  )}

                                  {/* Trạng thái gửi tin nhắn */}
                                  {isMe && index === messages.length - 1 && (
                                    <ConfigProvider
                                      theme={{
                                        token: {
                                          colorBgSpotlight: 'transparent',
                                          colorTextLightSolid: '#8f8f8fff',
                                          boxShadowSecondary: 'none'
                                        }
                                      }}
                                    >
                                      {item.status === 'Sent' && (
                                        <Tooltip placement='left' title={item.status}>
                                          <FontAwesomeIcon className='mr-[8px] opacity-[0.4]' icon={faCheck} />
                                        </Tooltip>
                                      )}
                                      {item.status === 'Delivered' && (
                                        <Tooltip placement='left' title={item.status}>
                                          <FontAwesomeIcon className='mr-[8px] opacity-[0.4]' icon={faCheckDouble} />
                                        </Tooltip>
                                      )}
                                      {item.status === 'Seen' && (
                                        <Tooltip placement='left' title={item.status}>
                                          <FontAwesomeIcon className='mr-[8px] opacity-[0.4]' icon={faEye} />
                                        </Tooltip>
                                      )}
                                    </ConfigProvider>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {isMe && (
                          <a href='#' className='ml-2'>
                            <Avatar className='select-none' src={userInfo.avatarUrl}></Avatar>
                          </a>
                        )}
                        <div ref={messageEndRef}></div>
                      </div>
                    )
                  }}
                />
              </InfiniteScroll>
            </div>
          )}
          <div>
            <div className='flex flex-wrap gap-2 mb-[8px]'>
              {imagesPreview.map((image, index) => (
                <Image className='rounded-[20px] select-none' key={index} width={90} height={90} src={image} />
              ))}
              {audioUrl && (
                <div className='p-4 bg-gray-100 rounded-2xl shadow-md w-full max-w-md mx-auto flex items-center gap-3'>
                  {!previewVoicePlaying && (
                    <FontAwesomeIcon className='cursor-pointer' onClick={togglePreviewRecord} icon={faPlay} />
                  )}
                  {previewVoicePlaying && (
                    <FontAwesomeIcon className='cursor-pointer' onClick={togglePreviewRecord} icon={faPause} />
                  )}
                  <div ref={waveformRef}></div>
                </div>
              )}
            </div>
            {repliedMessagePreview !== null && (
              <div className='bg-[#8fd8d2] px-[10px] py-[12px] rounded-[20px] mb-2 overflow-hidden'>
                <div className='flex justify-between'>
                  <p className='text-sm'>Replying to {repliedMessagePreview.sender.firstName}</p>
                  <FontAwesomeIcon
                    className='cursor-pointer'
                    onClick={() => {
                      setRepliedMessagePreview(null)
                    }}
                    icon={faXmark}
                  />
                </div>

                {(() => {
                  if (
                    repliedMessagePreview.content === '' &&
                    repliedMessagePreview.messageAttachments[0].fileType === 'Image'
                  ) {
                    return repliedMessagePreview.messageAttachments.map((img, index) => (
                      <Image
                        className='rounded-[28px]'
                        key={index}
                        width={150}
                        height={150}
                        src={img.fileUrl}
                        alt={`attachment-${index}`}
                      />
                    ))
                  } else if (
                    repliedMessagePreview.content === '' &&
                    repliedMessagePreview.messageAttachments[0].fileType !== 'Image'
                  ) {
                    return <p>Attachment</p>
                  } else {
                    return <span className='ml-2 text-xs text-[#000000ab]'>{repliedMessagePreview.content}</span>
                  }
                })()}
              </div>
            )}
            {conversation !== null ? (
              <Input
                className='p-[12px] rounded-[20px]'
                size='large'
                placeholder='Your message'
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                suffix={
                  <div className='flex gap-2'>
                    {!isRecording && (
                      <FontAwesomeIcon onClick={startRecording} className='cursor-pointer' icon={faMicrophone} />
                    )}
                    {isRecording && <FontAwesomeIcon onClick={stopRecording} icon={faCircleStop} />}
                    <SendOutlined onClick={() => handleSendMessage()} className='cursor-pointer' />
                  </div>
                }
                prefix={
                  <div>
                    <FontAwesomeIcon className='cursor-pointer mr-2' icon={faPaperclip} />
                    <label htmlFor='imageFileInput'>
                      <FontAwesomeIcon className='cursor-pointer' icon={faImage} />
                      <input id='imageFileInput' hidden type='file' multiple onChange={handleImagesFileChange} />
                    </label>
                  </div>
                }
                value={text}
                onChange={(e) => setText(e.target.value)}
                onPressEnter={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Inbox
