import { MessageAttachment } from '../MessageAttachment/messageAttachment.dto'
import { MessageReactionUser } from '../MessageReactionUser/messageReactionUser.dto'
import { UserDto } from '../User/user.dto'

export interface MessageDto {
  id: string
  content: string
  status: string
  createdAt: Date
  updatedAt: Date
  senderId: string
  sender: UserDto
  conversationId: string
  repliedMessageId: string | null
  repliedMessage: MessageDto | null
  messageReactionUsers: MessageReactionUser[]
  messageAttachments: MessageAttachment[]
}
