"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getProjectById, addDocument, addMilestone, toggleMilestone } from "@/lib/project-storage"
import type { Project } from "@/lib/types"
import { ArrowLeft, FileText, Upload, CheckCircle2, Circle, Plus, Calendar, Users, TrendingUp } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function ProjectDetailPage() {
  return (
    <AuthGuard requiredRole="admin">
      <ProjectDetailContent />
    </AuthGuard>
  )
}

function ProjectDetailContent() {
  const router = useRouter()
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [isAddingDocument, setIsAddingDocument] = useState(false)
  const [isAddingMilestone, setIsAddingMilestone] = useState(false)
  const [documentForm, setDocumentForm] = useState({
    name: "",
    type: "pdf",
    url: "",
    size: 0,
  })
  const [milestoneForm, setMilestoneForm] = useState({
    title: "",
    description: "",
    dueDate: "",
  })

  const projectId = params.id as string

  useEffect(() => {
    const loadProject = () => {
      const foundProject = getProjectById(projectId)
      if (foundProject) {
        setProject(foundProject)
      } else {
        router.push("/proyectos")
      }
    }
    loadProject()
    const interval = setInterval(loadProject, 5000)
    return () => clearInterval(interval)
  }, [projectId, router])

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return

    addDocument(project.id, {
      name: documentForm.name,
      type: documentForm.type,
      url: documentForm.url || `/documents/${documentForm.name}`,
      size: documentForm.size,
      uploadedBy: "Admin",
      uploadedAt: new Date(),
    })

    setProject(getProjectById(project.id))
    setIsAddingDocument(false)
    setDocumentForm({ name: "", type: "pdf", url: "", size: 0 })
  }

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault()
    if (!project) return

    addMilestone(project.id, {
      title: milestoneForm.title,
      description: milestoneForm.description,
      dueDate: new Date(milestoneForm.dueDate),
      completed: false,
    })

    setProject(getProjectById(project.id))
    setIsAddingMilestone(false)
    setMilestoneForm({ title: "", description: "", dueDate: "" })
  }

  const handleToggleMilestone = (milestoneId: string) => {
    if (!project) return
    toggleMilestone(project.id, milestoneId)
    setProject(getProjectById(project.id))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setDocumentForm({
          ...documentForm,
          name: file.name,
          type: file.type,
          url: reader.result as string,
          size: file.size,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.push("/proyectos")} className="mb-4 hover:bg-white/50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Proyectos
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                <CardTitle className="text-3xl">{project.name}</CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      Progreso del Proyecto
                    </h3>
                    <span className="text-2xl font-bold text-purple-600">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-3" />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Fecha de Inicio</Label>
                    <p className="font-medium mt-1">{format(project.startDate, "PPP", { locale: es })}</p>
                  </div>
                  {project.endDate && (
                    <div>
                      <Label className="text-muted-foreground">Fecha de Fin</Label>
                      <p className="font-medium mt-1">{format(project.endDate, "PPP", { locale: es })}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Responsable</Label>
                    <p className="font-medium mt-1">{project.responsible.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Equipo</Label>
                    <p className="font-medium mt-1">{project.team.length} miembros</p>
                  </div>
                  {project.budget && (
                    <>
                      <div>
                        <Label className="text-muted-foreground">Presupuesto Total</Label>
                        <p className="font-medium mt-1">${project.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Presupuesto Gastado</Label>
                        <p className="font-medium mt-1">${(project.spentBudget || 0).toLocaleString()}</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Hitos del Proyecto ({project.milestones.filter((m) => m.completed).length}/
                    {project.milestones.length})
                  </CardTitle>
                  <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-600">
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Hito
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Agregar Nuevo Hito</DialogTitle>
                        <DialogDescription>Define un hito importante del proyecto</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddMilestone} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="milestone-title">Título</Label>
                          <Input
                            id="milestone-title"
                            value={milestoneForm.title}
                            onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="milestone-description">Descripción</Label>
                          <Textarea
                            id="milestone-description"
                            value={milestoneForm.description}
                            onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                            rows={3}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="milestone-dueDate">Fecha Límite</Label>
                          <Input
                            id="milestone-dueDate"
                            type="date"
                            value={milestoneForm.dueDate}
                            onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Agregar Hito
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {project.milestones.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No hay hitos definidos</p>
                ) : (
                  project.milestones.map((milestone) => (
                    <div
                      key={milestone.id}
                      className="flex items-start gap-3 p-4 border-2 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <Checkbox
                        checked={milestone.completed}
                        onCheckedChange={() => handleToggleMilestone(milestone.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4
                          className={`font-semibold ${milestone.completed ? "line-through text-muted-foreground" : ""}`}
                        >
                          {milestone.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(milestone.dueDate, "PPP", { locale: es })}
                        </div>
                      </div>
                      {milestone.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documentos ({project.documents.length})
                  </CardTitle>
                  <Dialog open={isAddingDocument} onOpenChange={setIsAddingDocument}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-gradient-to-r from-green-600 to-emerald-600">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Subir Documento</DialogTitle>
                        <DialogDescription>Agrega un documento al proyecto</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddDocument} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="document-file">Archivo</Label>
                          <Input id="document-file" type="file" onChange={handleFileUpload} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="document-name">Nombre del Documento</Label>
                          <Input
                            id="document-name"
                            value={documentForm.name}
                            onChange={(e) => setDocumentForm({ ...documentForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          Subir Documento
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-6">
                {project.documents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No hay documentos</p>
                ) : (
                  project.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => window.open(doc.url, "_blank")}
                    >
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(doc.size / 1024).toFixed(2)} KB - {format(doc.uploadedAt, "PP", { locale: es })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Equipo del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-6">
                <div className="p-3 border-2 border-purple-200 rounded-lg bg-purple-50">
                  <p className="font-semibold text-sm text-purple-900">Responsable</p>
                  <p className="text-sm">{project.responsible.name}</p>
                </div>
                {project.team.map((member) => (
                  <div key={member.id} className="p-3 border rounded-lg">
                    <p className="text-sm font-medium">{member.name}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
