import { BaseResponse } from '../../Base/Responses/baseResponse'

export interface VerifyOTPResponse extends BaseResponse {
  resetPasswordToken: string
}
