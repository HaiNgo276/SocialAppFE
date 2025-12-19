import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar/Navbar'
import NotificationSide from '../Navbar/NotificationSide'
import { useState } from 'react'

const Layout: React.FC = () => {
  const [showNoti, setShowNoti] = useState(false)
  return (
    <div className='flex h-[100%]'>
      <Navbar setShowNoti={setShowNoti} />
      <NotificationSide show={showNoti} />
      <div className='flex-1 h-[100%]'>
        <Outlet />
      </div>
    </div>
  )
}

export default Layout
