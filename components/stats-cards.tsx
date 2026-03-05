"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ClipboardList, Clock, CheckCircle2, AlertCircle, TrendingUp, Users } from "lucide-react"
import type { Task } from "@/lib/types"

interface StatsCardsProps {
  tasks: Task[]
}

export function StatsCards({ tasks }: StatsCardsProps) {
  const stats = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === "pendiente").length,
    inProgress: tasks.filter((t) => t.status === "en_proceso").length,
    completed: tasks.filter((t) => t.status === "completada").length,
    urgent: tasks.filter((t) => t.priority === "urgente").length,
    assigned: tasks.filter((t) => t.assignedTo).length,
  }

  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

  const cards = [
    {
      title: "Total Tareas",
      value: stats.total,
      icon: ClipboardList,
      color: "#6366f1",
      bgGradient: "from-indigo-500 to-indigo-600",
      lightBg: "bg-indigo-50",
    },
    {
      title: "Pendientes",
      value: stats.pending,
      icon: AlertCircle,
      color: "#f59e0b",
      bgGradient: "from-amber-500 to-amber-600",
      lightBg: "bg-amber-50",
    },
    {
      title: "En Proceso",
      value: stats.inProgress,
      icon: Clock,
      color: "#3b82f6",
      bgGradient: "from-blue-500 to-blue-600",
      lightBg: "bg-blue-50",
    },
    {
      title: "Completadas",
      value: stats.completed,
      icon: CheckCircle2,
      color: "#10b981",
      bgGradient: "from-emerald-500 to-emerald-600",
      lightBg: "bg-emerald-50",
    },
    {
      title: "Urgentes",
      value: stats.urgent,
      icon: TrendingUp,
      color: "#ef4444",
      bgGradient: "from-red-500 to-red-600",
      lightBg: "bg-red-50",
    },
    {
      title: "Eficiencia",
      value: `${completionRate}%`,
      icon: Users,
      color: "#8b5cf6",
      bgGradient: "from-violet-500 to-violet-600",
      lightBg: "bg-violet-50",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.title}
            className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <div className={`h-1.5 bg-gradient-to-r ${card.bgGradient}`} />
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${card.lightBg}`}>
                  <Icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
              </div>
              <div className="text-3xl font-black" style={{ color: card.color }}>
                {card.value}
              </div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">{card.title}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
