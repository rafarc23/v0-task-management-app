"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTasks } from "@/lib/task-storage"
import type { Task } from "@/lib/types"
import {
  Plus, Clock, CheckCircle2, AlertCircle, XCircle,
  ArrowRight, Calendar, MessageSquare, Image as ImageIcon,
  Mic, ChevronDown, ChevronUp, FileText, Send, Search,
  User, Building2, Filter
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

const DEPT_LABELS: Record<string, string> = {
  produccion: "Produccion", calidad: "Calidad", logistica: "Logistica",
  administracion: "Administracion", recursos_humanos: "Recursos Humanos",
  ventas: "Ventas", compras: "Compras", mantenimiento: "Mantenimiento", otro: "Otro",
}

export default function MisSolicitudesPage() {
  return <AuthGuard><MisSolicitudesContent /></AuthGuard>
}

function MisSolicitudesContent() {
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("todas")
  const [nameFilter, setNameFilter] = useState("")
  const [deptFilter, setDeptFilter] = useState<string>("todos")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const load = () => {
      const all = getTasks()
      // Admin can see all requests; requester/employee sees only theirs
      if (isAdmin) {
        setTasks(all)
      } else {
        setTasks(all.filter(
          (t) => t.requestedBy.id === user?.id ||
                 t.requestedBy.email === user?.email ||
                 t.requesterName?.toLowerCase() === user?.name.toLowerCase()
        ))
      }
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [user, isAdmin])

  // Get unique departments from tasks
  const departments = Array.from(new Set(tasks.map((t) => t.requesterDepartment || t.requestedBy.department).filter(Boolean)))

  // Apply filters
  const filtered = tasks.filter((t) => {
    if (statusFilter !== "todas" && t.status !== statusFilter) return false
    if (nameFilter) {
      const name = (t.requesterName || t.requestedBy.name).toLowerCase()
      if (!name.includes(nameFilter.toLowerCase())) return false
    }
    if (deptFilter !== "todos") {
      const dept = t.requesterDepartment || t.requestedBy.department
      if (dept !== deptFilter) return false
    }
    return true
  })

  const pendingCount = tasks.filter((t) => t.status === "pendiente").length
  const inProgressCount = tasks.filter((t) => t.status === "en_proceso").length
  const completedCount = tasks.filter((t) => t.status === "completada").length
  const cancelledCount = tasks.filter((t) => t.status === "cancelada").length
  const totalProgress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pendiente: { label: "Pendiente", color: "text-amber-700", bg: "bg-amber-100 border-amber-300", icon: <Clock className="h-4 w-4" /> },
    en_proceso: { label: "En Proceso", color: "text-blue-700", bg: "bg-blue-100 border-blue-300", icon: <AlertCircle className="h-4 w-4" /> },
    completada: { label: "Completada", color: "text-emerald-700", bg: "bg-emerald-100 border-emerald-300", icon: <CheckCircle2 className="h-4 w-4" /> },
    cancelada: { label: "Cancelada", color: "text-red-700", bg: "bg-red-100 border-red-300", icon: <XCircle className="h-4 w-4" /> },
  }

  const priorityConfig: Record<string, { label: string; color: string }> = {
    urgente: { label: "Urgente", color: "bg-red-500 text-white" },
    alta: { label: "Alta", color: "bg-orange-500 text-white" },
    media: { label: "Media", color: "bg-blue-500 text-white" },
    baja: { label: "Baja", color: "bg-slate-400 text-white" },
  }

  const getStepProgress = (status: string) => {
    switch (status) {
      case "pendiente": return 25
      case "en_proceso": return 60
      case "completada": return 100
      case "cancelada": return 0
      default: return 0
    }
  }

  const getDeptLabel = (value: string) => DEPT_LABELS[value] || value

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <DashboardHeader />
      <main className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              {isAdmin ? "Todas las Solicitudes" : "Mis Solicitudes"}
            </h1>
            <p className="text-slate-500 mt-1">
              {isAdmin
                ? "Consulta y filtra todas las solicitudes recibidas por nombre y departamento"
                : `Hola ${user?.name}, aqui puedes ver el estado de todas tus solicitudes`}
            </p>
          </div>
          <Button onClick={() => router.push("/nueva-solicitud")}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg">
            <Plus className="h-4 w-4 mr-2" /> Nueva Solicitud
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-2 border-slate-200 bg-white cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("todas")}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-slate-800">{tasks.length}</p>
              <p className="text-sm text-slate-500 font-medium">Total</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-amber-300 bg-amber-50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("pendiente")}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-700">{pendingCount}</p>
              <p className="text-sm text-amber-600 font-medium">Pendientes</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-300 bg-blue-50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("en_proceso")}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-blue-700">{inProgressCount}</p>
              <p className="text-sm text-blue-600 font-medium">En Proceso</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-emerald-300 bg-emerald-50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("completada")}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-700">{completedCount}</p>
              <p className="text-sm text-emerald-600 font-medium">Completadas</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-red-300 bg-red-50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter("cancelada")}>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-700">{cancelledCount}</p>
              <p className="text-sm text-red-600 font-medium">Canceladas</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card className="border-2 border-slate-200 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">Progreso general</p>
              <p className="text-sm font-bold text-slate-800">{totalProgress}%</p>
            </div>
            <Progress value={totalProgress} className="h-3" />
            <p className="text-xs text-slate-500 mt-2">{completedCount} de {tasks.length} solicitudes completadas</p>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-indigo-700">Filtros de Busqueda</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre del solicitante..."
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  className="pl-9 border-2 border-indigo-200 bg-white"
                />
              </div>
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="border-2 border-indigo-200 bg-white">
                  <Building2 className="h-4 w-4 mr-2 text-indigo-500" />
                  <SelectValue placeholder="Todos los departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los Departamentos</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{getDeptLabel(d)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="border-2 border-indigo-200 bg-white">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos los Estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_proceso">En Proceso</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(nameFilter || deptFilter !== "todos" || statusFilter !== "todas") && (
              <div className="flex items-center gap-2 mt-3">
                <p className="text-xs text-indigo-600 font-medium">
                  Mostrando {filtered.length} de {tasks.length} solicitudes
                </p>
                <Button variant="ghost" size="sm" className="text-xs text-indigo-500 h-6 px-2"
                  onClick={() => { setNameFilter(""); setDeptFilter("todos"); setStatusFilter("todas") }}>
                  Limpiar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task list */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <Card className="border-2 border-dashed border-slate-300 bg-white">
              <CardContent className="p-12 text-center">
                <Send className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-600">No hay solicitudes</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {nameFilter || deptFilter !== "todos" ? "No se encontraron solicitudes con esos filtros" : "Crea tu primera solicitud de trabajo"}
                </p>
                {nameFilter || deptFilter !== "todos" ? (
                  <Button onClick={() => { setNameFilter(""); setDeptFilter("todos"); setStatusFilter("todas") }} className="mt-4" variant="outline">
                    Limpiar Filtros
                  </Button>
                ) : (
                  <Button onClick={() => router.push("/nueva-solicitud")} className="mt-4" variant="outline">
                    <Plus className="h-4 w-4 mr-2" /> Crear Solicitud
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filtered.map((task) => {
              const sc = statusConfig[task.status]
              const pc = priorityConfig[task.priority]
              const isExpanded = expandedId === task.id
              const step = getStepProgress(task.status)
              const requesterName = task.requesterName || task.requestedBy.name
              const requesterDept = getDeptLabel(task.requesterDepartment || task.requestedBy.department)

              return (
                <Card key={task.id} className="border-2 border-slate-200 bg-white hover:shadow-lg transition-all overflow-hidden">
                  {/* Progress bar top */}
                  <div className="h-1.5 bg-slate-100">
                    <div className={`h-full transition-all duration-500 ${
                      task.status === "completada" ? "bg-emerald-500" :
                      task.status === "en_proceso" ? "bg-blue-500" :
                      task.status === "cancelada" ? "bg-red-400" : "bg-amber-400"
                    }`} style={{ width: `${step}%` }} />
                  </div>
                  <CardContent className="p-0">
                    <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : task.id)}>
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${sc.bg} ${sc.color}`}>
                        {sc.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-slate-800 truncate">{task.title}</h3>
                          <Badge className={`${pc.color} text-xs`}>{pc.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1 font-medium text-indigo-600">
                            <User className="h-3 w-3" /> {requesterName}
                          </span>
                          <span className="flex items-center gap-1 text-purple-600">
                            <Building2 className="h-3 w-3" /> {requesterDept}
                          </span>
                          <span>
                            {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true, locale: es })}
                          </span>
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(task.dueDate), "dd MMM yyyy", { locale: es })}
                            </span>
                          )}
                          {task.assignedTo && (
                            <span className="text-emerald-600 font-medium">
                              Asignada a: {task.assignedTo.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className={`${sc.bg} ${sc.color} border`}>{sc.label}</Badge>
                        {task.comments.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <MessageSquare className="h-3 w-3" /> {task.comments.length}
                          </span>
                        )}
                        {task.attachments && task.attachments.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <FileText className="h-3 w-3" /> {task.attachments.length}
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-4">
                        {/* Requester info card */}
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white font-bold">
                            {requesterName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-indigo-800">Solicitado por: {requesterName}</p>
                            <p className="text-xs text-indigo-600">Departamento: {requesterDept}</p>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600">{task.description}</p>

                        {/* Step tracker */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${step >= 25 ? "bg-amber-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                            <Clock className="h-3 w-3" /> Recibida
                          </div>
                          <div className={`h-0.5 w-6 ${step >= 50 ? "bg-blue-500" : "bg-slate-200"}`} />
                          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${step >= 60 ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                            <AlertCircle className="h-3 w-3" /> En Proceso
                          </div>
                          <div className={`h-0.5 w-6 ${step >= 100 ? "bg-emerald-500" : "bg-slate-200"}`} />
                          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${step >= 100 ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                            <CheckCircle2 className="h-3 w-3" /> Completada
                          </div>
                        </div>

                        {/* Attachments */}
                        {task.attachments && task.attachments.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-slate-700">Archivos adjuntos</p>
                            <div className="flex flex-wrap gap-3">
                              {task.attachments.filter((a) => a.type === "image").map((att) => (
                                <div key={att.id} className="relative group">
                                  <img src={att.url} alt={att.filename}
                                    className="h-20 w-20 object-cover rounded-lg border-2 border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                                    onClick={() => window.open(att.url, "_blank")} />
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ImageIcon className="h-3 w-3 inline mr-0.5" /> Ver
                                  </div>
                                </div>
                              ))}
                              {task.attachments.filter((a) => a.type === "audio").map((att) => (
                                <div key={att.id} className="flex items-center gap-2 bg-white border-2 border-slate-200 rounded-lg p-2">
                                  <Mic className="h-4 w-4 text-blue-500" />
                                  <audio controls src={att.url} className="h-8" />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Comments */}
                        {task.comments.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-slate-700">Comentarios recientes</p>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {task.comments.slice(-3).map((c) => (
                                <div key={c.id} className="flex gap-2 bg-white rounded-lg p-3 border border-slate-200">
                                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {c.userName.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-slate-700">{c.userName}</p>
                                    <p className="text-xs text-slate-500">{c.comment}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: es })}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <Button onClick={() => router.push(`/tarea/${task.id}`)}
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">
                          Ver Detalle Completo <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
