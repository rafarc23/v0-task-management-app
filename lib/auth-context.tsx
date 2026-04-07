"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export type UserRole = "admin" | "employee" | "requester"

export interface User {
  id: string
  username: string
  email: string
  name: string
  role: UserRole
  avatar?: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isRequester: boolean
  isEmployee: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' })
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
        }
      } catch (error) {
        console.error('Session check error:', error)
      } finally {
        setIsLoading(false)
      }
    }
    checkSession()
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || 'Error de autenticación' }
      }

      setUser(data.user)
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Error de conexión' }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      router.push("/login")
    }
  }, [router])

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' })
      const data = await res.json()
      if (data.user) {
        setUser(data.user)
      }
    } catch (error) {
      console.error('Refresh user error:', error)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        refreshUser,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        isRequester: user?.role === "requester",
        isEmployee: user?.role === "employee",
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
