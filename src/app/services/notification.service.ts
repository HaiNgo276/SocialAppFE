import { apiClient } from '../environments/axiosClient'
import { BaseResponse } from '../types/Base/Responses/baseResponse'
import { ResponseHasData } from '../types/Base/Responses/ResponseHasData'
import { NotificationDto } from '../types/Notification/notification.dto'

export const notificationService = {
  async getNotis(
    skip: number,
    take: number
  ): Promise<{ data: BaseResponse | ResponseHasData<NotificationDto[]>; status: number }> {
    const response = await apiClient.get<BaseResponse | ResponseHasData<NotificationDto[]>>(
      `notification/getNotis?skip=${skip}&take=${take}`,
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async getUnreadNotifications(): Promise<{ data: BaseResponse | ResponseHasData<number>; status: number }> {
    const response = await apiClient.get<BaseResponse | ResponseHasData<number>>(`notification/getUnreadNotis`, {
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async markNotiAsRead(notificationId: string): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(
      `notification/markNotiAsRead`,
      { notificationId },
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async markAllNotisAsRead(): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(`notification/markAllNotisAsRead`, {
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  }
}
