import { UserDto } from '../User/user.dto'

export interface SentFriendRequestData {
  senderId: string
  receiverId: string
  message?: string
  sender?: UserDto
  receiver: UserDto
  createdAt: Date
}
