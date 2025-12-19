import { GroupDto, GroupUserDto } from './group.dto'

export interface CreateGroupResponse {
  groupId?: string
  message: string
}

export interface GetAllGroupsResponse {
  message: string
  groups: GroupDto[]
  totalCount: number
}

export interface GetGroupByIdResponse {
  message: string
  group?: GroupDto
}

export interface UpdateGroupResponse {
  message: string
  group?: GroupDto
}

export interface DeleteGroupResponse {
  message: string
}

export interface JoinGroupResponse {
  message: string
}

export interface ApproveJoinRequestResponse {
  message: string
  groupUser?: GroupUserDto
}

export interface RejectJoinRequestResponse {
  message: string
}

export interface CancelJoinRequestResponse {
  message: string
}

export interface GetPendingJoinRequestsResponse {
  message: string
  pendingRequests: GroupUserDto[]
  totalCount: number
}

export interface LeaveGroupResponse {
  message: string
}
export interface PromoteToAdminResponse {
  message: string
  groupUser?: GroupUserDto
}

export interface DemoteAdminResponse {
  message: string
  groupUser?: GroupUserDto
}

export interface KickMemberResponse {
  message: string
  success: boolean
}

