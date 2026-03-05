"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export type UserRole = "employee" | "admin" | "requester"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department?: string
  avatar?: string
  employeeId?: string // linked employee profile
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  setEmployeeProfile: (employeeId: string, name: string, email: string) => void
  isAuthenticated: boolean
  isAdmin: boolean
  isRequester: boolean
  isEmployee: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const demoUsers: Record<string, { password: string; user: User }> = {
      "admin@empresa.com": {
        password: "admin123",
        user: {
          id: "1",
          email: "admin@empresa.com",
          name: "Administrador",
          role: "admin",
          department: "Infraestructura y TI",
        },
      },
      "empleado@empresa.com": {
        password: "empleado123",
        user: {
          id: "2",
          email: "empleado@empresa.com",
          name: "Operario",
          role: "employee",
          department: "Infraestructura y TI",
        },
      },
      "solicitante@empresa.com": {
        password: "solicitante123",
        user: {
          id: "3",
          email: "solicitante@empresa.com",
          name: "Ana Martinez",
          role: "requester",
          department: "Produccion",
        },
      },
    }

    const userCredentials = demoUsers[email]
    if (userCredentials && userCredentials.password === password) {
      setUser(userCredentials.user)
      localStorage.setItem("user", JSON.stringify(userCredentials.user))
      return true
    }
    return false
  }

  const setEmployeeProfile = (employeeId: string, name: string, email: string) => {
    if (!user) return
    const updatedUser = { ...user, employeeId, name, email }
    setUser(updatedUser)
    localStorage.setItem("user", JSON.stringify(updatedUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        setEmployeeProfile,
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
