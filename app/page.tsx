"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, isAdmin, isRequester } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    } else if (isAdmin) {
      router.push("/dashboard")
    } else if (isRequester) {
      router.push("/mis-solicitudes")
    } else {
      router.push("/mis-tareas")
    }
  }, [isAuthenticated, isAdmin, isRequester, router])

  return null
}
