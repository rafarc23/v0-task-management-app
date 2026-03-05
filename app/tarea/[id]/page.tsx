"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { getTaskById, updateTask, addComment, deleteTask } from "@/lib/task-storage"
import { getEmployees } from "@/lib/employee-storage"
import type { Task, TaskStatus, TaskPriority } from "@/lib/types"
import {
  ArrowLeft,
  User,
  Building2,
  AlertCircle,
  MessageSquare,
  Trash2,
  Edit2,
  Save,
  Image as ImageIcon,
  Mic,
  Download,
  X,
  ZoomIn,
  Maximize2,
  FileAudio,
  Paperclip,
  Calendar,
  Clock,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function TaskDetailPage() {
  return (
    <AuthGuard>
      <TaskDetailContent />
    </AuthGuard>
  )
}

function TaskDetailContent() {
  const router = useRouter()
  const params = useParams()
  const { user, isAdmin } = useAuth()
  const [task, setTask] = useState<Task | null>(null)
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    dueDate: "",
  })

  const taskId = params.id as string
  const employees = getEmployees()

  useEffect(() => {
    const loadTask = () => {
      const foundTask = getTaskById(taskId)
      if (foundTask) {
        setTask(foundTask)
        setEditForm({
          title: foundTask.title,
          description: foundTask.description,
          dueDate: foundTask.dueDate ? format(new Date(foundTask.dueDate), "yyyy-MM-dd") : "",
        })
      } else {
        router.push("/dashboard")
      }
    }

    loadTask()
    const interval = setInterval(loadTask, 5000)
    return () => clearInterval(interval)
  }, [taskId, router])

  const handleSaveEdit = () => {
    if (!task) return
    const updated = updateTask(task.id, {
      title: editForm.title,
      description: editForm.description,
      dueDate: editForm.dueDate ? new Date(editForm.dueDate) : undefined,
    })
    if (updated) {
      setTask(updated)
      setIsEditing(false)
    }
  }

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (!task) return
    const updated = updateTask(task.id, {
      status: newStatus,
      completedAt: newStatus === "completada" ? new Date() : undefined,
    })
    if (updated) setTask(updated)
  }

  const handlePriorityChange = (newPriority: TaskPriority) => {
    if (!task) return
    const updated = updateTask(task.id, { priority: newPriority })
    if (updated) setTask(updated)
  }

  const handleAssignTo = (employeeId: string) => {
    if (!task) return
    const employee = employees.find((e) => e.id === employeeId)
    if (!employee) return
    const updated = updateTask(task.id, {
      assignedTo: { id: employee.id, name: employee.name },
    })
    if (updated) setTask(updated)
  }

  const handleAddComment = async () => {
    if (!task || !user || !newComment.trim()) return
    setIsSubmittingComment(true)
    const comment = addComment(task.id, {
      userId: user.id,
      userName: user.name,
      comment: newComment.trim(),
    })
    if (comment) {
      const updatedTask = getTaskById(task.id)
      if (updatedTask) setTask(updatedTask)
      setNewComment("")
    }
    setIsSubmittingComment(false)
  }

  const handleDeleteTask = () => {
    if (!task) return
    if (deleteTask(task.id)) router.push("/dashboard")
  }

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const getEmployeeColor = (employeeId?: string) => {
    if (!employeeId) return "#6366f1"
    const emp = employees.find((e) => e.id === employeeId)
    return emp?.color || "#6366f1"
  }

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

  const formatStatus = (status: string) => {
    switch (status) {
      case "pendiente": return "Pendiente"
      case "en_proceso": return "En Proceso"
      case "completada": return "Completada"
      case "cancelada": return "Cancelada"
      default: return status
    }
  }

  const formatPriority = (priority: string) => priority.charAt(0).toUpperCase() + priority.slice(1)

  if (!task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Cargando...</p>
        </div>
      </div>
    )
  }

  const empColor = getEmployeeColor(task.assignedTo?.id)
  const images = task.attachments?.filter((a) => a.type === "image") || []
  const audios = task.attachments?.filter((a) => a.type === "audio") || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <DashboardHeader />

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="secondary"
              size="icon"
              className="absolute -top-12 right-0 bg-white/20 text-white hover:bg-white/40"
              onClick={() => setPreviewImage(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            <img
              src={previewImage}
              alt="Vista previa"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl shadow-2xl"
              crossOrigin="anonymous"
            />
            <div className="flex justify-center mt-4 gap-3">
              <Button
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30"
                onClick={() => handleDownload(previewImage, "imagen.png")}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-4 hover:bg-white/50">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Dashboard
        </Button>

        {/* Task Header Bar */}
        <div
          className="rounded-xl p-5 mb-6 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${empColor}, ${empColor}dd)` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Badge className={getStatusColor(task.status)}>{formatStatus(task.status)}</Badge>
                <Badge className={getPriorityColor(task.priority)}>{formatPriority(task.priority)}</Badge>
                {task.assignedTo && (
                  <Badge className="bg-white/20 text-white border border-white/30">
                    {task.assignedTo.name}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold text-white">{task.title}</h1>
              <p className="text-white/70 text-sm mt-1">
                Solicitud de {task.requestedBy.name} - {task.requestedBy.department}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {(isAdmin || task.requestedBy.id === user?.id) && (
                <>
                  {isEditing ? (
                    <Button size="sm" onClick={handleSaveEdit} className="bg-white/20 hover:bg-white/30 text-white">
                      <Save className="h-4 w-4 mr-1" /> Guardar
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-white hover:bg-white/20"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
              {isAdmin && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-red-500/40">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Eliminar tarea</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta accion no se puede deshacer. La tarea sera eliminada permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteTask}
                        className="bg-red-500 text-white hover:bg-red-600"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Descripcion</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-3">
                    <Label>Titulo</Label>
                    <Input
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    />
                    <Label>Descripcion</Label>
                    <Textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={5}
                    />
                    <Label>Fecha de vencimiento</Label>
                    <Input
                      type="date"
                      value={editForm.dueDate}
                      onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    />
                  </div>
                ) : (
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{task.description}</p>
                )}
              </CardContent>
            </Card>

            {/* Attachments - Photos */}
            {images.length > 0 && (
              <Card className="border-2 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-pink-50 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-rose-100 rounded-lg">
                      <ImageIcon className="h-5 w-5 text-rose-600" />
                    </div>
                    <span>Fotos Adjuntas</span>
                    <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                      {images.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="group relative rounded-xl overflow-hidden border-2 border-gray-100 hover:border-rose-300 transition-all shadow-sm hover:shadow-md"
                      >
                        <img
                          src={img.url}
                          alt={img.filename}
                          className="w-full h-48 object-cover"
                          crossOrigin="anonymous"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg"
                            onClick={() => setPreviewImage(img.url)}
                          >
                            <ZoomIn className="h-5 w-5 text-gray-700" />
                          </Button>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg"
                            onClick={() => handleDownload(img.url, img.filename)}
                          >
                            <Download className="h-5 w-5 text-gray-700" />
                          </Button>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-white text-xs truncate font-medium">{img.filename}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Attachments - Audios */}
            {audios.length > 0 && (
              <Card className="border-2 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-2 bg-violet-100 rounded-lg">
                      <FileAudio className="h-5 w-5 text-violet-600" />
                    </div>
                    <span>Grabaciones de Audio</span>
                    <Badge variant="secondary" className="bg-violet-100 text-violet-700">
                      {audios.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {audios.map((audio) => (
                    <div
                      key={audio.id}
                      className="flex items-center gap-4 p-4 rounded-xl border-2 border-gray-100 bg-gradient-to-r from-violet-50/50 to-white hover:border-violet-200 transition-all"
                    >
                      <div className="p-3 bg-violet-100 rounded-xl flex-shrink-0">
                        <Mic className="h-6 w-6 text-violet-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate mb-2">{audio.filename}</p>
                        <audio controls className="w-full h-8" preload="metadata">
                          <source src={audio.url} type="audio/webm" />
                          <source src={audio.url} type="audio/mp4" />
                          <source src={audio.url} type="audio/ogg" />
                          Tu navegador no soporta la reproduccion de audio
                        </audio>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="flex-shrink-0 hover:bg-violet-100"
                        onClick={() => handleDownload(audio.url, audio.filename)}
                      >
                        <Download className="h-4 w-4 text-violet-600" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* No attachments */}
            {(!task.attachments || task.attachments.length === 0) && (
              <Card className="border-2 border-dashed shadow-sm">
                <CardContent className="p-8 text-center">
                  <Paperclip className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-400 font-medium">No hay archivos adjuntos</p>
                  <p className="text-gray-300 text-sm mt-1">Las fotos y audios apareceran aqui</p>
                </CardContent>
              </Card>
            )}

            {/* Comments */}
            <Card className="border-2 shadow-lg overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-cyan-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-cyan-600" />
                  </div>
                  <span>Comentarios</span>
                  <Badge variant="secondary" className="bg-cyan-100 text-cyan-700">
                    {task.comments.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {task.comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400">No hay comentarios todavia</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {task.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="border-2 rounded-xl p-4 bg-gradient-to-r from-gray-50 to-white hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-sm text-indigo-700">{comment.userName}</p>
                          <p className="text-xs text-gray-400">
                            {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: es })}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t-2 space-y-3">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escribe un comentario..."
                    rows={3}
                    disabled={isSubmittingComment}
                    className="border-2"
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={isSubmittingComment || !newComment.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isSubmittingComment ? "Enviando..." : "Agregar Comentario"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <Card className="border-2 shadow-lg overflow-hidden">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="text-base">Informacion de la Solicitud</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Solicitado por</p>
                    <p className="font-semibold text-gray-800">{task.requestedBy.name}</p>
                    <p className="text-sm text-gray-500">{task.requestedBy.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg flex-shrink-0">
                    <Building2 className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Departamento</p>
                    <p className="font-semibold text-gray-800">{task.requesterDepartment || task.requestedBy.department}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${empColor}15` }}>
                    <User className="h-4 w-4" style={{ color: empColor }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Asignado a</p>
                    {isAdmin ? (
                      <Select
                        value={task.assignedTo?.id || "unassigned"}
                        onValueChange={(value) => value !== "unassigned" && handleAssignTo(value)}
                      >
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Sin asignar</SelectItem>
                          {employees
                            .filter((e) => e.isActive)
                            .map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: employee.color }}
                                  />
                                  {employee.name}
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    ) : task.assignedTo ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: empColor }} />
                        <p className="font-semibold text-gray-800">{task.assignedTo.name}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 mt-1">No asignado</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-50 rounded-lg flex-shrink-0">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Creada</p>
                    <p className="font-medium text-gray-800 text-sm">{format(task.createdAt, "PPP", { locale: es })}</p>
                  </div>
                </div>

                {task.dueDate && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg flex-shrink-0">
                      <Clock className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Vence</p>
                      <p className="font-medium text-gray-800 text-sm">
                        {format(new Date(task.dueDate), "PPP", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}

                {task.completedAt && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-50 rounded-lg flex-shrink-0">
                      <Calendar className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Completada</p>
                      <p className="font-medium text-gray-800 text-sm">
                        {format(task.completedAt, "PPP", { locale: es })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-300 pt-2 border-t">
                  Categoria: <span className="capitalize text-gray-500">{task.category}</span>
                </div>
              </CardContent>
            </Card>

            {/* Admin Controls */}
            {isAdmin && (
              <Card className="border-2 shadow-lg overflow-hidden">
                <CardHeader className="border-b bg-gray-50">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    Gestion de Tarea
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-5">
                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Estado</Label>
                    <Select value={task.status} onValueChange={(value) => handleStatusChange(value as TaskStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en_proceso">En Proceso</SelectItem>
                        <SelectItem value="completada">Completada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-gray-400 font-medium uppercase tracking-wider">Prioridad</Label>
                    <Select
                      value={task.priority}
                      onValueChange={(value) => handlePriorityChange(value as TaskPriority)}
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
                </CardContent>
              </Card>
            )}

            {/* Current Status Card */}
            <Card className="border-2 shadow-lg overflow-hidden">
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Estado</span>
                  <Badge className={getStatusColor(task.status)}>{formatStatus(task.status)}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Prioridad</span>
                  <Badge className={getPriorityColor(task.priority)}>{formatPriority(task.priority)}</Badge>
                </div>
                {task.attachments && task.attachments.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Adjuntos</span>
                    <div className="flex items-center gap-1.5">
                      {images.length > 0 && (
                        <Badge variant="outline" className="border-rose-200 text-rose-600">
                          <ImageIcon className="h-3 w-3 mr-1" />{images.length}
                        </Badge>
                      )}
                      {audios.length > 0 && (
                        <Badge variant="outline" className="border-violet-200 text-violet-600">
                          <Mic className="h-3 w-3 mr-1" />{audios.length}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                <Separator />
                <p className="text-xs text-gray-300">
                  Actualizada {formatDistanceToNow(task.updatedAt, { addSuffix: true, locale: es })}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
