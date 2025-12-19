export interface NotificationDto {
  id: string
  content: string
  imageUrls: string[]
  navigateUrl: string | null
  unread: boolean
  createdAt: Date
  updatedAt: Date
  highlights: HighlightOffset[]
}

export interface HighlightOffset {
  offset: number
  length: number
}
