import { apiClient } from '../environments/axiosClient'
import { BaseResponse } from '../types/Base/Responses/baseResponse'
import { ResponseHasData } from '../types/Base/Responses/ResponseHasData'
import { MessageDto } from '../types/Message/messge.dto'

export const messageService = {
  async getMessages(
    conversationId: string,
    skip: number,
    take: number
  ): Promise<{ data: BaseResponse | MessageDto[]; status: number }> {
    const response = await apiClient.post<BaseResponse | ResponseHasData<MessageDto[]>>(
      'message/getMessages',
      {
        conversationId,
        skip,
        take
      },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async sendMessage(request: FormData): Promise<{ data: BaseResponse | ResponseHasData<MessageDto>; status: number }> {
    const isFormData = request instanceof FormData
    const response = await apiClient.post<BaseResponse | ResponseHasData<MessageDto>>('message/sendMessage', request, {
      withCredentials: true,
      headers: isFormData ? { 'Content-Type': 'multiple/form-data' } : undefined
    })
    return { data: response.data, status: response.status }
  },

  async reactionMessage(
    messageId: string,
    reaction: string
  ): Promise<{ data: BaseResponse | ResponseHasData<MessageDto>; status: number }> {
    const response = await apiClient.post<BaseResponse | ResponseHasData<MessageDto>>(
      'message/reaction',
      {
        messageId,
        reaction
      },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },
  async getUnreadMessagesNumber(): Promise<{ data: ResponseHasData<number>; status: number }> {
    const response = await apiClient.get<ResponseHasData<number>>('message/getUnreadMessages', {
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  }
}
