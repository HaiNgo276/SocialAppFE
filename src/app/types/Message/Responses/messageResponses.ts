import { MessageDto } from '@/app/types/Message/messge.dto'

export interface SendMessageResponse {
  status: boolean
  message: string
  newMessage: MessageDto
}
