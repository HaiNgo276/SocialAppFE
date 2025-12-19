import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { userService } from '@/app/services/user.service'
import { UserDto } from '../types/User/user.dto'

interface UserState {
  isLoggedIn: boolean
  user: UserDto | null
  isChecked: boolean
  setUser: (user: UserDto) => void
  setIsLoggedIn: (isLoggedIn: boolean) => void
  fetchUser: () => Promise<void>
  logout: () => void
}

// const cookieStorage = createJSONStorage(() => ({
//   getItem: (name: string): string | null => Cookies.get(name) ?? null,
//   setItem: (name: string, value: string): void => {
//     Cookies.set(name, value, {
//       expires: 7,
//       path: '/',
//       secure: true,
//       sameSite: 'Lax'
//     })
//   },
//   removeItem: (name: string): void => {
//     Cookies.remove(name)
//   }
// }))

export const useUserStore = create<UserState>((set) => ({
  isLoggedIn: false,
  user: null,
  isChecked: false,

  setUser: (user) => set({ user }),
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),

  fetchUser: async () => {
    try {
      const res = await userService.getUserInfoByToken()
      if (res.status === 200 && res.data) {
        const user = res.data as UserDto
        set({ user, isLoggedIn: true, isChecked: true })
      } else {
        set({ user: null, isLoggedIn: false })
      }
    } catch {
      set({ user: null, isLoggedIn: false, isChecked: true })
    }
  },

  logout: async () => {
    await userService.logout()
    set({ user: null, isLoggedIn: false, isChecked: true })
  }
}))
