"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getTasks, updateTask } from "@/lib/task-storage"
import { getEmployees } from "@/lib/employee-storage"
import type { Task, Employee } from "@/lib/types"
import {
  Clock, CheckCircle2, AlertCircle, ArrowRight, Calendar as CalendarIcon,
  User, MessageSquare, Image as ImageIcon, Mic, Wrench,
  PlayCircle, FileText, Eye, Download, X, ChevronDown, ChevronLeft, ChevronRight,
  List, LayoutGrid, GripVertical, ArrowUp, ArrowDown, Flame
} from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from "date-fns"
import { es } from "date-fns/locale"

const PRIORITY_ORDER: Record<string, number> = { urgente: 0, alta: 1, media: 2, baja: 3 }

function sortByPriority(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // First by custom order if set, then by priority
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
  const [myTasks, setMyTasks] = useState<Task[]>([])
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list")
  const [viewTab, setViewTab] = useState("pendiente")
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [showSelector, setShowSelector] = useState(false)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [dragId, setDragId] = useState<string | null>(null)

  useEffect(() => {
    const emps = getEmployees().filter((e) => e.isActive)
    setEmployees(emps)
    if (user?.employeeId) {
      const found = emps.find((e) => e.id === user.employeeId)
      if (found) setSelectedEmployee(found)
      else setShowSelector(true)
    } else {
      setShowSelector(true)
    }
  }, [user])

  const loadTasks = useCallback(() => {
    if (!selectedEmployee) return
    const all = getTasks()
    const mine = all.filter((t) => t.assignedTo?.name === selectedEmployee.name)
    setMyTasks(mine)
  }, [selectedEmployee])

  useEffect(() => {
    loadTasks()
    const interval = setInterval(loadTasks, 3000)
    return () => clearInterval(interval)
  }, [loadTasks])

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

  const handleQuickStatus = (taskId: string, newStatus: "en_proceso" | "completada") => {
    updateTask(taskId, { status: newStatus })
    loadTasks()
  }

  const moveTask = (taskId: string, direction: "up" | "down", taskList: Task[]) => {
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
    newList.forEach((t, i) => {
      updateTask(t.id, { order: i } as Partial<Task>)
    })
    loadTasks()
  }

  // Drag and drop handlers
  const handleDragStart = (taskId: string) => {
    setDragId(taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (targetId: string, taskList: Task[]) => {
    if (!dragId || dragId === targetId) { setDragId(null); return }
    const fromIdx = taskList.findIndex((t) => t.id === dragId)
    const toIdx = taskList.findIndex((t) => t.id === targetId)
    if (fromIdx < 0 || toIdx < 0) { setDragId(null); return }

    const newList = [...taskList]
    const [moved] = newList.splice(fromIdx, 1)
    newList.splice(toIdx, 0, moved)

    newList.forEach((t, i) => {
      updateTask(t.id, { order: i } as Partial<Task>)
    })
    setDragId(null)
    loadTasks()
  }

  const priorityConfig: Record<string, { label: string; color: string; border: string; bg: string; glow: string }> = {
    urgente: { label: "URGENTE", color: "bg-red-600 text-white", border: "border-l-red-600", bg: "bg-red-50", glow: "shadow-red-200" },
    alta: { label: "ALTA", color: "bg-orange-500 text-white", border: "border-l-orange-500", bg: "bg-orange-50", glow: "shadow-orange-200" },
    media: { label: "MEDIA", color: "bg-blue-500 text-white", border: "border-l-blue-500", bg: "bg-blue-50", glow: "shadow-blue-100" },
    baja: { label: "BAJA", color: "bg-slate-400 text-white", border: "border-l-slate-400", bg: "bg-slate-50", glow: "shadow-slate-100" },
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
              {employees.map((emp) => (
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
              {employees.length === 0 && (
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
          isUrgent ? "border-red-300 bg-gradient-to-r from-red-50 to-orange-50 shadow-lg " + pc.glow + " animate-pulse-subtle" :
          "border-slate-200 bg-white"
        } hover:shadow-xl transition-all group`}>
          <CardContent className="p-0">
            {/* Priority number badge */}
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
                  {task.comments.length > 0 && (
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
                            <img src={att.url} alt={att.filename} crossOrigin="anonymous" className="h-20 w-20 object-cover rounded-xl border-2 border-slate-200 group-hover/img:border-blue-400 transition-all shadow-sm" />
                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 rounded-xl transition-all flex items-center justify-center">
                              <Eye className="h-4 w-4 text-white opacity-0 group-hover/img:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        ))}
                        {imageAttachments.length > 4 && (
                          <div className="h-20 w-20 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-500">+{imageAttachments.length - 4}</span>
                          </div>
                        )}
                      </div>
                    )}
                    {audioAttachments.length > 0 && (
                      <div className="flex-1 min-w-[200px]">
                        {audioAttachments.slice(0, 2).map((att) => (
                          <div key={att.id} className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-xl p-2 mb-1">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
                              <Mic className="h-3.5 w-3.5 text-white" />
                            </div>
                            <audio controls src={att.url} className="flex-1 h-7" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  {task.status === "pendiente" && (
                    <Button size="sm" onClick={() => handleQuickStatus(task.id, "en_proceso")} className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs">
                      <PlayCircle className="h-3 w-3 mr-1" /> Comenzar
                    </Button>
                  )}
                  {task.status === "en_proceso" && (
                    <Button size="sm" onClick={() => handleQuickStatus(task.id, "completada")} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Completar
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => router.push(`/tarea/${task.id}`)} className="text-xs">
                    Ver Detalle <ArrowRight className="h-3 w-3 ml-1" />
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

      {previewImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="Preview" crossOrigin="anonymous" className="max-h-[85vh] rounded-xl shadow-2xl" />
            <div className="flex gap-2 justify-center mt-3">
              <a href={previewImage} download className="px-4 py-2 rounded-lg bg-white text-slate-800 text-sm font-medium hover:bg-slate-100 flex items-center gap-2">
                <Download className="h-4 w-4" /> Descargar
              </a>
              <button onClick={() => setPreviewImage(null)} className="px-4 py-2 rounded-lg bg-white/20 text-white text-sm font-medium hover:bg-white/30 flex items-center gap-2">
                <X className="h-4 w-4" /> Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto p-6 space-y-6">
        {/* Profile header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg overflow-hidden" style={{ backgroundColor: selectedEmployee.color }}>
              {selectedEmployee.avatar ? (
                <img src={selectedEmployee.avatar} alt={selectedEmployee.name} crossOrigin="anonymous" className="h-full w-full object-cover" />
              ) : (
                selectedEmployee.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{selectedEmployee.name}</h1>
              <p className="text-slate-500 text-sm">{selectedEmployee.position} - {selectedEmployee.department}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowSelector(true)} className="text-sm gap-2">
            <ChevronDown className="h-4 w-4" /> Cambiar Operario
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-2 border-slate-200 bg-white">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center flex-shrink-0">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div><p className="text-2xl font-bold text-slate-800">{totalTasks}</p><p className="text-xs text-slate-500">Total</p></div>
            </CardContent>
          </Card>
          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div><p className="text-2xl font-bold text-amber-800">{pendingTasks.length}</p><p className="text-xs text-amber-600">Pendientes</p></div>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div><p className="text-2xl font-bold text-blue-800">{inProgressTasks.length}</p><p className="text-xs text-blue-600">En Proceso</p></div>
            </CardContent>
          </Card>
          <Card className="border-2 border-emerald-200 bg-emerald-50">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div><p className="text-2xl font-bold text-emerald-800">{completedTasks.length}</p><p className="text-xs text-emerald-600">Completadas</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Progress */}
        <Card className="border-2 border-slate-200 bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-700">Mi rendimiento</p>
              <p className="text-sm font-bold text-emerald-600">{donePercent}% completado</p>
            </div>
            <Progress value={donePercent} className="h-3" />
          </CardContent>
        </Card>

        {/* View toggle */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
            >
              <List className="h-4 w-4 mr-2" /> Lista de Tareas
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className={viewMode === "calendar" ? "bg-teal-600 hover:bg-teal-700 text-white" : ""}
            >
              <CalendarIcon className="h-4 w-4 mr-2" /> Calendario
            </Button>
          </div>
          {viewMode === "list" && (
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <GripVertical className="h-3.5 w-3.5" /> Arrastra o usa las flechas para reordenar tus tareas
            </p>
          )}
        </div>

        {viewMode === "calendar" ? (
          <EmployeeCalendar />
        ) : (
          <Tabs value={viewTab} onValueChange={setViewTab}>
            <TabsList className="bg-white border-2 border-slate-200 p-1 h-auto">
              <TabsTrigger value="pendiente" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white gap-2">
                <Clock className="h-4 w-4" /> Pendientes
                <Badge className="bg-amber-100 text-amber-800 ml-1">{pendingTasks.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="en_proceso" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white gap-2">
                <AlertCircle className="h-4 w-4" /> En Proceso
                <Badge className="bg-blue-100 text-blue-800 ml-1">{inProgressTasks.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="completada" className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white gap-2">
                <CheckCircle2 className="h-4 w-4" /> Completadas
                <Badge className="bg-emerald-100 text-emerald-800 ml-1">{completedTasks.length}</Badge>
              </TabsTrigger>
            </TabsList>

            {(["pendiente", "en_proceso", "completada"] as const).map((status) => {
              const statusTasks = status === "pendiente" ? pendingTasks : status === "en_proceso" ? inProgressTasks : completedTasks
              const emptyConfig = {
                pendiente: { icon: Clock, text: "No tienes tareas pendientes", bg: "bg-amber-50", border: "border-amber-200", textColor: "text-amber-400" },
                en_proceso: { icon: AlertCircle, text: "No tienes tareas en proceso", bg: "bg-blue-50", border: "border-blue-200", textColor: "text-blue-400" },
                completada: { icon: CheckCircle2, text: "Aun no has completado tareas", bg: "bg-emerald-50", border: "border-emerald-200", textColor: "text-emerald-400" },
              }
              const ec = emptyConfig[status]
              return (
                <TabsContent key={status} value={status} className="mt-4 space-y-3">
                  {statusTasks.length === 0 ? (
                    <Card className={`border-2 border-dashed ${ec.border} ${ec.bg}`}>
                      <CardContent className="p-10 text-center">
                        <ec.icon className={`h-10 w-10 ${ec.textColor} mx-auto mb-3`} />
                        <p className={`text-sm ${ec.textColor} font-medium`}>{ec.text}</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Instructional banner for active tasks */}
                      {status !== "completada" && (
                        <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-xl p-4">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <Flame className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-indigo-800">Ordenadas por urgencia</p>
                            <p className="text-xs text-indigo-600">Realiza las tareas de arriba hacia abajo. Puedes arrastrar o usar las flechas para reorganizar.</p>
                          </div>
                        </div>
                      )}
                      {statusTasks.map((t, i) => (
                        <TaskCard key={t.id} task={t} index={i} taskList={statusTasks} />
                      ))}
                    </>
                  )}
                </TabsContent>
              )
            })}
          </Tabs>
        )}
      </main>
    </div>
  )
}
