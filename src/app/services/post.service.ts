import { apiClient } from '../environments/axiosClient'
import { BaseResponse } from '../types/Base/Responses/baseResponse'
import {
  GetAllPostsResponse,
  GetPostByIdResponse,
  UpdatePostResponse,
  DeletePostResponse,
  PostReactionResponse,
  GetNewsFeedResponse,
  SeenPost
} from '../types/Post/Post'

export const postService = {
  async createPost(formData: FormData): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('post/create', formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async getAllPosts(skip: number = 0, take: number = 10): Promise<GetNewsFeedResponse> {
    const { data } = await apiClient.get('post/getNewsFeed', {
      params: { skip, take },
      withCredentials: true
    })
    return data
  },

  async getPostsByUser(
    userId: string,
    skip: number = 0,
    take: number = 10
  ): Promise<{ data: GetAllPostsResponse; status: number }> {
    const res = await apiClient.get(`post/user/${userId}`, {
      params: { skip, take },
      withCredentials: true
    })
    return {
      data: res.data,
      status: res.status
    }
  },
  async getPostById(postId: string): Promise<GetPostByIdResponse> {
    const { data } = await apiClient.get<GetPostByIdResponse>(`post/${postId}`, {
      withCredentials: true
    })
    return data
  },

  async updatePost(postId: string, formData: FormData): Promise<UpdatePostResponse> {
    const { data } = await apiClient.put<UpdatePostResponse>(`post/${postId}`, formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async deletePost(postId: string): Promise<DeletePostResponse> {
    const { data } = await apiClient.delete<DeletePostResponse>(`post/${postId}`, {
      withCredentials: true
    })
    return data
  },

  async reactionPost(postId: string, reaction: string): Promise<PostReactionResponse> {
    const { data } = await apiClient.post<PostReactionResponse>(
      'post/reaction',
      {
        postId,
        reaction
      },
      {
        withCredentials: true
      }
    )
    return data
  },

  async seenPost(postsInfo: SeenPost[]): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('post/seen', postsInfo, {
      withCredentials: true
    })
    return data
  }
}
