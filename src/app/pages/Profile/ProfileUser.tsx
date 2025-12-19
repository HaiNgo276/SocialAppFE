import ProfileEdit from '@/app/components/Profile/ProfileEdit'
import ProfileView from '@/app/components/Profile/ProfileView'
import { postService } from '@/app/services/post.service'
import { relationService } from '@/app/services/relation.service'
import { userService } from '@/app/services/user.service'
import { ResponseHasData } from '@/app/types/Base/Responses/ResponseHasData'
import { PostData } from '@/app/types/Post/Post'
import { UserDto } from '@/app/types/User/user.dto'
import { message, Spin } from 'antd'
import { AxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const initialUserInfo = {
  id: '',
  status: '',
  email: '',
  userName: '',
  firstName: '',
  lastName: '',
  avatarUrl: '',
  gender: '',
  phoneNumer: '',
  description: ''
}

const ProfileUser = () => {
  const { userName } = useParams()
  const navigate = useNavigate()
  const [userInfo, setUserInfo] = useState<UserDto>(initialUserInfo)
  const [posts, setPosts] = useState<PostData[]>([])

  const [isEditing, setIsEditing] = useState(false)
  const [countLoading, setCountLoading] = useState<number>(0)

  const getUserInfo = async () => {
    try {
      setCountLoading((pre) => pre + 1)
      const res = await userService.getUserInfoByUserName(userName || '')
      if (res.status === 200) {
        setUserInfo(res.data as UserDto)
        setCountLoading((pre) => pre - 1)
      }
    } catch (err) {
      const error = err as AxiosError
      setCountLoading((pre) => pre - 1)
      const status = error?.response?.status

      if (status === 400) {
        message.error('User not found!')
        navigate('/home')
        return
      }

      message.error('Error while getting user information!')
    }
  }

  const getPost = async () => {
    try {
      if (!userInfo.id && userName) return
      setCountLoading((pre) => pre + 1)
      const res = await postService.getPostsByUser(userInfo.id)
      if (res.status === 200) {
        setPosts(res.data.posts.map((feed: any) => feed.post))
        setCountLoading((pre) => pre - 1)
      }
    } catch (err) {
      setCountLoading((pre) => pre - 1)
      console.log('Error to load posts!: ', err)
    }
  }

  const [followerList, setFolloweList] = useState<UserDto[]>([])
  const [followingList, setFollowingList] = useState<UserDto[]>([])
  const [friendList, setFriendList] = useState<UserDto[]>([])

  const getFollower = async () => {
    try {
      const res = await relationService.getFollowersList()
      if (res.status === 200) {
        setFolloweList(res.data.data.data)
      }
    } catch (e) {
      console.log('Error get list follower: ', e)
    }
  }

  const getFollowing = async () => {
    try {
      const res = await relationService.getFollowingList()
      if (res.status === 200) {
        setFollowingList(res.data.data.data)
      }
    } catch (e) {
      console.log('Error get list follower: ', e)
    }
  }

  const getFriend = async () => {
    try {
      const res = await relationService.getFriendsList()
      if (res.status === 200) {
        const resData = res.data as ResponseHasData<UserDto[]>
        setFriendList(resData.data as UserDto[])
      } else {
        message.error('Error while getting friend list')
      }
    } catch (e) {
      console.log('Error get list follower: ', e)
    }
  }

  useEffect(() => {
    getUserInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName])

  useEffect(() => {
    if (userInfo.id) {
      getPost()
      getFollower()
      getFollowing()
      getFriend()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName])

  return (
    <Spin spinning={countLoading !== 0}>
      <main className='min-h-screen bg-background'>
        {countLoading === 0 &&
          (isEditing ? (
            <ProfileEdit onBack={() => setIsEditing(false)} userInfo={userInfo} refreshData={getUserInfo} />
          ) : (
            <ProfileView
              posts={posts}
              followerList={followerList}
              friendList={friendList}
              followingList={followingList}
              userInfo={userInfo}
              onEdit={() => setIsEditing(true)}
            />
          ))}
      </main>
    </Spin>
  )
}

export default ProfileUser
