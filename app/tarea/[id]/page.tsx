"use client"

import { useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTask, useEmployees } from "@/lib/hooks/use-data"
import type { TaskStatus, TaskPriority } from "@/lib/types"
import {
  ArrowLeft,
  User,
  MessageSquare,
  Trash2,
  Edit2,
  Save,
  Image as ImageIcon,
  Mic,
  Download,
  X,
  ZoomIn,
  FileAudio,
  Paperclip,
  Loader2,
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
  const taskId = params.id as string
  
  const { task, isLoading, updateTask, deleteTask, addComment } = useTask(taskId)
  const { employees } = useEmployees()
  
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    dueDate: "",
  })

  // Initialize edit form when task loads
  const initializeEditForm = useCallback(() => {
    if (task && !editForm.title) {
      setEditForm({
        title: task.title,
        description: task.description,
        dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
      })
    }
  }, [task, editForm.title])
  
  // Call this when task loads
  if (task && !editForm.title) {
    initializeEditForm()
  }

  const handleSaveEdit = async () => {
    if (!task) return
    await updateTask({
      title: editForm.title,
      description: editForm.description,
      dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : undefined,
    })
    setIsEditing(false)
  }

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return
    await updateTask({
      status: newStatus,
      completedAt: newStatus === "completada" ? new Date().toISOString() : undefined,
    })
  }

  const handlePriorityChange = async (newPriority: TaskPriority) => {
    if (!task) return
    await updateTask({ priority: newPriority })
  }

  const handleAssignTo = async (employeeId: string) => {
    if (!task) return
    const employee = employees.find((e) => e.id === employeeId)
    if (!employee) return
    await updateTask({
      assignedToId: employee.id,
      assignedToName: employee.name,
    })
  }

  const handleAddComment = async () => {
    if (!task || !user || !newComment.trim()) return
    setIsSubmittingComment(true)
    await addComment(newComment.trim())
    setNewComment("")
    setIsSubmittingComment(false)
  }

  const handleDeleteTask = async () => {
    if (!task) return
    await deleteTask()
    router.push("/dashboard")
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

  if (isLoading || !task) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-slate-600">Cargando tarea...</p>
          </div>
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
                    {task.comments?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                {(!task.comments || task.comments.length === 0) ? (
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
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
                            {comment.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-800">{comment.userName}</p>
                            <p className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
                            </p>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm pl-11">{comment.comment}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex gap-3">
                    <Textarea
                      placeholder="Escribe un comentario..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 resize-none"
                      rows={2}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                    >
                      {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            {isAdmin && (
              <Card className="border-2 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select value={task.status} onValueChange={(v) => handleStatusChange(v as TaskStatus)}>
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
                    <Label>Prioridad</Label>
                    <Select value={task.priority} onValueChange={(v) => handlePriorityChange(v as TaskPriority)}>
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

                  <div className="space-y-2">
                    <Label>Asignar a</Label>
                    <Select value={task.assignedTo?.id || ""} onValueChange={handleAssignTo}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: emp.color }} />
                              {emp.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info */}
            <Card className="border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Informacion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">{task.requestedBy.name}</p>
                    <p className="text-xs text-gray-400">{task.requestedBy.department}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Categoria</span>
                    <span className="font-medium capitalize">{task.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Creada</span>
                    <span className="font-medium">{format(new Date(task.createdAt), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                  {task.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vencimiento</span>
                      <span className="font-medium">{format(new Date(task.dueDate), "dd/MM/yyyy")}</span>
                    </div>
                  )}
                  {task.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Completada</span>
                      <span className="font-medium text-emerald-600">{format(new Date(task.completedAt), "dd/MM/yyyy HH:mm")}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
