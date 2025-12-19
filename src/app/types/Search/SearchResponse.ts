import { SearchResultDto, SearchHistoryDto } from './SearchType'

export interface SearchResponse {
  message: string
  results?: SearchResultDto
}

export interface GetRecentSearchesResponse {
  message: string
  data: SearchHistoryDto[]
}

export interface DeleteSearchHistoryResponse {
  message: string
}

export interface ClearSearchHistoryResponse {
  message: string
}