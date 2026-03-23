export type UserRole = 'customer' | 'admin' | 'delivery_agent' | 'kitchen'

export type User = {
  id: string
  phone: string
  email?: string
  name: string
  avatar_url?: string
  role: UserRole
  is_verified: boolean
  created_at: string
  updated_at: string
}

export type AuthSession = {
  user: User
  access_token: string
  refresh_token: string
  expires_at: number
}

export type AuthError = {
  code: string
  message: string
}

export type OtpRequest = {
  phone: string
}

export type OtpVerify = {
  phone: string
  otp: string
}

export type RegisterPayload = {
  phone: string
  name: string
  email?: string
  otp: string
}
