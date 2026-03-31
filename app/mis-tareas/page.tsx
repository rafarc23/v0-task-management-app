"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTasks, useEmployees, useUpdateTask } from "@/lib/hooks/use-data"
import type { Task, Employee } from "@/lib/types"
import {
  Clock, CheckCircle2, AlertCircle, ArrowRight, Calendar as CalendarIcon,
  User, MessageSquare, Image as ImageIcon, Mic, Wrench,
  PlayCircle, FileText, Eye, Download, X, ChevronDown, ChevronLeft, ChevronRight,
  List, LayoutGrid, GripVertical, ArrowUp, ArrowDown, Flame, Loader2
} from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from "date-fns"
import { es } from "date-fns/locale"

const PRIORITY_ORDER: Record<string, number> = { urgente: 0, alta: 1, media: 2, baja: 3 }

function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) return a.order - b.order
    if (a.order !== undefined) return -1
    if (b.order !== undefined) return 1
    return (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
  })
}

export default function MisTareasPage() {
  return (
    <AuthGuard>
      <MisTareasContent />
    </AuthGuard>
  )
}

function MisTareasContent() {
  const router = useRouter()
  const { user, setEmployeeProfile } = useAuth()
  const { tasks: allTasks, isLoading: tasksLoading, mutate: mutateTasks } = useTasks()
  const { employees, isLoading: employeesLoading } = useEmployees()
  const { updateTask } = useUpdateTask()
  
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [viewTab, setViewTab] = useState("pendiente")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showSelector, setShowSelector] = useState(false)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [dragId, setDragId] = useState<string | null>(null)

  // Check if employee is already selected
  const activeEmployees = useMemo(() => employees.filter((e) => e.isActive), [employees])
  
  // Auto-select employee if user has an employeeId
  useMemo(() => {
    if (user?.employeeId && !selectedEmployee && activeEmployees.length > 0) {
      const found = activeEmployees.find((e) => e.id === user.employeeId)
      if (found) {
        setSelectedEmployee(found)
        setShowSelector(false)
      } else {
        setShowSelector(true)
      }
    } else if (!user?.employeeId && activeEmployees.length > 0 && !selectedEmployee) {
      setShowSelector(true)
    }
  }, [user?.employeeId, selectedEmployee, activeEmployees])

  const myTasks = useMemo(() => {
    if (!selectedEmployee) return []
    return allTasks.filter((t) => t.assignedTo?.name === selectedEmployee.name)
  }, [allTasks, selectedEmployee])

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp)
    setEmployeeProfile(emp.id, emp.name, emp.email)
    setShowSelector(false)
  }

  const pendingTasks = sortByPriority(myTasks.filter((t) => t.status === "pendiente"))
  const inProgressTasks = sortByPriority(myTasks.filter((t) => t.status === "en_proceso"))
  const completedTasks = sortByPriority(myTasks.filter((t) => t.status === "completada"))
  const totalTasks = myTasks.length
  const donePercent = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0

  const handleQuickStatus = useCallback(async (taskId: string, newStatus: "en_proceso" | "completada") => {
    await updateTask(taskId, { status: newStatus })
    mutateTasks()
  }, [updateTask, mutateTasks])

  const moveTask = useCallback(async (taskId: string, direction: "up" | "down", taskList: Task[]) => {
    const idx = taskList.findIndex((t) => t.id === taskId)
    if (idx < 0) return
    if (direction === "up" && idx === 0) return
    if (direction === "down" && idx === taskList.length - 1) return

    const newList = [...taskList]
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    const temp = newList[idx]
    newList[idx] = newList[swapIdx]
    newList[swapIdx] = temp

    // Save new order
    for (let i = 0; i < newList.length; i++) {
      await updateTask(newList[i].id, { order: i })
    }
    mutateTasks()
  }, [updateTask, mutateTasks])

  // Drag and drop handlers
  const handleDragStart = (taskId: string) => {
    setDragId(taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = useCallback(async (targetId: string, taskList: Task[]) => {
    if (!dragId || dragId === targetId) { setDragId(null); return }
    const fromIdx = taskList.findIndex((t) => t.id === dragId)
    const toIdx = taskList.findIndex((t) => t.id === targetId)
    if (fromIdx < 0 || toIdx < 0) { setDragId(null); return }

    const newList = [...taskList]
    const [moved] = newList.splice(fromIdx, 1)
    newList.splice(toIdx, 0, moved)

    for (let i = 0; i < newList.length; i++) {
      await updateTask(newList[i].id, { order: i })
    }
    setDragId(null)
    mutateTasks()
  }, [dragId, updateTask, mutateTasks])

  const priorityConfig: Record<string, { label: string; color: string; border: string; bg: string; glow: string }> = {
    urgente: { label: "URGENTE", color: "bg-red-600 text-white", border: "border-l-red-600", bg: "bg-red-50", glow: "shadow-red-200" },
    alta: { label: "ALTA", color: "bg-orange-500 text-white", border: "border-l-orange-500", bg: "bg-orange-50", glow: "shadow-orange-200" },
    media: { label: "MEDIA", color: "bg-blue-500 text-white", border: "border-l-blue-500", bg: "bg-blue-50", glow: "shadow-blue-100" },
    baja: { label: "BAJA", color: "bg-slate-400 text-white", border: "border-l-slate-400", bg: "bg-slate-50", glow: "shadow-slate-100" },
  }

  // Loading state
  if (tasksLoading || employeesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    )
  }

  // Employee selector
  if (showSelector || !selectedEmployee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <DashboardHeader />
        <main className="container mx-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <User className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800">Selecciona tu Perfil</h1>
              <p className="text-slate-500">Elige tu nombre para ver tus tareas asignadas</p>
            </div>
            <div className="grid gap-3">
              {activeEmployees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => handleSelectEmployee(emp)}
                  className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-400 hover:shadow-xl transition-all text-left group"
                >
                  <div
                    className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: emp.color }}
                  >
                    {emp.avatar ? (
                      <img src={emp.avatar} alt={emp.name} crossOrigin="anonymous" className="h-full w-full object-cover" />
                    ) : (
                      emp.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">{emp.name}</p>
                    <p className="text-sm text-slate-500">{emp.position} - {emp.department}</p>
                    <p className="text-xs text-slate-400">{emp.email}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </button>
              ))}
              {activeEmployees.length === 0 && (
                <Card className="border-2 border-dashed border-slate-300">
                  <CardContent className="p-10 text-center">
                    <User className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No hay operarios registrados</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    )
  }

  // --- Calendar ---
  function EmployeeCalendar() {
    const monthStart = startOfMonth(calendarDate)
    const monthEnd = endOfMonth(calendarDate)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const firstDayOfWeek = getDay(monthStart)
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

    const getTasksForDate = (date: Date) =>
      myTasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), date))

    const getStatusDot = (status: string) => {
      switch (status) {
        case "completada": return "bg-emerald-500"
        case "en_proceso": return "bg-blue-500"
        case "pendiente": return "bg-amber-500"
        default: return "bg-slate-400"
      }
    }

    return (
      <Card className="border-2 shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold capitalize">{format(calendarDate, "MMMM yyyy", { locale: es })}</h3>
              <p className="text-teal-100 text-sm">Tareas de {selectedEmployee.name}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setCalendarDate(new Date())} className="bg-white/20 text-white hover:bg-white/30 border-0">Hoy</Button>
              <Button variant="secondary" size="icon" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))} className="bg-white/20 text-white hover:bg-white/30 border-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="secondary" size="icon" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))} className="bg-white/20 text-white hover:bg-white/30 border-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-1">
            {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((d) => (
              <div key={d} className="text-center text-xs font-bold text-teal-600 uppercase tracking-wider py-3 border-b-2 border-teal-100">{d}</div>
            ))}
            {Array.from({ length: adjustedFirstDay }).map((_, i) => (
              <div key={`e-${i}`} className="min-h-[110px] bg-slate-50/50 rounded-lg m-0.5" />
            ))}
            {daysInMonth.map((day) => {
              const dayTasks = getTasksForDate(day)
              const isCurrent = isToday(day)
              const isWknd = getDay(day) === 0 || getDay(day) === 6
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[110px] rounded-lg m-0.5 transition-all ${
                    isCurrent ? "bg-teal-50 ring-2 ring-teal-500 shadow-md"
                    : isWknd ? "bg-slate-50 border border-slate-200"
                    : "bg-white border-2 border-slate-100 hover:border-teal-200"
                  }`}
                >
                  <div className="h-full flex flex-col p-1.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold inline-flex items-center justify-center w-7 h-7 rounded-full ${
                        isCurrent ? "bg-teal-600 text-white" : isWknd ? "text-slate-400" : "text-slate-700"
                      }`}>{format(day, "d")}</span>
                      {dayTasks.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-teal-100 text-teal-700">{dayTasks.length}</Badge>
                      )}
                    </div>
                    <div className="flex-1 space-y-1 overflow-y-auto">
                      {dayTasks.slice(0, 3).map((task) => {
                        const pc = priorityConfig[task.priority]
                        return (
                          <div
                            key={task.id}
                            className={`rounded-md cursor-pointer hover:scale-[1.02] transition-all px-1.5 py-1 border-l-3 ${pc.bg}`}
                            style={{ borderLeft: `3px solid ${selectedEmployee.color}` }}
                            onClick={() => router.push(`/tarea/${task.id}`)}
                          >
                            <div className="flex items-center gap-1">
                              <div className={`h-1.5 w-1.5 rounded-full ${getStatusDot(task.status)}`} />
                              <span className="text-[10px] font-semibold text-slate-700 truncate">{task.title}</span>
                            </div>
                            <span className="text-[9px] text-slate-500">{task.priority}</span>
                          </div>
                        )
                      })}
                      {dayTasks.length > 3 && (
                        <div className="text-[10px] text-teal-500 font-medium text-center">+{dayTasks.length - 3} mas</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-3 border-t-2 border-slate-100 flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-amber-500" /><span className="text-xs text-slate-600">Pendiente</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-blue-500" /><span className="text-xs text-slate-600">En Proceso</span></div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><span className="text-xs text-slate-600">Completada</span></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // --- Task Card with drag + arrows ---
  const TaskCard = ({ task, index, taskList }: { task: Task; index: number; taskList: Task[] }) => {
    const pc = priorityConfig[task.priority]
    const imageAttachments = task.attachments?.filter((a) => a.type === "image") || []
    const audioAttachments = task.attachments?.filter((a) => a.type === "audio") || []
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completada"
    const isUrgent = task.priority === "urgente"
    const isDragging = dragId === task.id

    return (
      <div
        draggable
        onDragStart={() => handleDragStart(task.id)}
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(task.id, taskList)}
        className={`transition-all duration-200 ${isDragging ? "opacity-40 scale-95" : ""}`}
      >
        <Card className={`border-l-[6px] ${pc.border} border-2 ${
          isUrgent ? "border-red-300 bg-gradient-to-r from-red-50 to-orange-50 shadow-lg " + pc.glow : "border-slate-200 bg-white"
        } hover:shadow-xl transition-all group`}>
          <CardContent className="p-0">
            <div className="flex">
              {/* Drag handle + position number */}
              <div className="flex flex-col items-center justify-center px-3 py-4 border-r-2 border-slate-100 bg-slate-50/70 gap-1 cursor-grab active:cursor-grabbing select-none">
                <GripVertical className="h-5 w-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                <span className="text-lg font-black text-slate-300 leading-none">{index + 1}</span>
                <div className="flex flex-col gap-0.5 mt-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveTask(task.id, "up", taskList) }}
                    disabled={index === 0}
                    className="h-6 w-6 rounded flex items-center justify-center hover:bg-slate-200 disabled:opacity-20 transition-colors"
                  >
                    <ArrowUp className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveTask(task.id, "down", taskList) }}
                    disabled={index === taskList.length - 1}
                    className="h-6 w-6 rounded flex items-center justify-center hover:bg-slate-200 disabled:opacity-20 transition-colors"
                  >
                    <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Task content */}
              <div className="flex-1 p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isUrgent && <Flame className="h-5 w-5 text-red-500 flex-shrink-0" />}
                      <h3 className={`font-bold text-lg ${isUrgent ? "text-red-800" : "text-slate-800"}`}>{task.title}</h3>
                      <Badge className={pc.color + " text-xs"}>{pc.label}</Badge>
                      {isOverdue && <Badge className="bg-red-100 text-red-700 border border-red-300 text-xs">Vencida</Badge>}
                    </div>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" /> Solicitado: <strong className="text-slate-700">{task.requestedBy?.name || "N/A"}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Wrench className="h-3 w-3" /> Depto: <strong className="text-slate-700">{task.requestedBy?.department || "N/A"}</strong>
                  </span>
                  {task.dueDate && (
                    <span className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-semibold" : ""}`}>
                      <CalendarIcon className="h-3 w-3" />
                      {format(new Date(task.dueDate), "dd MMM yyyy", { locale: es })}
                    </span>
                  )}
                  {task.comments && task.comments.length > 0 && (
                    <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {task.comments.length} comentarios</span>
                  )}
                </div>

                {/* Attachments inline */}
                {(imageAttachments.length > 0 || audioAttachments.length > 0) && (
                  <div className="flex flex-wrap gap-3 items-start">
                    {imageAttachments.length > 0 && (
                      <div className="flex gap-2">
                        {imageAttachments.slice(0, 4).map((att) => (
                          <div key={att.id} className="relative group/img cursor-pointer" onClick={() => setPreviewImage(att.url)}>
                            <img src={att.url} alt={att.filename} crossOrigin="anonymous"
                              className="h-16 w-16 object-cover rounded-lg border-2 border-slate-200 group-hover/img:border-blue-400 transition-colors" />
                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 rounded-lg transition-all flex items-center justify-center opacity-0 group-hover/img:opacity-100">
                              <Eye className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        ))}
                        {imageAttachments.length > 4 && (
                          <div className="h-16 w-16 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-medium border-2 border-slate-200">
                            +{imageAttachments.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                    {audioAttachments.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {audioAttachments.slice(0, 2).map((att) => (
                          <div key={att.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                            <Mic className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <audio src={att.url} controls className="h-8 max-w-[200px]" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  {task.status === "pendiente" && (
                    <Button size="sm" variant="outline" onClick={() => handleQuickStatus(task.id, "en_proceso")}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50">
                      <PlayCircle className="h-4 w-4 mr-1" /> Iniciar
                    </Button>
                  )}
                  {task.status === "en_proceso" && (
                    <Button size="sm" variant="outline" onClick={() => handleQuickStatus(task.id, "completada")}
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Completar
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => router.push(`/tarea/${task.id}`)}
                    className="text-slate-600 hover:text-slate-800">
                    <FileText className="h-4 w-4 mr-1" /> Ver Detalles
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <DashboardHeader />

      {/* Image preview modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <Button size="icon" variant="ghost" className="absolute -top-12 right-0 text-white hover:bg-white/20" onClick={() => setPreviewImage(null)}>
              <X className="h-6 w-6" />
            </Button>
            <img src={previewImage} alt="Preview" crossOrigin="anonymous" className="max-w-full max-h-[85vh] rounded-lg object-contain" />
            <a href={previewImage} download className="absolute bottom-4 right-4">
              <Button size="sm" variant="secondary" className="bg-white/90 hover:bg-white">
                <Download className="h-4 w-4 mr-2" /> Descargar
              </Button>
            </a>
          </div>
        </div>
      )}

      <main className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden"
              style={{ backgroundColor: selectedEmployee.color }}
            >
              {selectedEmployee.avatar ? (
                <img src={selectedEmployee.avatar} alt={selectedEmployee.name} crossOrigin="anonymous" className="h-full w-full object-cover" />
              ) : (
                selectedEmployee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Mis Tareas</h1>
              <p className="text-slate-500">
                {selectedEmployee.name} - {selectedEmployee.position}
                <button onClick={() => setShowSelector(true)} className="ml-2 text-teal-600 hover:underline text-sm">(cambiar)</button>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "list" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <List className="h-4 w-4" /> Lista
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  viewMode === "calendar" ? "bg-white text-teal-700 shadow-sm" : "text-slate-600 hover:text-slate-800"
                }`}
              >
                <CalendarIcon className="h-4 w-4" /> Calendario
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 text-amber-600 mx-auto mb-1" />
              <p className="text-3xl font-bold text-amber-800">{pendingTasks.length}</p>
              <p className="text-sm text-amber-600 font-medium">Pendientes</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4 text-center">
              <AlertCircle className="h-6 w-6 text-blue-600 mx-auto mb-1" />
              <p className="text-3xl font-bold text-blue-800">{inProgressTasks.length}</p>
              <p className="text-sm text-blue-600 font-medium">En Proceso</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
              <p className="text-3xl font-bold text-emerald-800">{completedTasks.length}</p>
              <p className="text-sm text-emerald-600 font-medium">Completadas</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-teal-300 bg-gradient-to-br from-teal-50 to-teal-100">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-teal-700 text-center mb-2">Progreso</p>
              <Progress value={donePercent} className="h-3 mb-1" />
              <p className="text-center text-2xl font-bold text-teal-800">{donePercent}%</p>
            </CardContent>
          </Card>
        </div>

        {viewMode === "calendar" ? (
          <EmployeeCalendar />
        ) : (
          <Tabs value={viewTab} onValueChange={setViewTab} className="space-y-4">
            <TabsList className="bg-white border-2 border-slate-200 p-1 h-auto">
              <TabsTrigger value="pendiente" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white px-6 py-2">
                Pendientes ({pendingTasks.length})
              </TabsTrigger>
              <TabsTrigger value="en_proceso" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white px-6 py-2">
                En Proceso ({inProgressTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completada" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white px-6 py-2">
                Completadas ({completedTasks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pendiente" className="space-y-3">
              {pendingTasks.length === 0 ? (
                <Card className="border-2 border-dashed border-amber-300 bg-amber-50/50">
                  <CardContent className="p-12 text-center">
                    <Clock className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-amber-700">Sin tareas pendientes</h3>
                    <p className="text-sm text-amber-600 mt-1">Excelente, no tienes tareas esperando</p>
                  </CardContent>
                </Card>
              ) : (
                pendingTasks.map((task, idx) => <TaskCard key={task.id} task={task} index={idx} taskList={pendingTasks} />)
              )}
            </TabsContent>

            <TabsContent value="en_proceso" className="space-y-3">
              {inProgressTasks.length === 0 ? (
                <Card className="border-2 border-dashed border-blue-300 bg-blue-50/50">
                  <CardContent className="p-12 text-center">
                    <AlertCircle className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-blue-700">Nada en proceso</h3>
                    <p className="text-sm text-blue-600 mt-1">Inicia una tarea pendiente para verla aqui</p>
                  </CardContent>
                </Card>
              ) : (
                inProgressTasks.map((task, idx) => <TaskCard key={task.id} task={task} index={idx} taskList={inProgressTasks} />)
              )}
            </TabsContent>

            <TabsContent value="completada" className="space-y-3">
              {completedTasks.length === 0 ? (
                <Card className="border-2 border-dashed border-emerald-300 bg-emerald-50/50">
                  <CardContent className="p-12 text-center">
                    <CheckCircle2 className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-emerald-700">Sin tareas completadas</h3>
                    <p className="text-sm text-emerald-600 mt-1">Las tareas terminadas apareceran aqui</p>
                  </CardContent>
                </Card>
              ) : (
                completedTasks.map((task, idx) => <TaskCard key={task.id} task={task} index={idx} taskList={completedTasks} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}
