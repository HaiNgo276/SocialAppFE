import React, { useState } from 'react'
import { Button, Input, Select, Form, Card, message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { UserDto } from '@/app/types/User/user.dto'
import { userService } from '@/app/services/user.service'

interface ProfileEditProps {
  refreshData: () => void
  userInfo: UserDto
  onBack?: () => void
}

const { TextArea } = Input
const { Option } = Select

const ProfileEdit: React.FC<ProfileEditProps> = ({ refreshData, userInfo, onBack }) => {
  const [form] = Form.useForm()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const data = form.getFieldsValue()
      const response = await userService.updateInfo(data)

      if (response.status === 200) {
        message.success('Profile updated successfully!')
        refreshData()
        if (onBack) onBack()
      } else {
        message.error('Error updating profile')
      }
    } catch (error) {
      console.error(error)
      message.error('Error updating profile')
    } finally {
      setIsLoading(false)
    }
  }

  const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo)
    message.error('Please correct the errors in the form.')
  }

  return (
    <div className='space-y-4 max-w-3xl mx-auto py-4 rounded-lg'>
      {onBack && (
        <Button type='text' icon={<ArrowLeftOutlined />} onClick={onBack} className='text-gray-600 hover:text-gray-900'>
          Back
        </Button>
      )}

      <Card title='Edit Profile' className='shadow-md border-gray-200'>
        <Form
          form={form}
          layout='vertical'
          onFinish={handleSubmit}
          onFinishFailed={onFinishFailed}
          initialValues={{
            firstName: userInfo.firstName,
            lastName: userInfo.lastName,
            email: userInfo.email,
            userName: userInfo.userName,
            gender: userInfo.gender,
            description: userInfo.description
          }}
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Form.Item
              label='First Name'
              required
              name='firstName'
              rules={[{ required: true, message: 'Please input your first name!' }]}
            >
              <Input placeholder='Enter your first name' />
            </Form.Item>

            <Form.Item
              label='Last Name'
              required
              name='lastName'
              rules={[{ required: true, message: 'Please input your last name!' }]}
            >
              <Input placeholder='Enter your last name' />
            </Form.Item>
          </div>

          <Form.Item
            label='Email'
            required
            name='email'
            rules={[
              {
                type: 'email',
                message: 'Invalid email format!'
              },
              {
                required: true,
                message: 'Please input your email address!'
              }
            ]}
          >
            <Input type='email' disabled placeholder='Enter your email address' />
          </Form.Item>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Form.Item
              label='User Name'
              required
              name='userName'
              rules={[{ required: true, message: 'Please input your user name!' }]}
            >
              <Input placeholder='Enter your user name' />
            </Form.Item>

            <Form.Item label='Gender' name='gender'>
              <Select placeholder='Select your gender' allowClear>
                <Option value='male'>Male</Option>
                <Option value='female'>Female</Option>
                <Option value='other'>Other</Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item label='Bio' name='description'>
            <TextArea placeholder='Tell us about yourself' rows={5} />
          </Form.Item>

          <div className='flex justify-end gap-2 mt-4'>
            <Button type='primary' htmlType='submit' loading={isLoading}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  )
}

export default ProfileEdit
