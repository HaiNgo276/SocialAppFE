import { useState } from 'react'
import { ConfigProvider, Input, message, Select, Spin } from 'antd'
import styles from '../Login/Login.module.css'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Controller, useForm } from 'react-hook-form'
import { userService } from '@/app/services/user.service'
import { useNavigate } from 'react-router-dom'
import { RegisterRequest } from '@/app/types/User/Requests/registerReq'

const Register: React.FC = () => {
  const {
    control,
    handleSubmit,
    watch,
    trigger,
    formState: { errors }
  } = useForm<RegisterRequest>()

  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  const onRegisterSubmit = async (data: RegisterRequest) => {
    try {
      setLoading(true)
      const res = await userService.register(data)
      if (res.message) {
        message.success('Đăng kí tài khoản thành công!')
        navigate('/login')
      }
    } catch (err) {
      console.error(err)
      message.error('Đăng kí tài khoản thất bại!')
    } finally {
      setLoading(false)
    }
  }
  const onNext = async () => {
    const valid = await trigger(['firstName', 'lastName', 'email', 'password', 'confirmPassword'])
    if (valid) setStep(2)
  }

  return (
    <div className={`${styles.loginContainer} h-screen bg-center bg-cover flex items-center justify-center`}>
      <div className={`${styles.loginBox} relative flex flex-col backdrop-blur-lg max-md:!px-9 mx-4`}>
        <div className={`${styles.loginHeader} absolute flex items-center justify-center`}>
          <span className='select-none font-sans'>Register</span>
        </div>
        <ConfigProvider
          theme={{
            components: {
              Input: {
                activeBorderColor: 'none',
                hoverBorderColor: '#c48986',
                activeBg: 'transparent',
                hoverBg: 'transparent'
              },
              Select: {
                colorBorder: '#42596895',
                borderRadius: 40,
                hoverBorderColor: '#c48986',
                activeBorderColor: '#c48986',
                selectorBg: 'transparent',
                optionSelectedBg: 'transparent',
                optionSelectedColor: '#c48986'
              }
            }
          }}
        >
          <form id='registerForm' onSubmit={handleSubmit(onRegisterSubmit)} className='flex flex-col gap-4 mt-16'>
            {step === 1 && (
              <>
                <div>
                  <Controller
                    name='firstName'
                    control={control}
                    rules={{ required: 'First name is required' }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        size='large'
                        disabled={loading}
                        placeholder='First Name'
                        className={`${styles.loginInput}`}
                      />
                    )}
                  />
                  {errors.firstName && <p className='text-red-500 text-sm pt-1 pl-5'>{errors.firstName.message}</p>}
                </div>

                <div>
                  <Controller
                    name='lastName'
                    control={control}
                    rules={{ required: 'Last name is required' }}
                    render={({ field }) => (
                      <Input
                        {...field}
                        size='large'
                        disabled={loading}
                        placeholder='Last Name'
                        className={`${styles.loginInput}`}
                      />
                    )}
                  />
                  {errors.lastName && <p className='text-red-500 text-sm pt-1 pl-5'>{errors.lastName.message}</p>}
                </div>

                <div>
                  <Controller
                    name='email'
                    control={control}
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
                        disabled={loading}
                        prefix={<UserOutlined />}
                        className={`${styles.loginInput}`}
                      />
                    )}
                  />
                  {errors.email && <p className='text-red-500 text-sm pt-1 pl-5'>{errors.email.message}</p>}
                </div>

                <div>
                  <Controller
                    name='password'
                    control={control}
                    rules={{
                      required: 'Password is required',
                      validate: (value) => {
                        if (value.length < 8) {
                          return 'Password must be at least 8 characters long'
                        }
                        if (!/[A-Z]/.test(value)) {
                          return 'Password must contain at least one uppercase letter'
                        }
                        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
                          return 'Password must contain at least one special character'
                        }
                        return true
                      }
                    }}
                    render={({ field }) => (
                      <Input.Password
                        {...field}
                        size='large'
                        disabled={loading}
                        placeholder='Password'
                        prefix={<LockOutlined />}
                        className={`${styles.loginInput}`}
                      />
                    )}
                  />
                  {errors.password && <p className='text-red-500 text-sm pt-1 pl-5'>{errors.password.message}</p>}
                </div>

                <div>
                  <Controller
                    name='confirmPassword'
                    control={control}
                    rules={{
                      required: 'Confirm password is required',
                      validate: (value) => value === watch('password') || 'Passwords do not match'
                    }}
                    render={({ field }) => (
                      <Input.Password
                        {...field}
                        size='large'
                        disabled={loading}
                        placeholder='Confirm Password'
                        prefix={<LockOutlined />}
                        className={`${styles.loginInput}`}
                      />
                    )}
                  />
                  {errors.confirmPassword && (
                    <p className='text-red-500 text-sm pt-1 pl-5'>{errors.confirmPassword.message}</p>
                  )}
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div>
                  <Controller
                    name='gender'
                    control={control}
                    rules={{ required: 'Gender is required' }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        size='large'
                        disabled={loading}
                        placeholder='Select Gender'
                        className='w-full'
                        options={[
                          { label: 'Male', value: 'male' },
                          { label: 'Female', value: 'female' },
                          { label: 'Other', value: 'other' }
                        ]}
                      />
                    )}
                  />
                  {errors.gender && <p className='text-red-500 text-sm pt-1'>{errors.gender.message}</p>}
                </div>

                <div>
                  <Controller
                    name='description'
                    control={control}
                    render={({ field }) => (
                      <Input.TextArea
                        {...field}
                        disabled={loading}
                        placeholder='Tell us about yourself (optional)'
                        autoSize={{ minRows: 3, maxRows: 5 }}
                        className='rounded-lg p-2 bg-transparent border-[#42596895]'
                      />
                    )}
                  />
                </div>
              </>
            )}
          </form>
        </ConfigProvider>

        <div className={styles.inputBox}>
          {step === 1 ? (
            <button
              form='registerForm'
              // type='submit'
              className={`${styles.inputSubmit} w-full cursor-pointer font-medium flex justify-center items-center gap-2`}
              disabled={loading}
              onClick={onNext}
            >
              Next →
            </button>
          ) : (
            <div className='justify-between'>
              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className={`${styles.inputSubmit} w-full cursor-pointer font-medium flex justify-center items-center gap-2 mb-3`}
              >
                ← Back
              </button>
              <button
                form='registerForm'
                type='submit'
                className={`${styles.inputSubmit} w-full cursor-pointer font-medium flex justify-center items-center gap-2`}
                disabled={loading}
              >
                {loading ? <Spin size='small' className={styles.spinner} /> : 'Register'}
              </button>
            </div>
          )}
        </div>

        <div className='text-center text-white/65 register'>
          <span>
            Already have an account?{' '}
            <a
              className={`font-medium hover:underline ${loading ? 'pointer-events-none opacity-60' : ''}`}
              href='/login'
            >
              Login
            </a>
          </span>
        </div>
      </div>
    </div>
  )
}

export default Register
