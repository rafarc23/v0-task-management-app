"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getArchivedTasks, archiveOldTasks } from "@/lib/task-storage"
import { getEmployees } from "@/lib/employee-storage"
import type { Task } from "@/lib/types"
import {
  Archive, Search, User, Calendar, ChevronRight,
  Filter, RefreshCw, FolderArchive, CheckCircle2
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

export default function ArchivoPage() {
  return (
    <AuthGuard>
      <ArchivoContent />
    </AuthGuard>
  )
}

function ArchivoContent() {
  const router = useRouter()
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterEmployee, setFilterEmployee] = useState("all")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterYear, setFilterYear] = useState("all")
  const employees = getEmployees()

  useEffect(() => {
    archiveOldTasks()
    setArchivedTasks(getArchivedTasks())
  }, [])

  const handleForceArchive = () => {
    const result = archiveOldTasks()
    setArchivedTasks(getArchivedTasks())
  }

  const years = Array.from(new Set(archivedTasks.map((t) => new Date(t.completedAt || t.createdAt).getFullYear()))).sort((a, b) => b - a)
  const categories = Array.from(new Set(archivedTasks.map((t) => t.category)))

  const filtered = archivedTasks.filter((t) => {
    const matchSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchEmp = filterEmployee === "all" || t.assignedTo?.id === filterEmployee
    const matchCat = filterCategory === "all" || t.category === filterCategory
    const matchYear = filterYear === "all" || new Date(t.completedAt || t.createdAt).getFullYear().toString() === filterYear
    return matchSearch && matchEmp && matchCat && matchYear
  })

  // Group by month
  const grouped: Record<string, Task[]> = {}
  filtered.forEach((t) => {
    const date = new Date(t.completedAt || t.createdAt)
    const key = format(date, "MMMM yyyy", { locale: es })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(t)
  })

  const getEmployeeColor = (id?: string) => {
    if (!id) return "#9ca3af"
    return employees.find((e) => e.id === id)?.color || "#9ca3af"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-stone-50 to-amber-50">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Archive className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800">Archivo Historico</h1>
              <p className="text-slate-500">Tareas completadas hace mas de 30 dias</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-sm px-3 py-1">
              <FolderArchive className="h-4 w-4 mr-1" />
              {archivedTasks.length} tareas archivadas
            </Badge>
            <Button variant="outline" size="sm" onClick={handleForceArchive} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Actualizar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-800">Filtros de busqueda</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar en archivo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-2"
                />
              </div>
              <Select value={filterEmployee} onValueChange={setFilterEmployee}>
                <SelectTrigger className="bg-white border-2">
                  <User className="h-4 w-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Empleado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los empleados</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="bg-white border-2">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="bg-white border-2">
                  <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los anos</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Grouped tasks */}
        {Object.keys(grouped).length === 0 ? (
          <Card className="border-2 border-dashed border-amber-300 bg-amber-50/50">
            <CardContent className="py-16 text-center">
              <FolderArchive className="h-16 w-16 text-amber-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-600 mb-2">Archivo vacio</h3>
              <p className="text-slate-400 max-w-md mx-auto">
                Las tareas completadas se archivan automaticamente despues de 30 dias. Aqui se guardara el historico completo.
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(grouped).map(([month, tasks]) => (
            <div key={month} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-lg font-bold text-slate-700 capitalize">{month}</h2>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">{tasks.length} tareas</Badge>
              </div>

              <div className="space-y-2">
                {tasks.map((task) => {
                  const empColor = getEmployeeColor(task.assignedTo?.id)
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 bg-white hover:shadow-md hover:border-amber-300 cursor-pointer transition-all group"
                      onClick={() => router.push(`/tarea/${task.id}`)}
                    >
                      <div className="w-1.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: empColor }} />
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 truncate">{task.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>{task.assignedTo?.name || "Sin asignar"}</span>
                          <span>-</span>
                          <span className="capitalize">{task.category}</span>
                          {task.completedAt && (
                            <>
                              <span>-</span>
                              <span>Completada {format(new Date(task.completedAt), "dd MMM yyyy", { locale: es })}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}
