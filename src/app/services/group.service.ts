import { apiClient } from '../environments/axiosClient'
import {
  DeleteGroupResponse,
  GetAllGroupsResponse,
  GetGroupByIdResponse,
  JoinGroupResponse,
  LeaveGroupResponse,
  UpdateGroupResponse,
  CreateGroupResponse,
  PromoteToAdminResponse,
  DemoteAdminResponse,
  KickMemberResponse,
  ApproveJoinRequestResponse,
  RejectJoinRequestResponse,
  CancelJoinRequestResponse,
  GetPendingJoinRequestsResponse
} from '../types/Group/GroupResponse'
import { CreateGroupRequest, UpdateGroupRequest } from '../types/Group/GroupRequest'

export const groupService = {
  async createGroup(request: CreateGroupRequest): Promise<CreateGroupResponse> {
    const formData = new FormData()
    formData.append('Name', request.name)
    formData.append('Description', request.description)
    formData.append('IsPublic', String(request.isPublic))

    if (request.image) {
      formData.append('Image', request.image)
    }

    const { data } = await apiClient.post<CreateGroupResponse>('group/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      withCredentials: true
    })
    return data
  },

  async getAllGroups(skip: number = 0, take: number = 10): Promise<GetAllGroupsResponse> {
    const { data } = await apiClient.get<GetAllGroupsResponse>('group/all', {
      params: { skip, take },
      withCredentials: true
    })
    return data
  },

  async getGroupById(groupId: string): Promise<GetGroupByIdResponse> {
    const { data } = await apiClient.get<GetGroupByIdResponse>(`group/${groupId}`, {
      withCredentials: true
    })
    return data
  },

  async updateGroup(groupId: string, request: UpdateGroupRequest): Promise<UpdateGroupResponse> {
    const formData = new FormData()
    if (request.name) {
      formData.append('Name', request.name)
    }
    if (request.description) {
      formData.append('Description', request.description)
    }
    if (request.isPublic !== undefined) {
      formData.append('IsPublic', String(request.isPublic))
    }
    if (request.newImage) {
      formData.append('NewImage', request.newImage)
    }
    if (request.removeImage !== undefined) {
      formData.append('RemoveImage', String(request.removeImage))
    }

    const { data } = await apiClient.put<UpdateGroupResponse>(`group/${groupId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      withCredentials: true
    })
    return data
  },

  async deleteGroup(groupId: string): Promise<DeleteGroupResponse> {
    const { data } = await apiClient.delete<DeleteGroupResponse>(`group/${groupId}`, {
      withCredentials: true
    })
    return data
  },

  async joinGroup(groupId: string): Promise<JoinGroupResponse> {
    const { data } = await apiClient.post<JoinGroupResponse>(
      `group/${groupId}/join`,
      {},
      {
        withCredentials: true
      }
    )
    return data
  },

  async leaveGroup(groupId: string): Promise<LeaveGroupResponse> {
    const { data } = await apiClient.post<LeaveGroupResponse>(
      `group/${groupId}/leave`,
      {},
      {
        withCredentials: true
      }
    )
    return data
  },

  async getMyGroups(skip: number = 0, take: number = 10): Promise<GetAllGroupsResponse> {
    const { data } = await apiClient.get<GetAllGroupsResponse>('group/my-groups', {
      params: { skip, take },
      withCredentials: true
    })
    return data
  },

  async promoteToAdmin(groupId: string, targetUserId: string): Promise<PromoteToAdminResponse> {
    const { data } = await apiClient.post<PromoteToAdminResponse>(
      `group/${groupId}/promote-admin`,
      { targetUserId },
      { withCredentials: true }
    )
    return data
  },

  async demoteAdmin(groupId: string, targetUserId: string): Promise<DemoteAdminResponse> {
    const { data } = await apiClient.post<DemoteAdminResponse>(
      `group/${groupId}/demote-admin`,
      { targetUserId },
      { withCredentials: true }
    )
    return data
  },

  async kickMember(groupId: string, targetUserId: string): Promise<KickMemberResponse> {
    const { data } = await apiClient.post<KickMemberResponse>(
      `group/${groupId}/kick-member`,
      { targetUserId },
      { withCredentials: true }
    )
    return data
  },

  async getPendingJoinRequests(
    groupId: string,
    skip: number = 0,
    take: number = 10
  ): Promise<GetPendingJoinRequestsResponse> {
    const { data } = await apiClient.get<GetPendingJoinRequestsResponse>(`group/${groupId}/pending-join-requests`, {
      params: { skip, take },
      withCredentials: true
    })
    return data
  },

  async approveJoinRequest(groupId: string, targetUserId: string): Promise<ApproveJoinRequestResponse> {
    const { data } = await apiClient.post<ApproveJoinRequestResponse>(
      `group/${groupId}/approve-join-request`,
      { targetUserId },
      { withCredentials: true }
    )
    return data
  },

  async rejectJoinRequest(groupId: string, targetUserId: string): Promise<RejectJoinRequestResponse> {
    const { data } = await apiClient.post<RejectJoinRequestResponse>(
      `group/${groupId}/reject-join-request`,
      { targetUserId },
      { withCredentials: true }
    )
    return data
  },

  async cancelJoinRequest(groupId: string): Promise<CancelJoinRequestResponse> {
    const { data } = await apiClient.post<CancelJoinRequestResponse>(
      `group/${groupId}/cancel-join-request`,
      {},
      { withCredentials: true }
    )
    return data
  }
}