import { UserDto } from '../User/user.dto'
export interface ModalProps {
  isModalOpen: boolean
  update?: boolean
  handleOk?: (data?: any) => void
  handleCancel: (e?: any) => void
  subTitle?: string
  isLoading?: boolean
  title?: string
  onCreatePostSuccess?: () => void
  groupId?: string
  currentUser: UserDto
}

export type FriendStatus = 'online' | 'offline' | 'away'

export interface Friend {
  id: number
  name: string
  avatar: string
  status: FriendStatus
}

export type ActionType = 'unfriend' | 'unfollow' | 'block'
