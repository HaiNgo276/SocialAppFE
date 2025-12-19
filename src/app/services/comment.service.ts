import { apiClient } from '../environments/axiosClient'
import { ReactionCommentRequest } from '../types/Comment/CommentRequests'
import {
  CreateCommentResponse,
  GetCommentsResponse,
  UpdateCommentResponse,
  DeleteCommentResponse,
  ReactionCommentResponse
} from '../types/Comment/CommentResponses'

export const commentService = {
  async createComment(formData: FormData): Promise<CreateCommentResponse> {
    const { data } = await apiClient.post<CreateCommentResponse>('comment/create', formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async getCommentsByPostId(postId: string, skip: number = 0, take: number = 20): Promise<GetCommentsResponse> {
    const { data } = await apiClient.get<GetCommentsResponse>(`comment/post/${postId}`, {
      params: { skip, take },
      withCredentials: true
    })
    return data
  },

  async updateComment(commentId: string, formData: FormData): Promise<UpdateCommentResponse> {
    const { data } = await apiClient.put<UpdateCommentResponse>(`comment/${commentId}`, formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async deleteComment(commentId: string): Promise<DeleteCommentResponse> {
    const { data } = await apiClient.delete<DeleteCommentResponse>(`comment/${commentId}`, {
      withCredentials: true
    })
    return data
  },

  async reactionComment(request: ReactionCommentRequest): Promise<ReactionCommentResponse> {
    const { data } = await apiClient.post<ReactionCommentResponse>('comment/reaction', request, {
      withCredentials: true
    })
    return data
  }
}