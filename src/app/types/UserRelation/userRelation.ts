import { UserDto } from '../User/user.dto'

export enum FriendRequestStatus {
  Pending = 'Pending',
  Accepted = 'Accepted',
  Rejected = 'Rejected'
}
export interface SentFriendRequestData {
  senderId: string
  receiverId: string
  message?: string
  sender?: string
  receiver: UserDto
}

export interface RelationData {
  message: string
  data: {
    data: UserDto[]
    pageNumber: number
    pageSize: number
    totalRecords: number
    totalPages: number
  }
}
