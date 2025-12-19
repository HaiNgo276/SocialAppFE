import { BaseResponse } from '../Base/Responses/baseResponse'
import { UserDto } from '../User/user.dto'

export interface CommentImageDto {
  id: string
  imageUrl: string
}

export interface CommentReactionUserDto {
  userId: string
  reaction: string
  user?: UserDto
  createdAt?: string
  updatedAt?: string
}

export interface CommentDto {
  id: string
  content: string
  postId: string
  userId: string
  repliedCommentId?: string
  createdAt: string
  updatedAt: string
  user?: UserDto
  commentImages?: CommentImageDto[]
  replies?: CommentDto[]
  commentReactionUsers?: CommentReactionUserDto[]
}

export interface CreateCommentResponse extends BaseResponse {
  commentId?: string
}

export interface GetCommentsResponse extends BaseResponse {
  comments?: CommentDto[]
  totalCount?: number
}

export interface UpdateCommentResponse extends BaseResponse {
  comment?: CommentDto
}

export interface DeleteCommentResponse extends BaseResponse {
  success?: boolean
}

export interface ReactionCommentResponse extends BaseResponse {
  comment?: CommentDto
}