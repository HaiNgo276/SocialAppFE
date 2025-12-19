import { apiClient } from '../environments/axiosClient'
import {
  SearchResponse,
  GetRecentSearchesResponse,
  DeleteSearchHistoryResponse,
  ClearSearchHistoryResponse
} from '../types/Search/SearchResponse'
import { SearchType } from '../types/Search/SearchType'

export const searchService = {
  async search(
    keyword: string,
    type: SearchType = SearchType.All,
    skip: number = 0,
    take: number = 10,
    saveHistory: boolean = false
  ): Promise<SearchResponse> {
    const { data } = await apiClient.get<SearchResponse>('search', {
      params: { keyword, type, skip, take, saveHistory },
      withCredentials: true
    })
    return data
  },

  async saveSearchHistory(content: string, imageUrl?: string, navigateUrl?: string): Promise<void> {
    await apiClient.post(
      'search/save-history',
      {
        content,
        imageUrl,
        navigateUrl
      },
      { withCredentials: true }
    )
  },

  async getRecentSearches(take: number = 10): Promise<GetRecentSearchesResponse> {
    const { data } = await apiClient.get<GetRecentSearchesResponse>('search/recent', {
      params: { take },
      withCredentials: true
    })
    return data
  },

  async deleteSearchHistory(historyId: string): Promise<DeleteSearchHistoryResponse> {
    const { data } = await apiClient.delete<DeleteSearchHistoryResponse>(`search/history/${historyId}`, {
      withCredentials: true
    })
    return data
  },

  async clearAllSearchHistory(): Promise<ClearSearchHistoryResponse> {
    const { data } = await apiClient.delete<ClearSearchHistoryResponse>('search/history/clear', {
      withCredentials: true
    })
    return data
  }
}