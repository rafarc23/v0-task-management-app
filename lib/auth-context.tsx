"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { setDemoMode as setDemoModeStorage } from "@/lib/demo-data"

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
  loginDemo: () => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  isRequester: boolean
  isEmployee: boolean
  isDemoMode: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo user for testing without database
const DEMO_USER: User = {
  id: "demo-admin-001",
  username: "demo_admin",
  email: "demo@empresa.com",
  name: "Usuario Demo",
  role: "admin",
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)
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

  const loginDemo = useCallback(() => {
    setUser(DEMO_USER)
    setIsDemoMode(true)
    setIsLoading(false)
    router.push("/dashboard")
  }, [router])

  const logout = useCallback(async () => {
    try {
      if (!isDemoMode) {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsDemoMode(false)
      router.push("/login")
    }
  }, [router, isDemoMode])

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
        loginDemo,
        logout,
        refreshUser,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        isRequester: user?.role === "requester",
        isEmployee: user?.role === "employee",
        isDemoMode,
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
