export interface UserDto {
  id: string
  email: string
  userName: string
  status: string
  firstName: string
  lastName: string | null
  avatarUrl: string | null
  gender?: string
  phoneNumer?: string
  description?: string
}
