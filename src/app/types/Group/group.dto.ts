import { PostData } from '../Post/Post'
import { UserDto } from '../User/user.dto'

export enum GroupRole {
  User = 'User',
  Administrator = 'Administrator',
  SuperAdministrator = 'SuperAdministrator',
  Pending = 'Pending'

}

export interface GroupDto {
  id: string
  name: string
  description: string
  isPublic: boolean
  memberCount: number
  postCount: number
  imageUrl: string
  createdBy?: string
  groupUsers?: GroupUserDto[]
  posts?: PostData[]
}

export interface GroupUserDto {
  userId: string
  groupId: string
  roleName: string
  joinedAt: string
  user?: UserDto
}
