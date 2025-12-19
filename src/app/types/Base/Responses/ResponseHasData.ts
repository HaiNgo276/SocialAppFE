import { BaseResponse } from './baseResponse'

export interface ResponseHasData<T> extends BaseResponse {
  data: T | T[]
}
