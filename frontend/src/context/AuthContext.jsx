import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react'

import * as authApi from '../api/auth'

const AuthContext = createContext(null)

function getStoredUser() {
  try {
    const storedUser = localStorage.getItem('shiptrack_user')
    return storedUser ? JSON.parse(storedUser) : null
  } catch (error) {
    console.error('Failed to read stored user:', error)
    localStorage.removeItem('shiptrack_user')
    return null
  }
}

function normalizeRoles(user) {
  if (!user) return []

  let roles = user.roles || user.role || []

  if (!Array.isArray(roles)) {
    roles = [roles]
  }

  return roles.map((role) =>
    String(role)
      .replace(/^ROLE_/, '')
      .toUpperCase()
  )
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({
      email,
      password,
    })

    localStorage.setItem('shiptrack_token', data.token)
    localStorage.setItem('shiptrack_user', JSON.stringify(data.user))

    setUser(data.user)

    return data.user
  }, [])

  const register = useCallback(async (payload) => {
    return authApi.register(payload)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('shiptrack_token')
    localStorage.removeItem('shiptrack_user')

    setUser(null)
  }, [])

  const roles = normalizeRoles(user)

  const isAuthenticated = Boolean(user)

  const isCustomer = roles.includes('CUSTOMER')
  const isBusinessClient = roles.includes('BUSINESS_CLIENT')
  const isAdministrator =
    roles.includes('ADMINISTRATOR') || roles.includes('ADMIN')

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        login,
        register,
        logout,
        isAuthenticated,
        isCustomer,
        isBusinessClient,
        isAdministrator,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}