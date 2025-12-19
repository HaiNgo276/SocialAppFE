export interface ResetPasswordRequest {
  email: string
  resetPasswordToken: string
  newPassword: string
}

export interface ChangePasswordRequest {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}
