export interface AuthUser {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  provider: string
  timezone: string
  preferences: Record<string, unknown>
  createdAt: string
  lastActiveAt: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
  timezone?: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export interface AuthSession {
  user: AuthUser
  tokens: TokenPair
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
