"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Task } from "@/lib/types"
import { getEmployees } from "@/lib/employee-storage"
import { ChevronLeft, ChevronRight, Image, Mic, Paperclip } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay } from "date-fns"
import { es } from "date-fns/locale"

interface CalendarViewProps {
  tasks: Task[]
  onTaskClick: (taskId: string) => void
  selectedEmployee?: string
}

export function CalendarView({ tasks, onTaskClick, selectedEmployee }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const employees = getEmployees()

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const firstDayOfWeek = getDay(monthStart)
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getEmployeeColor = (employeeId: string): string => {
    const emp = employees.find((e) => e.id === employeeId)
    return emp?.color || "#9ca3af"
  }

  const getEmployeeName = (employeeId: string): string => {
    const emp = employees.find((e) => e.id === employeeId)
    return emp?.name || "Desconocido"
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false
      const dateMatches = isSameDay(new Date(task.dueDate), date)
      if (selectedEmployee) {
        return dateMatches && task.assignedTo?.id === selectedEmployee
      }
      return dateMatches
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completada":
        return "✓"
      case "en_proceso":
        return "▶"
      case "pendiente":
        return "○"
      case "cancelada":
        return "✕"
      default:
        return "○"
    }
  }

  const allAssignedEmployees = Array.from(
    new Set(tasks.filter((t) => t.assignedTo).map((t) => t.assignedTo!.id))
  )

  return (
    <Card className="border-2 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl capitalize text-white">
              {format(currentDate, "MMMM yyyy", { locale: es })}
            </CardTitle>
            {selectedEmployee && (
              <p className="text-indigo-100 text-sm mt-1">
                Tareas de: {getEmployeeName(selectedEmployee)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={goToToday}
              className="bg-white/20 text-white hover:bg-white/30 border-0"
            >
              Hoy
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={previousMonth}
              className="bg-white/20 text-white hover:bg-white/30 border-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={nextMonth}
              className="bg-white/20 text-white hover:bg-white/30 border-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-7 gap-1">
          {["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-bold text-indigo-600 uppercase tracking-wider py-3 border-b-2 border-indigo-100"
            >
              {day}
            </div>
          ))}

          {Array.from({ length: adjustedFirstDay }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[120px] bg-gray-50/50 rounded-lg m-0.5" />
          ))}

          {daysInMonth.map((day) => {
            const dayTasks = getTasksForDate(day)
            const isCurrentDay = isToday(day)
            const isWeekend = getDay(day) === 0 || getDay(day) === 6

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] rounded-lg m-0.5 transition-all ${
                  isCurrentDay
                    ? "bg-indigo-50 ring-2 ring-indigo-500 shadow-md"
                    : isWeekend
                      ? "bg-slate-50 border border-slate-200"
                      : "bg-white border-2 border-gray-100 hover:border-indigo-200 hover:shadow-sm"
                } ${dayTasks.length > 0 ? "shadow-sm" : ""}`}
              >
                <div className="h-full flex flex-col p-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-bold inline-flex items-center justify-center w-7 h-7 rounded-full ${
                        isCurrentDay
                          ? "bg-indigo-600 text-white"
                          : isWeekend
                            ? "text-slate-400"
                            : "text-gray-700"
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {dayTasks.length > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] h-5 px-1.5 bg-indigo-100 text-indigo-700"
                      >
                        {dayTasks.length}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 space-y-1 overflow-y-auto">
                    {dayTasks.slice(0, 4).map((task) => {
                      const empColor = task.assignedTo
                        ? getEmployeeColor(task.assignedTo.id)
                        : "#9ca3af"
                      const hasAttachments = task.attachments && task.attachments.length > 0
                      const hasImages = task.attachments?.some((a) => a.type === "image")
                      const hasAudio = task.attachments?.some((a) => a.type === "audio")

                      return (
                        <div
                          key={task.id}
                          className="rounded-md cursor-pointer hover:opacity-90 transition-all hover:scale-[1.02] px-1.5 py-1"
                          style={{
                            backgroundColor: `${empColor}18`,
                            borderLeft: `3px solid ${empColor}`,
                          }}
                          onClick={() => onTaskClick(task.id)}
                          title={`${task.title} - ${task.assignedTo ? task.assignedTo.name : "Sin asignar"}`}
                        >
                          <div className="flex items-center gap-1">
                            <span className="text-[10px]" style={{ color: empColor }}>
                              {getStatusIcon(task.status)}
                            </span>
                            <span
                              className="text-[11px] font-semibold truncate flex-1"
                              style={{ color: empColor }}
                            >
                              {task.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span
                              className="text-[9px] truncate flex-1"
                              style={{ color: `${empColor}cc` }}
                            >
                              {task.assignedTo ? task.assignedTo.name : "Sin asignar"}
                            </span>
                            {hasAttachments && (
                              <div className="flex items-center gap-0.5">
                                {hasImages && (
                                  <Image className="h-2.5 w-2.5" style={{ color: empColor }} />
                                )}
                                {hasAudio && (
                                  <Mic className="h-2.5 w-2.5" style={{ color: empColor }} />
                                )}
                                {!hasImages && !hasAudio && (
                                  <Paperclip className="h-2.5 w-2.5" style={{ color: empColor }} />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {dayTasks.length > 4 && (
                      <div className="text-[10px] text-indigo-500 font-medium text-center py-0.5">
                        +{dayTasks.length - 4} mas
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t-2 border-gray-100">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Empleados</p>
              <div className="flex flex-wrap gap-2">
                {allAssignedEmployees.map((empId) => {
                  const color = getEmployeeColor(empId)
                  const name = getEmployeeName(empId)
                  return (
                    <div key={empId} className="flex items-center gap-1.5">
                      <div
                        className="w-3 h-3 rounded-full ring-1 ring-gray-200"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-medium text-gray-600">{name}</span>
                    </div>
                  )
                })}
                {allAssignedEmployees.length === 0 && (
                  <span className="text-xs text-gray-400">No hay tareas asignadas</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Estado</p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">○</span>
                  <span className="text-xs text-gray-600">Pendiente</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">▶</span>
                  <span className="text-xs text-gray-600">En Proceso</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">✓</span>
                  <span className="text-xs text-gray-600">Completada</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
