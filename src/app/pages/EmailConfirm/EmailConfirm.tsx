import { Card, ConfigProvider } from 'antd'
import { useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft,
  faBan,
  faCircleCheck,
  faCircleExclamation,
  faCircleXmark
} from '@fortawesome/free-solid-svg-icons'

const EmailConfirm: React.FC = () => {
  const statusConfig = {
    success: {
      message: 'Confirmation Successful',
      icon: <FontAwesomeIcon icon={faCircleCheck} className='text-green-600 text-[40px]' />
    },
    fail: {
      message: 'Confirmation Failed',
      icon: <FontAwesomeIcon icon={faCircleXmark} className='text-red-600 text-[40px]' />
    },
    invalid: {
      message: 'Invalid Token',
      icon: <FontAwesomeIcon icon={faCircleExclamation} className='text-gray-600 text-[40px]' />
    },
    userNotFound: {
      message: 'User Not Found',
      icon: <FontAwesomeIcon icon={faBan} className='text-gray-600 text-[40px]' />
    }
  }

  const { status } = useParams()

  const { message, icon } = statusConfig[(status as keyof typeof statusConfig) ?? 'fail'] || {
    message: 'Unknown status',
    icon: null
  }
  return (
    <div className="h-screen bg-[url('/src/app/assests/backgrounds/background.jpg')] bg-center bg-cover flex items-center justify-center">
      <ConfigProvider
        theme={{
          components: {
            Card: {
              colorBgContainer: 'transparent'
            }
          }
        }}
      >
        <Card
          className='backdrop-blur-lg w-[600px]'
          title={
            <div className='flex items-center justify-center gap-2'>
              {icon}
              <span>{message}</span>
            </div>
          }
        >
          <div className='flex flex-col items-center justify-center'>
            <a href='/Login' className='text-center w-fit hover:text-inherit'>
              <FontAwesomeIcon icon={faArrowLeft} className='text-[32px]' />
            </a>
            <p className='text-center text-[20px]'>Back To Login Page</p>
          </div>
        </Card>
      </ConfigProvider>
    </div>
  )
}

export default EmailConfirm
