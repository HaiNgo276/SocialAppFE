import { apiClient } from '../environments/axiosClient'
import { BaseResponse } from '../types/Base/Responses/baseResponse'
import { ResponseHasData } from '../types/Base/Responses/ResponseHasData'
import { ConversationUserDto } from '../types/ConversationUser/conversationUser.dto'
import { GetConversationUserRequest } from '../types/ConversationUser/Requests/getConversationUserReq'

export const conversationUserService = {
  async getConversationUser(
    request: GetConversationUserRequest
  ): Promise<{ data: BaseResponse | ConversationUserDto[]; status: number }> {
    const response = await apiClient.post<BaseResponse | ResponseHasData<ConversationUserDto[]>>(
      'conversation/user/getConversationUser',
      request,
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  }
}
