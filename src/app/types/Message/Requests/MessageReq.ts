export interface SendMessageRequest {
  senderId: string
  conversationId: string
  content: string | null
  files: File[] | null
}
