import { ConversationUserDto } from '../ConversationUser/conversationUser.dto'
import { MessageDto } from '../Message/messge.dto'

export interface ConversationDto {
  id: string
  type: string
  createdAt: Date
  conversationName: string | null
  conversationUsers: ConversationUserDto[]
  newestMessage: MessageDto | null
}
