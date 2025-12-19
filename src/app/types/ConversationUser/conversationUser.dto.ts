import { UserDto } from '../User/user.dto'

export interface ConversationUserDto {
  userId: string
  conversationId: string
  joinedAt: Date
  nickName: string
  roleName: string
  draftMessage: string
  user: UserDto
}
