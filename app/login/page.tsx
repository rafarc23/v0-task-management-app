"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Wrench, Send, Play, X, Eye, EyeOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [demoPassword, setDemoPassword] = useState("")
  const [demoError, setDemoError] = useState("")
  const [showDemoPassword, setShowDemoPassword] = useState(false)
  const router = useRouter()
  const { login, loginDemo } = useAuth()

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    
    try {
      const result = await login(username, password)
      if (result.success) {
        router.push("/dashboard")
      } else {
        setError(result.error || "Credenciales incorrectas o usuario inactivo.")
      }
    } catch {
      setError("Error al iniciar sesion. Intente de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }, [username, password, login, router])

  const fillDemo = useCallback((user: string, pass: string) => {
    setUsername(user)
    setPassword(pass)
  }, [])

  const handleDemoLogin = useCallback(() => {
    if (demoPassword === "1234") {
      setShowDemoModal(false)
      setDemoPassword("")
      setDemoError("")
      loginDemo()
    } else {
      setDemoError("Contraseña incorrecta")
    }
  }, [demoPassword, loginDemo])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-3 pb-2">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
            <Wrench className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-center text-slate-800">
            Sistema de Gestion de Tareas
          </CardTitle>
          <CardDescription className="text-center text-slate-500">
            Departamento de Infraestructura y TI
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-700">Usuario o Correo</Label>
              <Input
                id="username"
                type="text"
                placeholder="admin o usuario@empresa.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">Contrasena</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold" 
              disabled={isLoading}
            >
              {isLoading ? "Iniciando sesion..." : "Iniciar Sesion"}
            </Button>

            <div className="pt-4 border-t border-slate-200 space-y-3">
              <p className="text-sm font-semibold text-slate-600 text-center">Accesos rapidos</p>
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={() => setShowDemoModal(true)}
                  className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50/50 transition-all text-left bg-purple-50/30"
                >
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <Play className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-800">Probar App</p>
                    <p className="text-xs text-purple-600">Modo demo sin base de datos</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("admin", "Cima1100")}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Administrador</p>
                    <p className="text-xs text-slate-500">Gestion completa del sistema</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("empleado@empresa.com", "empleado123")}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                    <Wrench className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Operario / Empleado</p>
                    <p className="text-xs text-slate-500">Ve sus tareas asignadas</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => fillDemo("solicitante@empresa.com", "solicitante123")}
                  className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition-all text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                    <Send className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">Solicitante</p>
                    <p className="text-xs text-slate-500">Solicita tareas y ve su estado</p>
                  </div>
                </button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Demo Password Modal */}
      <Dialog open={showDemoModal} onOpenChange={setShowDemoModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Play className="h-4 w-4 text-white" />
              </div>
              Modo Demo
            </DialogTitle>
            <DialogDescription>
              Ingresa la contraseña para acceder al modo de prueba
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="demo-password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="demo-password"
                  type={showDemoPassword ? "text" : "password"}
                  value={demoPassword}
                  onChange={(e) => {
                    setDemoPassword(e.target.value)
                    setDemoError("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleDemoLogin()
                    }
                  }}
                  placeholder="Introduce la contraseña"
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowDemoPassword(!showDemoPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showDemoPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {demoError && (
              <Alert variant="destructive">
                <AlertDescription>{demoError}</AlertDescription>
              </Alert>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDemoModal(false)
                  setDemoPassword("")
                  setDemoError("")
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={handleDemoLogin}
              >
                Acceder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
