"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Task, TaskStatus } from "@/lib/types"
import { Clock, AlertCircle, CheckCircle2, XCircle, User } from "lucide-react"

interface KanbanViewProps {
  tasks: Task[]
  onTaskClick: (taskId: string) => void
}

export function KanbanView({ tasks, onTaskClick }: KanbanViewProps) {
  const columns: { status: TaskStatus; title: string; icon: any; color: string }[] = [
    { status: "pendiente", title: "Pendientes", icon: Clock, color: "text-yellow-600" },
    { status: "en_proceso", title: "En Proceso", icon: AlertCircle, color: "text-blue-600" },
    { status: "completada", title: "Completadas", icon: CheckCircle2, color: "text-green-600" },
    { status: "cancelada", title: "Canceladas", icon: XCircle, color: "text-gray-600" },
  ]

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((task) => task.status === status)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgente":
        return "destructive"
      case "alta":
        return "destructive"
      case "media":
        return "default"
      case "baja":
        return "secondary"
      default:
        return "default"
    }
  }

  const formatPriority = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.status)
        const Icon = column.icon

        return (
          <Card key={column.status} className="flex flex-col border-2">
            <CardHeader className="pb-3 bg-gradient-to-br from-purple-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${column.color}`} />
                  <CardTitle className="text-base">{column.title}</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-white">
                  {columnTasks.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 space-y-3 pt-0">
              {columnTasks.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">No hay tareas</div>
              ) : (
                columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-white border-2 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all hover:border-purple-300"
                    onClick={() => onTaskClick(task.id)}
                  >
                    <h4 className="font-semibold text-sm mb-2 line-clamp-2">{task.title}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                        {formatPriority(task.priority)}
                      </Badge>
                      <span className="text-xs text-muted-foreground capitalize">{task.category}</span>
                    </div>
                    {task.assignedTo ? (
                      <div className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200">
                        <User className="h-3 w-3" />
                        <span>{task.assignedTo.name}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-orange-700 bg-orange-50 px-2 py-1 rounded border border-orange-200">
                        ⚠️ Sin asignar
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        Vence: {new Date(task.dueDate).toLocaleDateString("es-ES")}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
