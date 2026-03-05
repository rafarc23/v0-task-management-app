"use client"

import { useEffect, useState } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getTasks } from "@/lib/task-storage"
import { getEmployees } from "@/lib/employee-storage"
import type { Task, Employee } from "@/lib/types"
import {
  BarChart3,
  TrendingUp,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  Calendar as CalendarIcon,
  CalendarClock,
  Users,
  Layers,
  Zap,
} from "lucide-react"
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
  isWithinInterval,
  format,
  subWeeks,
  addWeeks,
  subMonths,
  addMonths,
  subYears,
  addYears,
  subDays,
  addDays,
  differenceInDays,
} from "date-fns"
import { es } from "date-fns/locale"

type PeriodMode = "day" | "week" | "month" | "year"

export default function InformesPage() {
  return (
    <AuthGuard requireAdmin>
      <InformesContent />
    </AuthGuard>
  )
}

function InformesContent() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [periodMode, setPeriodMode] = useState<PeriodMode>("week")
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    setTasks(getTasks())
    setEmployees(getEmployees())
  }, [])

  // Reset offset when switching modes
  const handleModeChange = (mode: PeriodMode) => {
    setPeriodMode(mode)
    setOffset(0)
  }

  const getDateRange = () => {
    const now = new Date()
    let start: Date
    let end: Date

    switch (periodMode) {
      case "day": {
        const target = offset === 0 ? now : offset > 0 ? addDays(now, offset) : subDays(now, Math.abs(offset))
        start = startOfDay(target)
        end = endOfDay(target)
        break
      }
      case "week": {
        const target = offset === 0 ? now : offset > 0 ? addWeeks(now, offset) : subWeeks(now, Math.abs(offset))
        start = startOfWeek(target, { weekStartsOn: 1 })
        end = endOfWeek(target, { weekStartsOn: 1 })
        break
      }
      case "month": {
        const target = offset === 0 ? now : offset > 0 ? addMonths(now, offset) : subMonths(now, Math.abs(offset))
        start = startOfMonth(target)
        end = endOfMonth(target)
        break
      }
      case "year": {
        const target = offset === 0 ? now : offset > 0 ? addYears(now, offset) : subYears(now, Math.abs(offset))
        start = startOfYear(target)
        end = endOfYear(target)
        break
      }
    }

    return { start, end }
  }

  const getPreviousRange = () => {
    const { start, end } = getDateRange()
    const duration = differenceInDays(end, start) + 1
    return {
      start: subDays(start, duration),
      end: subDays(end, duration),
    }
  }

  const { start, end } = getDateRange()
  const prev = getPreviousRange()

  const filterByRange = (t: Task, s: Date, e: Date) => {
    if (t.status !== "completada") return false
    const completedDate = t.completedAt ? new Date(t.completedAt) : null
    if (completedDate && isWithinInterval(completedDate, { start: s, end: e })) return true
    return false
  }

  const completedTasks = tasks.filter((t) => filterByRange(t, start, end))
  const previousCompleted = tasks.filter((t) => filterByRange(t, prev.start, prev.end))

  const allPeriodTasks = tasks.filter((t) => {
    const created = new Date(t.createdAt)
    return isWithinInterval(created, { start, end })
  })

  const pctChange =
    previousCompleted.length > 0
      ? ((completedTasks.length - previousCompleted.length) / previousCompleted.length) * 100
      : completedTasks.length > 0
        ? 100
        : 0

  // Stats by department
  const byDepartment = completedTasks.reduce(
    (acc, task) => {
      const dept = task.requesterDepartment || task.requestedBy?.department || "Sin departamento"
      if (!acc[dept]) acc[dept] = { total: 0, infraestructura: 0, ti: 0, urgente: 0, alta: 0, media: 0, baja: 0 }
      acc[dept].total++
      if (task.category === "infraestructura") acc[dept].infraestructura++
      if (task.category === "ti") acc[dept].ti++
      acc[dept][task.priority]++
      return acc
    },
    {} as Record<string, Record<string, number>>,
  )

  // Stats by employee
  const byEmployee: Record<string, { total: number; color: string }> = {}
  completedTasks.forEach((t) => {
    if (t.assignedTo) {
      if (!byEmployee[t.assignedTo.name]) {
        const emp = employees.find((e) => e.id === t.assignedTo?.id)
        byEmployee[t.assignedTo.name] = { total: 0, color: emp?.color || "#6366f1" }
      }
      byEmployee[t.assignedTo.name].total++
    }
  })

  // Stats by priority
  const byPriority = {
    urgente: completedTasks.filter((t) => t.priority === "urgente").length,
    alta: completedTasks.filter((t) => t.priority === "alta").length,
    media: completedTasks.filter((t) => t.priority === "media").length,
    baja: completedTasks.filter((t) => t.priority === "baja").length,
  }

  // Stats by category
  const byCategory = {
    infraestructura: completedTasks.filter((t) => t.category === "infraestructura").length,
    ti: completedTasks.filter((t) => t.category === "ti").length,
    mantenimiento: completedTasks.filter((t) => t.category === "mantenimiento").length,
    otro: completedTasks.filter((t) => t.category === "otro").length,
  }

  // Avg completion
  const avgDays =
    completedTasks.length > 0
      ? Math.round(
          completedTasks.reduce((sum, t) => {
            const created = new Date(t.createdAt).getTime()
            const completed = t.completedAt ? new Date(t.completedAt).getTime() : Date.now()
            return sum + (completed - created) / (1000 * 60 * 60 * 24)
          }, 0) / completedTasks.length,
        )
      : 0

  const getPeriodLabel = () => {
    switch (periodMode) {
      case "day":
        return format(start, "EEEE d 'de' MMMM yyyy", { locale: es })
      case "week":
        return `${format(start, "d MMM", { locale: es })} - ${format(end, "d MMM yyyy", { locale: es })}`
      case "month":
        return format(start, "MMMM yyyy", { locale: es })
      case "year":
        return format(start, "yyyy", { locale: es })
    }
  }

  const modeButtons: { mode: PeriodMode; label: string; icon: React.ReactNode }[] = [
    { mode: "day", label: "Dia", icon: <CalendarClock className="h-4 w-4" /> },
    { mode: "week", label: "Semana", icon: <CalendarDays className="h-4 w-4" /> },
    { mode: "month", label: "Mes", icon: <CalendarRange className="h-4 w-4" /> },
    { mode: "year", label: "Ano", icon: <CalendarIcon className="h-4 w-4" /> },
  ]

  const maxBarValue = Math.max(...Object.values(byEmployee).map((v) => v.total), 1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-4xl font-bold text-slate-900">Informes y Analisis</h2>
          <p className="text-muted-foreground mt-1">Estadisticas detalladas de tareas completadas</p>
        </div>

        {/* Period Controls */}
        <Card className="border-2 border-indigo-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Mode tabs */}
              <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                {modeButtons.map(({ mode, label, icon }) => (
                  <button
                    key={mode}
                    onClick={() => handleModeChange(mode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      periodMode === mode
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-slate-600 hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" className="border-2" onClick={() => setOffset((o) => o - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-[220px] text-center">
                  <p className="text-lg font-bold text-slate-900 capitalize">{getPeriodLabel()}</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-2"
                  onClick={() => setOffset((o) => o + 1)}
                  disabled={offset >= 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {offset !== 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setOffset(0)} className="text-indigo-600 font-medium">
                    Hoy
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-5 w-5 text-indigo-600" />
                <div className="flex items-center text-xs">
                  {pctChange >= 0 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">+{pctChange.toFixed(0)}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 text-red-600" />
                      <span className="text-red-600 font-semibold">{pctChange.toFixed(0)}%</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-3xl font-bold text-indigo-900">{completedTasks.length}</p>
              <p className="text-xs text-indigo-700 mt-1">Completadas</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Layers className="h-5 w-5 text-amber-600" />
              </div>
              <p className="text-3xl font-bold text-amber-900">{allPeriodTasks.length}</p>
              <p className="text-xs text-amber-700 mt-1">Creadas en el periodo</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-emerald-900">{avgDays} dias</p>
              <p className="text-xs text-emerald-700 mt-1">Tiempo medio resolucion</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Zap className="h-5 w-5 text-rose-600" />
              </div>
              <p className="text-3xl font-bold text-rose-900">{byPriority.urgente + byPriority.alta}</p>
              <p className="text-xs text-rose-700 mt-1">Urgentes / Altas resueltas</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Employee - visual bar chart */}
          <Card className="border-2 border-indigo-200 shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-lg text-indigo-900">Rendimiento por Empleado</CardTitle>
              </div>
              <CardDescription>Tareas completadas por cada miembro</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              {Object.keys(byEmployee).length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No hay datos para este periodo</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(byEmployee)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([name, data], idx) => (
                      <div key={name}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color }} />
                            <span className="text-sm font-medium text-slate-800">{name}</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: data.color }}>
                            {data.total}
                          </span>
                        </div>
                        <div className="h-6 rounded-md bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                            style={{
                              width: `${Math.max((data.total / maxBarValue) * 100, 8)}%`,
                              backgroundColor: data.color,
                            }}
                          >
                            {data.total > 0 && (
                              <span className="text-xs font-bold text-white">{data.total}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* By Department */}
          <Card className="border-2 border-purple-200 shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg text-purple-900">Por Departamento Solicitante</CardTitle>
              </div>
              <CardDescription>Tareas resueltas para cada departamento</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              {Object.keys(byDepartment).length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No hay datos para este periodo</p>
              ) : (
                <div className="space-y-4">
                  {Object.entries(byDepartment)
                    .sort((a, b) => (b[1] as any).total - (a[1] as any).total)
                    .map(([dept, stats]: [string, any]) => (
                      <div key={dept} className="rounded-lg border-2 border-slate-200 p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-slate-800">{dept}</h4>
                          <Badge className="bg-purple-600 text-white text-lg px-3">{stats.total}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between bg-red-50 rounded p-2 border border-red-100">
                            <span className="text-red-700">Urgente</span>
                            <span className="font-bold text-red-600">{stats.urgente}</span>
                          </div>
                          <div className="flex justify-between bg-orange-50 rounded p-2 border border-orange-100">
                            <span className="text-orange-700">Alta</span>
                            <span className="font-bold text-orange-600">{stats.alta}</span>
                          </div>
                          <div className="flex justify-between bg-blue-50 rounded p-2 border border-blue-100">
                            <span className="text-blue-700">Infraestructura</span>
                            <span className="font-bold text-blue-600">{stats.infraestructura}</span>
                          </div>
                          <div className="flex justify-between bg-cyan-50 rounded p-2 border border-cyan-100">
                            <span className="text-cyan-700">TI</span>
                            <span className="font-bold text-cyan-600">{stats.ti}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Priority and Category */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority */}
          <Card className="border-2 border-rose-200 shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-r from-rose-50 to-orange-50 border-b">
              <CardTitle className="text-lg text-rose-900">Distribucion por Prioridad</CardTitle>
              <CardDescription>Tareas completadas segun nivel de urgencia</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "urgente", label: "Urgente", count: byPriority.urgente, bg: "bg-red-50", border: "border-red-200", text: "text-red-700", value: "text-red-600" },
                  { key: "alta", label: "Alta", count: byPriority.alta, bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", value: "text-orange-600" },
                  { key: "media", label: "Media", count: byPriority.media, bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", value: "text-amber-600" },
                  { key: "baja", label: "Baja", count: byPriority.baja, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", value: "text-blue-600" },
                ].map((p) => (
                  <div key={p.key} className={`rounded-lg p-4 ${p.bg} border-2 ${p.border}`}>
                    <p className={`text-sm font-medium ${p.text}`}>{p.label}</p>
                    <p className={`text-3xl font-bold ${p.value} mt-1`}>{p.count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category */}
          <Card className="border-2 border-teal-200 shadow-sm">
            <CardHeader className="pb-3 bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
              <CardTitle className="text-lg text-teal-900">Distribucion por Categoria</CardTitle>
              <CardDescription>Tipo de trabajo realizado</CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "infraestructura", label: "Infraestructura", count: byCategory.infraestructura, bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", value: "text-blue-600" },
                  { key: "ti", label: "TI", count: byCategory.ti, bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", value: "text-cyan-600" },
                  { key: "mantenimiento", label: "Mantenimiento", count: byCategory.mantenimiento, bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", value: "text-emerald-600" },
                  { key: "otro", label: "Otros", count: byCategory.otro, bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", value: "text-slate-600" },
                ].map((c) => (
                  <div key={c.key} className={`rounded-lg p-4 ${c.bg} border-2 ${c.border}`}>
                    <p className={`text-sm font-medium ${c.text}`}>{c.label}</p>
                    <p className={`text-3xl font-bold ${c.value} mt-1`}>{c.count}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Completed tasks table */}
        <Card className="border-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-indigo-50 border-b">
            <CardTitle className="text-lg text-slate-900">Tareas Completadas en el Periodo</CardTitle>
            <CardDescription>{completedTasks.length} tareas resueltas</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {completedTasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">No hay tareas completadas en este periodo</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {completedTasks.map((task) => {
                  const emp = employees.find((e) => e.id === task.assignedTo?.id)
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border-2 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                    >
                      <div
                        className="w-1 h-10 rounded-full flex-shrink-0"
                        style={{ backgroundColor: emp?.color || "#94a3b8" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {task.assignedTo?.name || "Sin asignar"}
                          </span>
                          <span className="text-xs text-muted-foreground">-</span>
                          <span className="text-xs text-muted-foreground">
                            {task.completedAt ? format(new Date(task.completedAt), "d MMM", { locale: es }) : ""}
                          </span>
                        </div>
                      </div>
                      <Badge
                        className={
                          task.priority === "urgente"
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : task.priority === "alta"
                              ? "bg-orange-100 text-orange-700 border border-orange-200"
                              : task.priority === "media"
                                ? "bg-amber-100 text-amber-700 border border-amber-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                        }
                      >
                        {task.priority}
                      </Badge>
                      <Badge className="bg-slate-100 text-slate-600 border border-slate-200 text-xs">
                        {task.category}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
