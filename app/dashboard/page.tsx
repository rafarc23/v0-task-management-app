"use client"

import { useMemo, useCallback, memo, useState, lazy, Suspense } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { StatsCards } from "@/components/stats-cards"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTasks, useEmployees } from "@/lib/hooks/use-data"
import type { Task } from "@/lib/types"
import {
  Calendar, List, LayoutGrid, User,
  Image as ImageIcon, Mic, ChevronRight, Search, AlertTriangle, Loader2
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { Input } from "@/components/ui/input"

// Lazy load heavy components - only loaded when tab is selected
const CalendarView = lazy(() => import("@/components/calendar-view").then(m => ({ default: m.CalendarView })))
const KanbanView = lazy(() => import("@/components/kanban-view").then(m => ({ default: m.KanbanView })))

// Loading fallback for lazy components
const TabLoading = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
  </div>
)

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}

function DashboardContent() {
  const router = useRouter()
  const { user, isAdmin } = useAuth()
  const [filterEmployee, setFilterEmployee] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Use SWR hooks for data fetching
  const { tasks: allTasks, isLoading: tasksLoading } = useTasks()
  const { employees, isLoading: employeesLoading } = useEmployees()

  // Filter tasks based on user role and selected employee
  const tasks = useMemo(() => {
    if (!allTasks) return []
    let filtered = allTasks.filter(t => !t.archived)
    if (filterEmployee !== "all") {
      filtered = filtered.filter((t) => t.assignedTo?.id === filterEmployee)
    } else if (!isAdmin) {
      filtered = filtered.filter((t) => t.requestedBy.id === user?.id)
    }
    return filtered
  }, [allTasks, filterEmployee, isAdmin, user?.id])

  // Redirect requester to their solicitudes page
  useMemo(() => {
    if (user?.role === "requester") {
      router.push("/mis-solicitudes")
    }
  }, [user?.role, router])

  // Memoized search and filter
  const filteredTasks = useMemo(() => {
    if (!searchQuery) return tasks
    const query = searchQuery.toLowerCase()
    return tasks.filter((t) =>
      t.title.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query) ||
      t.assignedTo?.name.toLowerCase().includes(query)
    )
  }, [tasks, searchQuery])

  const { assignedTasks, unassignedTasks } = useMemo(() => ({
    assignedTasks: filteredTasks.filter((t) => t.assignedTo),
    unassignedTasks: filteredTasks.filter((t) => !t.assignedTo)
  }), [filteredTasks])

  // Memoized employee color lookup map for O(1) access
  const employeeColorMap = useMemo(() => {
    const map = new Map<string, string>()
    employees.forEach(e => map.set(e.id, e.color))
    return map
  }, [employees])

  const getEmployeeColor = useCallback((employeeId?: string) => {
    if (!employeeId) return "#9ca3af"
    return employeeColorMap.get(employeeId) || "#9ca3af"
  }, [employeeColorMap])

  // Static helper functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgente": return "bg-red-500 text-white"
      case "alta": return "bg-orange-500 text-white"
      case "media": return "bg-blue-500 text-white"
      case "baja": return "bg-gray-400 text-white"
      default: return "bg-gray-400 text-white"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completada": return "bg-emerald-500 text-white"
      case "en_proceso": return "bg-blue-500 text-white"
      case "pendiente": return "bg-amber-500 text-white"
      case "cancelada": return "bg-gray-400 text-white"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatStatus = (s: string) => {
    switch (s) {
      case "pendiente": return "Pendiente"
      case "en_proceso": return "En Proceso"
      case "completada": return "Completada"
      case "cancelada": return "Cancelada"
      default: return s
    }
  }

  const formatPriority = (p: string) => p.charAt(0).toUpperCase() + p.slice(1)

  // Memoized TaskRow component
  const TaskRow = memo(function TaskRow({ task, highlighted }: { task: Task; highlighted?: boolean }) {
    const empColor = getEmployeeColor(task.assignedTo?.id)
    const hasImages = task.attachments?.some((a) => a.type === "image")
    const hasAudios = task.attachments?.some((a) => a.type === "audio")

    return (
      <div
        className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all group ${
          highlighted
            ? "border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 hover:shadow-lg hover:border-orange-400 ring-1 ring-orange-200"
            : "border-2 border-slate-100 bg-white hover:shadow-md hover:border-slate-200"
        }`}
        onClick={() => router.push(`/tarea/${task.id}`)}
      >
        <div className="w-1.5 h-14 rounded-full flex-shrink-0" style={{ backgroundColor: highlighted ? "#f97316" : empColor }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900 truncate">{task.title}</h3>
            {hasImages && <ImageIcon className="h-3.5 w-3.5 text-rose-400 flex-shrink-0" />}
            {hasAudios && <Mic className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />}
          </div>
          <p className="text-sm text-slate-500 truncate">{task.description}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Badge className={`text-[10px] px-2 py-0 h-5 ${getPriorityColor(task.priority)}`}>{formatPriority(task.priority)}</Badge>
            <Badge className={`text-[10px] px-2 py-0 h-5 ${getStatusColor(task.status)}`}>{formatStatus(task.status)}</Badge>
            <span className="text-[10px] text-slate-400 capitalize">{task.category}</span>
          </div>
        </div>

        <div className="text-right flex-shrink-0 hidden md:block">
          {task.assignedTo ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: empColor }}>
                {task.assignedTo.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">{task.assignedTo.name}</p>
                <p className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true, locale: es })}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-100 border-2 border-dashed border-orange-400">
                <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-600">Sin asignar</p>
                <p className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(task.createdAt), { addSuffix: true, locale: es })}</p>
              </div>
            </div>
          )}
        </div>

        <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
      </div>
    )
  })

  const isLoading = tasksLoading || employeesLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-50">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-600">Cargando datos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-sky-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Cuadro de Mando</h2>
            <p className="text-slate-500 mt-1">{isAdmin ? "Vista de administrador" : "Mis solicitudes"}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar tareas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-[220px] bg-white border-2 border-slate-200" />
            </div>
            {isAdmin && (
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger className="w-[220px] bg-white border-2 border-slate-200">
                  <User className="mr-2 h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Filtrar empleado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los empleados</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: emp.color }} />
                        {emp.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <StatsCards tasks={filteredTasks} />

          <Tabs defaultValue="list" className="w-full">
            <TabsList className="bg-white/80 backdrop-blur border-2 border-slate-200 p-1 h-auto">
              <TabsTrigger value="list" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2 px-4">
                <List className="h-4 w-4" /> Lista
              </TabsTrigger>
              <TabsTrigger value="calendar" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2 px-4">
                <Calendar className="h-4 w-4" /> Calendario
              </TabsTrigger>
              <TabsTrigger value="kanban" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white gap-2 px-4">
                <LayoutGrid className="h-4 w-4" /> Kanban
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-6 mt-6">
              {/* Unassigned - Highlighted first */}
              {unassignedTasks.length > 0 && (
                <Card className="border-2 border-orange-300 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 shadow-lg overflow-hidden">
                  <div className="h-1.5 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500" />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl shadow-md">
                        <AlertTriangle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-orange-800 text-lg">Tareas Sin Asignar</h3>
                        <p className="text-sm text-orange-600">{unassignedTasks.length} tareas pendientes de asignacion</p>
                      </div>
                      <Badge className="bg-orange-500 text-white text-lg px-3 py-1 ml-auto animate-pulse">{unassignedTasks.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {unassignedTasks.map((task) => (
                        <TaskRow key={task.id} task={task} highlighted />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assigned Tasks */}
              <Card className="border-2 border-slate-200 bg-white/80 backdrop-blur shadow-lg overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500" />
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl shadow-md">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">Tareas Asignadas</h3>
                      <p className="text-sm text-slate-500">{assignedTasks.length} tareas con responsable</p>
                    </div>
                    <Badge className="bg-emerald-500 text-white text-lg px-3 py-1 ml-auto">{assignedTasks.length}</Badge>
                  </div>
                  {assignedTasks.length === 0 ? (
                    <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
                      <User className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                      <p className="text-slate-400 font-medium">No hay tareas asignadas</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assignedTasks.map((task) => (
                        <TaskRow key={task.id} task={task} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <Suspense fallback={<TabLoading />}>
                <CalendarView tasks={filteredTasks} onTaskClick={(taskId) => router.push(`/tarea/${taskId}`)} selectedEmployee={filterEmployee !== "all" ? filterEmployee : undefined} />
              </Suspense>
            </TabsContent>

            <TabsContent value="kanban" className="mt-6">
              <Suspense fallback={<TabLoading />}>
                <KanbanView tasks={filteredTasks} onTaskClick={(taskId) => router.push(`/tarea/${taskId}`)} />
              </Suspense>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
