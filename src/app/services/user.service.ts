import { apiClient } from '../environments/axiosClient'
import { BaseResponse } from '../types/Base/Responses/baseResponse'
import { ResponseHasData } from '../types/Base/Responses/ResponseHasData'
import { VerifyOTPResponse } from '../types/OTP/Responses/otpResponse'
import { GoogleLoginRequest } from '../types/User/Requests/googleLoginReq'
import { LoginRequest } from '../types/User/Requests/loginReq'
import { RequestOTPRequest, VerifyOTPRequest } from '../types/User/Requests/otpReq'
import { ChangePasswordRequest, ResetPasswordRequest } from '../types/User/Requests/passwordReq'
import { RegisterRequest } from '../types/User/Requests/registerReq'
import { UpdateProfileRequest } from '../types/User/Requests/updateProfileReq'
import { UserDto } from '../types/User/user.dto'

export const userService = {
  async login(loginRequest: LoginRequest): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('user/login', loginRequest, {
      withCredentials: true
    })
    return data
  },

  async logout(): Promise<{ data: BaseResponse; status: number }> {
    const response = await apiClient.post<BaseResponse>(
      'user/logout',
      {},
      {
        withCredentials: true
      }
    )
    return { data: response.data, status: response.status }
  },

  async requestOTP(requestOTPRequest: RequestOTPRequest): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('user/forgetPassword/getOTP', null, {
      params: { email: requestOTPRequest.email }
    })
    return data
  },

  async verifyOTP(verifyOTPRequest: VerifyOTPRequest): Promise<VerifyOTPResponse> {
    const { data: response } = await apiClient.post<VerifyOTPResponse>(
      'user/forgetPassword/validateOTP',
      verifyOTPRequest
    )
    return response
  },

  async resetPassword(resetPasswordRequest: ResetPasswordRequest): Promise<BaseResponse> {
    const { data: response } = await apiClient.post<BaseResponse>(
      'user/forgetPassword/resetPassword',
      resetPasswordRequest
    )
    return response
  },

  async changePassword(changePasswordRequest: ChangePasswordRequest): Promise<BaseResponse> {
    const { data: response } = await apiClient.post<BaseResponse>('user/changePassword', changePasswordRequest, {
      withCredentials: true
    })
    return response
  },

  async register(registerRequest: RegisterRequest): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('user/register', registerRequest)
    return data
  },

  async googleLogin(request: GoogleLoginRequest): Promise<BaseResponse> {
    const { data } = await apiClient.post<BaseResponse>('user/googleLogin', request, {
      withCredentials: true
    })
    return data
  },

  async getUserInfoByToken(): Promise<{ data: BaseResponse | UserDto; status: number }> {
    const response = await apiClient.get<BaseResponse | UserDto>('user/getUserInfo', {
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async getUserInfoByUserName(userName: string): Promise<{ data: BaseResponse | UserDto; status: number }> {
    const response = await apiClient.get<BaseResponse | UserDto>(`user/getUserInfoByUserName?userName=${userName}`, {
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async getUserInfoById(userId: string): Promise<{ data: BaseResponse | UserDto; status: number }> {
    const response = await apiClient.get<BaseResponse | UserDto>(`user/getUserInfoById?userId=${userId}`, {
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async searchUsers(keyword: string): Promise<{ data: BaseResponse | ResponseHasData<UserDto[]>; status: number }> {
    const response = await apiClient.get<BaseResponse | ResponseHasData<UserDto[]>>(`user/search?keyword=${keyword}`, {
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  },

  async changeAvatar(formData: FormData): Promise<any> {
    const response = await apiClient.put<any>('user/changeAvatar', formData, {
      withCredentials: true,
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return { data: response.data, status: response.status }
  },

  async updateInfo(body: UpdateProfileRequest): Promise<{ data: any; status: number }> {
    const response = await apiClient.put<any>('user/updateInfo', body, {
      withCredentials: true
    })
    return { data: response.data, status: response.status }
  }
}
