export interface CreateCommentRequest {
  postId: string
  content: string
  repliedCommentId?: string
  images?: File[]
}

export interface UpdateCommentRequest {
  content?: string
  removeAllImages?: boolean
  imageIdsToDelete?: string[]
  newImages?: File[]
}

export interface ReactionCommentRequest {
  commentId: string
  reaction: string
}