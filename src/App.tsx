import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useEffect } from 'react'
import Login from './app/pages/Login/Login'
import Register from './app/pages/Register/Register'
import EmailConfirm from './app/pages/EmailConfirm/EmailConfirm'
import ForgotPassword from './app/pages/ForgotPassword/ForgotPassword'
import Layout from './app/common/Layout/Layout'
import Home from './app/pages/Home/Home'
import ProfileUser from './app/pages/Profile/ProfileUser'
import Inbox from './app/pages/Inbox/Inbox'
import { chatService } from './app/services/chat.service'
import { useUserStore } from './app/stores/auth'
import PostDetail from './app/pages/Post/PostDetail'
import FriendsList from './app/pages/Friend/Friend'

import Groups from './app/pages/Group/Groups'
import GroupsFeed from './app/pages/Group/GroupsFeed'
import GroupsDiscover from './app/pages/Group/GroupsDiscover'
import MyGroupsPage from './app/pages/Group/MyGroupsPage'
import GroupDetail from './app/pages/Group/GroupDetail'
import SearchPage from './app/pages/Search/SearchPage'

const PrivateRoute = () => {
  const { isLoggedIn, isChecked } = useUserStore()
  if (!isChecked) return null
  return isLoggedIn ? <Outlet /> : <Navigate to='/login' replace />
}

const PublicRoute = () => {
  const { isLoggedIn, isChecked } = useUserStore()
  if (!isChecked) return null
  return !isLoggedIn ? <Outlet /> : <Navigate to='/home' replace />
}

function App() {
  const { isLoggedIn, user } = useUserStore()

  useEffect(() => {
    useUserStore.getState().fetchUser()
    if (isLoggedIn) chatService.start()
  }, [isLoggedIn])

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/forgot-password' element={<ForgotPassword />} />
          <Route path='/emailConfirm/:status' element={<EmailConfirm />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path='/' element={<Navigate to='/home' replace />} />
            <Route path='/home' element={<Home />} />
            <Route path='/search' element={<SearchPage />} />
            <Route path='/friend' element={<FriendsList />} />
            <Route path='/profile' element={<Navigate to={`/profile/${user?.userName}`} replace />} />
            <Route path='/profile/:userName' element={<ProfileUser />} />
            <Route path='/inbox' element={<Inbox />} />
            <Route path='/inbox/:conversationId?' element={<Inbox />} />

            <Route path='/post/:postId' element={<PostDetail />} />

            <Route path='/groups' element={<Groups />}>
              <Route index element={<GroupsFeed />} />
              <Route path='discover' element={<GroupsDiscover />} />
              <Route path='my-groups' element={<MyGroupsPage />} />
              <Route path=':groupId' element={<GroupDetail />} />
            </Route>
            <Route path='/group/:groupId' element={<GroupDetail />} />
          </Route>
        </Route>

        <Route path='*' element={<Navigate to={isLoggedIn ? '/home' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
