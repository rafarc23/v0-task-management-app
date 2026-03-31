"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Users, LayoutDashboard, Plus, BarChart3, Bell, ClipboardList, FolderKanban, Send, Wrench, Archive, UserCog } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { getUserNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/lib/notification-storage"
import type { Notification } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export function DashboardHeader() {
  const { user, logout, isAdmin, isRequester, isEmployee } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!user) return
    const loadNotifications = () => {
      const userNotifications = getUserNotifications(user.id)
      setNotifications(userNotifications.slice(0, 10))
      setUnreadCount(getUnreadCount(user.id))
    }
    loadNotifications()
    // Reduced from 5s to 30s for better performance on low-resource servers
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    setUnreadCount(getUnreadCount(user!.id))
    if (notification.taskId) {
      router.push(`/tarea/${notification.taskId}`)
    }
  }

  const handleMarkAllAsRead = () => {
    if (!user) return
    markAllAsRead(user.id)
    setUnreadCount(0)
    const userNotifications = getUserNotifications(user.id)
    setNotifications(userNotifications.slice(0, 10))
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "task_assigned": return "📋"
      case "task_updated": return "🔄"
      case "task_comment": return "💬"
      case "task_completed": return "✅"
      default: return "🔔"
    }
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const NavButton = ({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active?: boolean }) => (
    <Button
      variant="secondary"
      size="sm"
      className={`text-white border-white/20 transition-all ${
        pathname === href
          ? "bg-white/30 font-semibold"
          : "bg-white/10 hover:bg-white/20"
      }`}
      onClick={() => router.push(href)}
    >
      <Icon className="mr-1.5 h-4 w-4" />
      {label}
    </Button>
  )

  const roleLabel = isAdmin ? "Administrador" : isEmployee ? "Operario" : "Solicitante"
  const roleBg = isAdmin ? "bg-blue-400/30" : isEmployee ? "bg-emerald-400/30" : "bg-amber-400/30"

  return (
    <header className="border-b bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform shadow-lg"
            onClick={() => router.push("/dashboard")}
          >
            <Wrench className="h-5 w-5" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-lg font-bold">Gestion de Tareas</h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-white/60">Infraestructura y TI</p>
              <Badge className={`${roleBg} text-white border-0 text-[10px] px-1.5 py-0`}>{roleLabel}</Badge>
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-2 flex-wrap">
          {/* Solicitante nav */}
          {isRequester && (
            <>
              <NavButton href="/nueva-solicitud" icon={Plus} label="Nueva Solicitud" />
              <NavButton href="/mis-solicitudes" icon={Send} label="Mis Solicitudes" />
            </>
          )}

          {/* Empleado nav */}
          {isEmployee && (
            <>
              <NavButton href="/mis-tareas" icon={ClipboardList} label="Mis Tareas" />
              <NavButton href="/nueva-solicitud" icon={Plus} label="Nueva Solicitud" />
            </>
          )}

          {/* Admin nav */}
          {isAdmin && (
            <>
              <NavButton href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavButton href="/nueva-solicitud" icon={Plus} label="Nueva" />
              <NavButton href="/mis-tareas" icon={ClipboardList} label="Mis Tareas" />
              <NavButton href="/equipo" icon={Users} label="Equipo" />
              <NavButton href="/usuarios" icon={UserCog} label="Usuarios" />
              <NavButton href="/proyectos" icon={FolderKanban} label="Proyectos" />
              <NavButton href="/informes" icon={BarChart3} label="Informes" />
              <NavButton href="/archivo" icon={Archive} label="Archivo" />
            </>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-white/10">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs border-2 border-slate-900">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-96" align="end">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notificaciones</span>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs h-6">
                    Marcar todas leidas
                  </Button>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">No hay notificaciones</div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.read ? "bg-blue-50" : ""}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-base">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{notification.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                        </div>
                        {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground pl-6">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: es })}
                      </p>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-white/10">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xs font-bold">
                    {user && getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <Badge variant="outline" className="w-fit text-xs">{roleLabel}</Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
              )}
              {isRequester && (
                <DropdownMenuItem onClick={() => router.push("/mis-solicitudes")}>
                  <Send className="mr-2 h-4 w-4" /> Mis Solicitudes
                </DropdownMenuItem>
              )}
              {(isEmployee || isAdmin) && (
                <DropdownMenuItem onClick={() => router.push("/mis-tareas")}>
                  <ClipboardList className="mr-2 h-4 w-4" /> Mis Tareas
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  )
}
