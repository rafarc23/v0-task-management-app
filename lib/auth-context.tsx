"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { validateCredentials, getUserById, type StoredUser, type UserRole } from "./user-storage"

export type { UserRole }

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department?: string
  avatar?: string
  employeeId?: string
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  setEmployeeProfile: (employeeId: string, name: string, email: string) => void
  refreshUser: () => void
  isAuthenticated: boolean
  isAdmin: boolean
  isRequester: boolean
  isEmployee: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function storedUserToUser(stored: StoredUser): User {
  return {
    id: stored.id,
    email: stored.email,
    name: stored.name,
    role: stored.role,
    department: stored.department,
    avatar: stored.avatar,
    employeeId: stored.employeeId,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId")
    if (storedUserId) {
      const stored = getUserById(storedUserId)
      if (stored && stored.isActive) {
        setUser(storedUserToUser(stored))
      } else {
        // User was deleted or deactivated
        localStorage.removeItem("userId")
      }
    }
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const stored = validateCredentials(username, password)
    if (stored) {
      const userData = storedUserToUser(stored)
      setUser(userData)
      localStorage.setItem("userId", stored.id)
      return true
    }
    return false
  }, [])

  const setEmployeeProfile = useCallback((employeeId: string, name: string, email: string) => {
    if (!user) return
    const updatedUser = { ...user, employeeId, name, email }
    setUser(updatedUser)
  }, [user])

  const refreshUser = useCallback(() => {
    const storedUserId = localStorage.getItem("userId")
    if (storedUserId) {
      const stored = getUserById(storedUserId)
      if (stored && stored.isActive) {
        setUser(storedUserToUser(stored))
      }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem("userId")
    router.push("/login")
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        setEmployeeProfile,
        refreshUser,
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
