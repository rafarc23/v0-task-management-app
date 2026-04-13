"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useProjects, useEmployees, useCreateProject, useDeleteProject } from "@/lib/hooks/use-data"
import type { Project, TaskPriority } from "@/lib/types"
import { FolderKanban, Plus, TrendingUp, Clock, CheckCircle2, AlertCircle, Calendar, Users, Trash2, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useRouter } from "next/navigation"

export default function ProjectsPage() {
  return (
    <AuthGuard requireAdmin>
      <ProjectsContent />
    </AuthGuard>
  )
}

function ProjectsContent() {
  const router = useRouter()
  const { projects, isLoading: projectsLoading, mutate: mutateProjects } = useProjects()
  const { employees, isLoading: employeesLoading } = useEmployees()
  const { createProject } = useCreateProject()
  const { deleteProject } = useDeleteProject()
  
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "planning" as Project["status"],
    priority: "media" as TaskPriority,
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    budget: "",
    responsibleId: "",
    teamIds: [] as string[],
  })

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const responsible = employees.find((emp) => emp.id === formData.responsibleId)
    if (!responsible) return

    setIsSubmitting(true)
    try {
      await createProject({
        name: formData.name,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        responsibleId: responsible.id,
      })

      mutateProjects()
      setIsAddingProject(false)
      resetForm()
    } catch (error) {
      console.error("Error creating project:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, employees, createProject, mutateProjects])

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "planning",
      priority: "media",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      budget: "",
      responsibleId: "",
      teamIds: [],
    })
  }

  const handleDeleteProject = useCallback(async (id: string) => {
    if (confirm("¿Estas seguro de eliminar este proyecto?")) {
      try {
        await deleteProject(id)
        mutateProjects()
      } catch (error) {
        console.error("Error deleting project:", error)
      }
    }
  }, [deleteProject, mutateProjects])

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "planning":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "on_hold":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "completed":
        return "bg-green-100 text-green-800 border-green-300"
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-300"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: Project["status"]) => {
    switch (status) {
      case "planning":
        return <Clock className="h-4 w-4" />
      case "in_progress":
        return <TrendingUp className="h-4 w-4" />
      case "on_hold":
        return <AlertCircle className="h-4 w-4" />
      case "completed":
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusLabel = (status: Project["status"]) => {
    switch (status) {
      case "planning":
        return "Planificacion"
      case "in_progress":
        return "En Progreso"
      case "on_hold":
        return "En Pausa"
      case "completed":
        return "Completado"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "urgente":
        return "bg-red-500"
      case "alta":
        return "bg-orange-500"
      case "media":
        return "bg-blue-500"
      case "baja":
        return "bg-gray-400"
      default:
        return "bg-gray-400"
    }
  }

  const stats = {
    total: projects.length,
    planning: projects.filter((p) => p.status === "planning").length,
    inProgress: projects.filter((p) => p.status === "in_progress").length,
    completed: projects.filter((p) => p.status === "completed").length,
  }

  if (projectsLoading || employeesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <DashboardHeader />
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Gestion de Proyectos
            </h1>
            <p className="text-muted-foreground mt-2">Controla y da seguimiento a grandes proyectos</p>
          </div>
          <Dialog open={isAddingProject} onOpenChange={setIsAddingProject}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Plus className="mr-2 h-5 w-5" />
                Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
                <DialogDescription>Completa la informacion del proyecto</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Proyecto</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descripcion</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: Project["status"]) => setFormData({ ...formData, status: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planificacion</SelectItem>
                        <SelectItem value="in_progress">En Progreso</SelectItem>
                        <SelectItem value="on_hold">En Pausa</SelectItem>
                        <SelectItem value="completed">Completado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridad</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value: TaskPriority) => setFormData({ ...formData, priority: value })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha de Inicio</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Fecha de Fin (Opcional)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Presupuesto (Opcional)</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsable</Label>
                  <Select
                    value={formData.responsibleId}
                    onValueChange={(value) => setFormData({ ...formData, responsibleId: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees
                        .filter((e) => e.isActive)
                        .map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name} - {employee.position}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    "Crear Proyecto"
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-purple-800">Total Proyectos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-800">Planificacion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-900">{stats.planning}</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-800">En Progreso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-800">Completados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <Card className="col-span-full border-2 border-dashed border-purple-300 bg-purple-50/50">
              <CardContent className="p-12 text-center">
                <FolderKanban className="h-12 w-12 text-purple-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-purple-700">Sin proyectos</h3>
                <p className="text-sm text-purple-600 mt-1">Crea tu primer proyecto para comenzar</p>
              </CardContent>
            </Card>
          ) : (
            projects.map((project) => (
              <Card
                key={project.id}
                className="hover:shadow-xl transition-all cursor-pointer border-2"
                onClick={() => router.push(`/proyecto/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FolderKanban className="h-5 w-5 text-purple-600" />
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteProject(project.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusIcon(project.status)}
                      <span className="ml-1">{getStatusLabel(project.status)}</span>
                    </Badge>
                    <div className={`h-2 w-2 rounded-full ${getPriorityColor(project.priority)}`} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-bold text-purple-600">{project.progress || 0}%</span>
                    </div>
                    <Progress value={project.progress || 0} className="h-2" />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(project.startDate), "PP", { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{project.responsible?.name || "Sin asignar"}</span>
                    </div>
                    {project.budget && (
                      <div className="text-muted-foreground">Presupuesto: ${project.budget.toLocaleString()}</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
