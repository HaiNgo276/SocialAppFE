export interface RequestOTPRequest {
  email: string
}

export interface VerifyOTPRequest {
  email: string
  otp: string
}
