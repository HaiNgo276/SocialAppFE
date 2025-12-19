import { ConfigProvider, Input, message } from 'antd'
import styles from '../Login/Login.module.css'
import { LockOutlined, UserOutlined, MailOutlined } from '@ant-design/icons'
import { Controller, useForm } from 'react-hook-form'
import { useState, useEffect } from 'react'
import { userService } from '@/app/services/user.service'
import { RequestOTPRequest, VerifyOTPRequest } from '@/app/types/User/Requests/otpReq'
import { ResetPasswordRequest } from '@/app/types/User/Requests/passwordReq'

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<'email' | 'otp' | 'reset'>('email')
  const [email, setEmail] = useState<string>('')
  const [otpExpiry, setOtpExpiry] = useState<number>(180)
  const [isResendDisabled, setIsResendDisabled] = useState<boolean>(true)
  const [resetToken, setResetToken] = useState<string>('')

  const {
    control: emailControl,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
    reset: resetEmail
  } = useForm<RequestOTPRequest>()

  const {
    control: otpControl,
    handleSubmit: handleOTPSubmit,
    formState: { errors: otpErrors },
    reset: resetOTP
  } = useForm<VerifyOTPRequest>()

  const {
    control: resetControl,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
    reset: resetReset
  } = useForm<ResetPasswordRequest>()

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (step === 'otp' && otpExpiry > 0) {
      timer = setInterval(() => {
        setOtpExpiry((prev) => {
          if (prev <= 1) {
            setIsResendDisabled(false)
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 800)
    }
    return () => clearInterval(timer)
  }, [step, otpExpiry])

  const onEmailSubmit = async (data: RequestOTPRequest) => {
    try {
      const response = await userService.requestOTP(data)
      if (response.message) {
        setEmail(data.email)
        setStep('otp')
        setOtpExpiry(180)
        setIsResendDisabled(true)
        resetEmail()
        message.success('OTP has been sent to your email!')
      } else {
        message.error('Email does not exist or an error occurred.')
      }
    } catch (error) {
      message.error('An error occurred while sending the OTP..')
    }
  }

  const onResendOTP = async () => {
    try {
      const response = await userService.requestOTP({ email })
      if (response.message) {
        setOtpExpiry(180)
        setIsResendDisabled(true)
        message.success('A new OTP has been sent!')
      } else {
        message.error('An error occurred while resending the OTP.')
      }
    } catch (error) {
      message.error('An error occurred.')
    }
  }

  const onOTPSubmit = async (data: VerifyOTPRequest) => {
    try {
      const response = await userService.verifyOTP({ email, otp: data.otp })
      if (response.message) {
        setResetToken(response.resetPasswordToken)
        setStep('reset')
        resetOTP()
        message.success('OTP verified successfully!')
      } else {
        message.error(response.message || 'OTP is invalid or has expired.')
      }
    } catch (error) {
      message.error('An error occurred while verifying the OTP.')
    }
  }

  const onResetPasswordSubmit = async (data: ResetPasswordRequest) => {
    try {
      const response = await userService.resetPassword({
        email,
        resetPasswordToken: resetToken,
        newPassword: data.newPassword
      })
      if (response.message) {
        message.success('Password reset successfully!')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
        resetReset()
      } else {
        message.error(response.message || 'An error occurred while resetting the password.')
      }
    } catch (error) {
      message.error('An error occurred.')
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <div className={`${styles.loginContainer} h-screen bg-center bg-cover flex items-center justify-center`}>
      <div className={`${styles.loginBox} relative flex flex-col backdrop-blur-lg`}>
        <div className={`${styles.loginHeader} absolute flex items-center justify-center !w-[250px] max-xs:!w-[185px]`}>
          <span className='select-none font-sans whitespace-nowrap'>
            {step === 'email' ? 'Forgot Password' : step === 'otp' ? 'Verify OTP' : 'Reset Password'}
          </span>
        </div>
        <ConfigProvider
          theme={{
            components: {
              Input: {
                activeBorderColor: 'none',
                hoverBorderColor: '#c48986',
                activeBg: 'transparent',
                hoverBg: 'transparent'
              }
            }
          }}
        >
          {step === 'email' && (
            <form
              id='emailForm'
              onSubmit={handleEmailSubmit(onEmailSubmit)}
              className='flex flex-col gap-4 mt-20 max-xs:mt-14'
            >
              <div>
                <Controller
                  name='email'
                  control={emailControl}
                  rules={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Invalid email format'
                    }
                  }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      size='large'
                      placeholder='Email'
                      prefix={<UserOutlined />}
                      className={`${styles.loginInput}`}
                    />
                  )}
                />
                {emailErrors.email && <p className='text-red-500 text-sm pt-1 pl-5'>{emailErrors.email.message}</p>}
              </div>
              <div className={styles.inputBox}>
                <input
                  form='emailForm'
                  type='submit'
                  className={`${styles.inputSubmit} w-full cursor-pointer font-medium`}
                  value='Send OTP'
                />
              </div>
            </form>
          )}

          {step === 'otp' && (
            <form
              id='otpForm'
              onSubmit={handleOTPSubmit(onOTPSubmit)}
              className='flex flex-col gap-4 mt-20 max-xs:mt-14'
            >
              <div>
                <Controller
                  name='otp'
                  control={otpControl}
                  rules={{
                    required: 'OTP is required',
                    minLength: { value: 6, message: 'OTP must be at least 6 characters' }
                  }}
                  render={({ field }) => (
                    <Input
                      {...field}
                      size='large'
                      placeholder='Enter OTP (6 characters)'
                      prefix={<MailOutlined />}
                      className={`${styles.loginInput}`}
                    />
                  )}
                />
                {otpErrors.otp && <p className='text-red-500 text-sm pt-1 pl-5'>{otpErrors.otp.message}</p>}
              </div>
              <div className={styles.inputBox}>
                <input
                  form='otpForm'
                  type='submit'
                  className={`${styles.inputSubmit} w-full cursor-pointer font-medium`}
                  value='Verify OTP'
                />
              </div>
              <div className='text-center'>
                <button
                  type='button'
                  onClick={onResendOTP}
                  disabled={isResendDisabled}
                  className='text-sm text-blue-500 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed'
                >
                  Resend OTP
                </button>
              </div>
              <div className='text-center text-sm text-gray-600'> OTP will expire in: {formatTime(otpExpiry)}</div>
            </form>
          )}

          {step === 'reset' && (
            <form
              id='resetForm'
              onSubmit={handleResetSubmit(onResetPasswordSubmit)}
              className='flex flex-col gap-4 mt-20 max-xs:mt-14'
            >
              <div>
                <Controller
                  name='newPassword'
                  control={resetControl}
                  rules={{
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    validate: {
                      hasUppercase: (value) =>
                        /.*[A-Z].*/.test(value) || 'Password must contain at least one uppercase letter (A-Z)',
                      hasSpecialChar: (value) =>
                        /.*[!@#$%^&*()_+=[\]{};':"\\|,.<>/?-].*/.test(value) ||
                        'Password must contain at least one special character (e.g., !@#$%^&*)'
                    }
                  }}
                  render={({ field }) => (
                    <Input.Password
                      {...field}
                      size='large'
                      placeholder='New Password'
                      prefix={<LockOutlined />}
                      className={`${styles.loginInput}`}
                    />
                  )}
                />
                {resetErrors.newPassword && (
                  <p className='text-red-500 text-sm pt-1 pl-5'>{resetErrors.newPassword.message}</p>
                )}
              </div>
              <div className={styles.inputBox}>
                <input
                  form='resetForm'
                  type='submit'
                  className={`${styles.inputSubmit} w-full cursor-pointer font-medium`}
                  value='Reset Password'
                />
              </div>
            </form>
          )}
        </ConfigProvider>

        <div className='text-center text-white/65 login'>
          <span>
            Back to login page?{' '}
            <a className='font-medium hover:underline' href='/login'>
              Login
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
