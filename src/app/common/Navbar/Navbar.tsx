import { userService } from '@/app/services/user.service'
import { BaseResponse } from '@/app/types/Base/Responses/baseResponse'
import { UserDto } from '@/app/types/User/user.dto'
import { faBell, faComment, faHouse, faUsers, faBars, faUserFriends, faSearch } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { Avatar, Badge, ConfigProvider, Menu, MenuProps, message, Dropdown } from 'antd'
import { SettingOutlined, LogoutOutlined } from '@ant-design/icons'
import Sider from 'antd/es/layout/Sider'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useUnread } from '../Contexts/UnreadContext'
import { NavbarProps } from '../Interfaces/NavbarProps'
import SearchComponent from '@/app/components/Search/SearchComponent'

type MenuItem = Required<MenuProps>['items'][number]

function getItem(label: React.ReactNode, key: React.Key, icon?: React.ReactNode, children?: MenuItem[]) {
  return {
    key,
    icon,
    children,
    label
  } as MenuItem
}
const Navbar: React.FC<NavbarProps> = ({ setShowNoti }) => {
  const navigate = useNavigate()
  const { unreadMessages, unreadNotis } = useUnread()
  const [showSearch, setShowSearch] = useState(false)

  const [items, setItems] = useState<MenuItem[]>([])
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const baseItems = useMemo<MenuItem[]>(
    () => [
      getItem(
        'Home',
        'Home',
        <div className='flex items-center gap-6'>
          <FontAwesomeIcon className='text-lg text-white' icon={faHouse} />
        </div>
      ),
      getItem(
        'Search',
        'Search',
        <div className='flex items-center gap-6'>
          <FontAwesomeIcon className='text-lg text-white' icon={faSearch} /> {/* Cần import faSearch */}
        </div>
      ),
      getItem(
        'Friend',
        'Friend',
        <div className='flex items-center gap-6'>
          <FontAwesomeIcon className='text-lg text-white' icon={faUserFriends} />
        </div>
      ),
      getItem(
        'Groups',
        'Groups',
        <div className='flex items-center gap-6'>
          <FontAwesomeIcon className='text-lg text-white' icon={faUsers} />
        </div>
      ),
      getItem(
        'Inbox',
        'Inbox',
        <div className='flex items-center gap-6'>
          <Badge count={unreadMessages} size='small'>
            <FontAwesomeIcon className='text-lg text-white' icon={faComment} />
          </Badge>
        </div>
      ),
      getItem(
        'Notification',
        'Notification',
        <div className='flex items-center gap-6'>
          <Badge count={unreadNotis} size='small'>
            <FontAwesomeIcon className='text-lg text-white' icon={faBell} />
          </Badge>
        </div>
      )
    ],
    [unreadMessages, unreadNotis]
  )

  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const path = location.pathname.split('/')[1] || 'Home'

  const handleNavigate = (e: any) => {
    if (e.key === 'Inbox') window.location.href = '/Inbox'
    else if (e.key === 'Notification') {
      setShowNoti((prev) => !prev)
      setCollapsed(!collapsed)
    } else if (e.key === 'Search') {
      setShowSearch((prev) => !prev)
      setCollapsed(!collapsed)
    } else if (e.key === 'profile') {
      navigate('/profile')
    } else if (e.key === 'more') {
      return
    } else navigate(`/${e.key}`)
  }

  const handleCollapseNavbar = () => {
    setCollapsed(true)
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      const response = await userService.logout()
      if (response.status === 200) {
        message.success('Logout successful!')
        setTimeout(() => {
          window.location.href = '/login'
        }, 500)
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || 'Logout failed!')
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleSettings = () => {
    navigate('/settings')
  }

  // Dropdown menu items
  const moreMenuItems: MenuProps['items'] = [
    {
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
      onClick: handleSettings
    },
    {
      type: 'divider'
    },
    {
      key: 'logout',
      label: isLoggingOut ? 'Logging out...' : 'Logout',
      icon: <LogoutOutlined />,
      onClick: handleLogout,
      disabled: isLoggingOut
    }
  ]

  const fetchUserInfo = async () => {
    try {
      const response = await userService.getUserInfoByToken()
      if (response.status === 400) {
        const base = response.data as BaseResponse
        message.error(base.message)
      } else if (response.status === 200) {
        const resData = response.data as UserDto
        setItems((prev) => {
          if (prev.some((i) => i?.key === 'profile')) return prev
          return [...prev, getItem('Profile', 'profile', <Avatar src={resData.avatarUrl} size='small' />)]
        })
      }
    } catch (err) {
      message.error('Error while getting user infomation!')
    }
  }

  useEffect(() => {
    setItems((prev) => {
      const profileItem = prev.find((i) => i?.key === 'profile')
      return profileItem ? [...baseItems, profileItem] : baseItems
    })
    fetchUserInfo()
  }, [baseItems])
  return (
    <ConfigProvider
      theme={{
        components: {
          Layout: {
            siderBg: '#212123',
            triggerBg: '#212123'
          }
        }
      }}
    >
      <Sider
        className='h-screen top-[0] bottom-[0] pt-[12px]'
        style={{ position: 'sticky' }}
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <ConfigProvider
          theme={{
            components: {
              Menu: {
                darkItemBg: '#212123',
                darkItemSelectedBg: '#474747'
              }
            }
          }}
        >
          <Menu theme='dark' selectedKeys={[path]} mode='inline' items={items} onClick={handleNavigate} />
          <div className='absolute bottom-[60px] left-0 right-0 px-3'>
            <Dropdown menu={{ items: moreMenuItems }} trigger={['click']} overlayStyle={{ minWidth: '175px' }}>
              <div className='flex items-center py-3 px-4 cursor-pointer text-[#FFFFFFA6] rounded-lg transition-colors hover:text-white'>
                <FontAwesomeIcon className='text-lg text-white' icon={faBars} />
                {!collapsed && <span className='ml-3'>View more</span>}
              </div>
            </Dropdown>
          </div>
        </ConfigProvider>
      </Sider>
      <SearchComponent show={showSearch} onClose={() => setShowSearch(false)} onCollapseNavbar={handleCollapseNavbar} />
    </ConfigProvider>
  )
}

export default Navbar
