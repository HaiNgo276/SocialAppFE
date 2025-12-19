import { ConfigProvider, Input, Modal, message } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { Controller, useForm } from 'react-hook-form'
import { useState } from 'react'
import { userService } from '@/app/services/user.service'
import styles from '../Login/Login.module.css'
import { ChangePasswordRequest } from '@/app/types/User/Requests/passwordReq'

interface ChangePasswordPopupProps {
  visible: boolean
  onClose: () => void
}

const ChangePasswordPopup: React.FC<ChangePasswordPopupProps> = ({ visible, onClose }) => {
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    reset
  } = useForm<ChangePasswordRequest>({
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  })

  const onSubmit = async (data: ChangePasswordRequest) => {
    if (data.newPassword !== data.confirmPassword) {
      message.error('New password and confirmation do not match.')
      return
    }

    setIsLoading(true)
    try {
      const response = await userService.changePassword(data)
      if (response.message) {
        message.success('Password changed successfully!')
        reset()
        onClose()
      } else {
        message.error(response.message || 'Failed to change password.')
      }
    } catch (error) {
      message.error('An error occurred while changing the password.')
    } finally {
      setIsLoading(false)
    }
  };

  return (
    <Modal open={visible} title='Change Password' onCancel={onClose} footer={null} className={styles.modal}>
      <ConfigProvider
        theme={{
          components: {
            Input: {
              activeBorderColor: 'none',
              hoverBorderColor: '#a7b3bb95',
              activeBg: 'transparent',
              hoverBg: 'transparent'
            }
          }
        }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className='gap-[24px] flex flex-col'>
          <div className={styles.inputGroup}>
            <Controller
              name='oldPassword'
              control={control}
              rules={{ required: 'Old password is required' }}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  size='large'
                  placeholder='Old Password'
                  prefix={<LockOutlined />}
                  className={`${styles.loginInput} ${styles.loginPassword}`}
                />
              )}
            />
            {errors.oldPassword && <p className={styles.error}>{errors.oldPassword.message}</p>}
          </div>
          <div className={styles.inputGroup}>
            <Controller
              name='newPassword'
              control={control}
              rules={{
                required: 'New password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                validate: {
                  hasUppercase: (value) =>
                    /.*[A-Z].*/.test(value) || 'Password must contain at least one uppercase letter',
                  hasSpecialChar: (value) =>
                    /.*[!@#$%^&*()_+=[\]{};':"\\|,.<>/?-].*/.test(value) ||
                    'Password must contain at least one special character'
                },
              }}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  size='large'
                  placeholder='New Password'
                  prefix={<LockOutlined />}
                  className={`${styles.loginInput} ${styles.loginPassword}`}
                />
              )}
            />
            {errors.newPassword && <p className={styles.error}>{errors.newPassword.message}</p>}
          </div>
          <div className={styles.inputGroup}>
            <Controller
              name='confirmPassword'
              control={control}
              rules={{
                required: 'Confirm password is required',
                validate: (value) => value === getValues('newPassword') || 'Passwords do not match'
              }}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  size='large'
                  placeholder='Confirm Password'
                  prefix={<LockOutlined />}
                  className={`${styles.loginInput} ${styles.loginPassword}`}
                />
              )}
            />
            {errors.confirmPassword && <p className={styles.error}>{errors.confirmPassword.message}</p>}
          </div>
          <div className={styles.inputBox}>
            <input
              type='submit'
              className={`${styles.inputSubmit} w-full cursor-pointer font-medium`}
              value='Change Password'
              disabled={isLoading}
            />
          </div>
        </form>
      </ConfigProvider>
    </Modal>
  )
}

export default ChangePasswordPopup