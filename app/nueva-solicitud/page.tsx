"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { TaskCategory, TaskPriority, TaskAttachment } from "@/lib/types"
import { ArrowLeft, Camera, Mic, StopCircle, X, ImageIcon, User, Building2, PlusCircle, Tag, Loader2 } from "lucide-react"

const DEFAULT_DEPARTMENTS = [
  { value: "produccion", label: "Produccion" },
  { value: "calidad", label: "Calidad" },
  { value: "logistica", label: "Logistica" },
  { value: "administracion", label: "Administracion" },
  { value: "recursos_humanos", label: "Recursos Humanos" },
  { value: "ventas", label: "Ventas" },
  { value: "compras", label: "Compras" },
  { value: "mantenimiento", label: "Mantenimiento" },
]

const DEFAULT_CATEGORIES = [
  { value: "infraestructura", label: "Infraestructura" },
  { value: "ti", label: "Tecnologia de Informacion" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "otro", label: "Otro" },
]

export default function NuevaSolicitudPage() {
  return (
    <AuthGuard>
      <NuevaSolicitudContent />
    </AuthGuard>
  )
}

function NuevaSolicitudContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Custom departments and categories (stored locally for now)
  const [customDepartments, setCustomDepartments] = useState<string[]>([])
  const [customCategories, setCustomCategories] = useState<string[]>([])
  const [newDeptName, setNewDeptName] = useState("")
  const [newCatName, setNewCatName] = useState("")
  const [showAddDept, setShowAddDept] = useState(false)
  const [showAddCat, setShowAddCat] = useState(false)

  const allDepartments = [
    ...DEFAULT_DEPARTMENTS,
    ...customDepartments.map((d) => ({ value: d.toLowerCase().replace(/\s+/g, "_"), label: d })),
  ]

  const allCategories = [
    ...DEFAULT_CATEGORIES,
    ...customCategories.map((c) => ({ value: c.toLowerCase().replace(/\s+/g, "_"), label: c })),
  ]

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as string,
    priority: "" as TaskPriority,
    dueDate: "",
    requesterName: user?.name || "",
    requesterDepartment: "",
  })

  // Update requesterName when user loads
  useEffect(() => {
    if (user?.name && !formData.requesterName) {
      setFormData((prev) => ({ ...prev, requesterName: user.name }))
    }
  }, [user?.name, formData.requesterName])

  const handleAddDepartment = () => {
    if (!newDeptName.trim()) return
    setCustomDepartments(prev => [...prev, newDeptName.trim()])
    const value = newDeptName.trim().toLowerCase().replace(/\s+/g, "_")
    setFormData((prev) => ({ ...prev, requesterDepartment: value }))
    setNewDeptName("")
    setShowAddDept(false)
  }

  const handleAddCategory = () => {
    if (!newCatName.trim()) return
    setCustomCategories(prev => [...prev, newCatName.trim()])
    const value = newCatName.trim().toLowerCase().replace(/\s+/g, "_")
    setFormData((prev) => ({ ...prev, category: value }))
    setNewCatName("")
    setShowAddCat(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const newAttachment: TaskAttachment = {
          id: Date.now().toString() + Math.random(),
          type: "image",
          url: reader.result as string,
          filename: file.name,
          uploadedAt: new Date(),
        }
        setAttachments((prev) => [...prev, newAttachment])
      }
      reader.readAsDataURL(file)
    })
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg",
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })
        const url = URL.createObjectURL(blob)
        setAttachments((prev) => [...prev, {
          id: Date.now().toString() + Math.random(), type: "audio", url, filename: `audio-${Date.now()}.webm`, uploadedAt: new Date(),
        }])
        stream.getTracks().forEach((track) => track.stop())
        setRecordingTime(0)
        chunksRef.current = []
      }
      mediaRecorder.start(100)
      setIsRecording(true)
      recordingIntervalRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000)
    } catch {
      alert("No se pudo acceder al microfono. Permite el acceso en tu navegador.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
    }
  }

  const removeAttachment = (id: string) => setAttachments((prev) => prev.filter((att) => att.id !== id))

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category as TaskCategory,
          priority: formData.priority,
          requestedById: user.id,
          requesterName: formData.requesterName || user.name,
          requesterDepartment: formData.requesterDepartment,
          dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
          attachments: attachments.map(att => ({
            type: att.type,
            url: att.url,
            filename: att.filename,
          })),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al crear la solicitud")
      }

      setSuccess(true)

      setTimeout(() => {
        if (user.role === "requester") router.push("/mis-solicitudes")
        else if (user.role === "employee") router.push("/mis-tareas")
        else router.push("/dashboard")
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear la solicitud")
    } finally {
      setIsSubmitting(false)
    }
  }, [user, formData, attachments, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Nueva Solicitud de Trabajo
          </h1>
          <p className="text-muted-foreground">Departamento de Infraestructura y TI</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto border-2 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle>Formulario de Solicitud</CardTitle>
            <CardDescription>Complete todos los campos para enviar su solicitud</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {success ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-emerald-700 mb-2">Solicitud Enviada</h3>
                <p className="text-slate-600">Su solicitud ha sido registrada exitosamente.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}
                
                {/* Requester info */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border-2 border-blue-200">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700">
                    <User className="h-5 w-5" /> Informacion del Solicitante
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="requesterName" className="flex items-center gap-2">
                        <User className="h-4 w-4" /> Nombre del Solicitante *
                      </Label>
                      <Input
                        id="requesterName"
                        value={formData.requesterName}
                        onChange={(e) => setFormData({ ...formData, requesterName: e.target.value })}
                        placeholder="Tu nombre completo"
                        required
                        disabled={isSubmitting}
                        className="border-2 border-blue-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="requesterDepartment" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Departamento que Solicita *
                      </Label>
                      <div className="flex gap-2">
                        <Select
                          value={formData.requesterDepartment}
                          onValueChange={(value) => setFormData({ ...formData, requesterDepartment: value })}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger id="requesterDepartment" className="border-2 border-blue-200 flex-1">
                            <SelectValue placeholder="Seleccione departamento" />
                          </SelectTrigger>
                          <SelectContent>
                            {allDepartments.map((d) => (
                              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Dialog open={showAddDept} onOpenChange={setShowAddDept}>
                          <DialogTrigger asChild>
                            <Button type="button" variant="outline" size="icon" className="border-2 border-blue-200 shrink-0"
                              title="Agregar departamento">
                              <PlusCircle className="h-4 w-4 text-blue-600" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Agregar Nuevo Departamento</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              <Input
                                placeholder="Nombre del departamento"
                                value={newDeptName}
                                onChange={(e) => setNewDeptName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddDepartment() } }}
                              />
                              <Button onClick={handleAddDepartment} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                                <PlusCircle className="h-4 w-4 mr-2" /> Agregar Departamento
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Titulo de la Solicitud *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Reparacion de impresora en oficina 3"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Descripcion Detallada *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describa el problema o solicitud con el mayor detalle posible..."
                    rows={5}
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category with add new */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="flex items-center gap-2">
                      <Tag className="h-4 w-4" /> Categoria *
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="category" className="flex-1">
                          <SelectValue placeholder="Seleccione categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {allCategories.map((c) => (
                            <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Dialog open={showAddCat} onOpenChange={setShowAddCat}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="icon" className="shrink-0"
                            title="Agregar categoria">
                            <PlusCircle className="h-4 w-4 text-purple-600" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Agregar Nueva Categoria</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-2">
                            <Input
                              placeholder="Nombre de la categoria"
                              value={newCatName}
                              onChange={(e) => setNewCatName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCategory() } }}
                            />
                            <Button onClick={handleAddCategory} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                              <PlusCircle className="h-4 w-4 mr-2" /> Agregar Categoria
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridad *</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue placeholder="Seleccione prioridad" />
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

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Fecha Deseada de Finalizacion (Opcional)</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Attachments */}
                <div className="space-y-4">
                  <Label>Adjuntar Archivos</Label>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}
                      disabled={isSubmitting} className="flex-1 border-2 border-purple-200 hover:bg-purple-50">
                      <Camera className="h-4 w-4 mr-2" /> Adjuntar Foto
                    </Button>
                    <Button type="button" variant="outline" onClick={isRecording ? stopRecording : startRecording}
                      disabled={isSubmitting}
                      className={`flex-1 border-2 ${isRecording ? "border-red-200 bg-red-50 hover:bg-red-100" : "border-blue-200 hover:bg-blue-50"}`}>
                      {isRecording ? (
                        <><StopCircle className="h-4 w-4 mr-2 text-red-600 animate-pulse" /> Detener ({formatRecordingTime(recordingTime)})</>
                      ) : (
                        <><Mic className="h-4 w-4 mr-2" /> Grabar Audio</>
                      )}
                    </Button>
                  </div>

                  <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((att) => (
                        <div key={att.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                          {att.type === "image" ? (
                            <>
                              <ImageIcon className="h-5 w-5 text-purple-600" />
                              <img src={att.url || "/placeholder.svg"} alt={att.filename} className="h-12 w-12 object-cover rounded" crossOrigin="anonymous" />
                            </>
                          ) : (
                            <>
                              <Mic className="h-5 w-5 text-blue-600" />
                              <audio src={att.url} controls className="h-8 flex-1" />
                            </>
                          )}
                          <span className="text-sm text-slate-600 flex-1 truncate">{att.filename}</span>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeAttachment(att.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.title || !formData.description || !formData.category || !formData.priority || !formData.requesterDepartment}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg py-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Solicitud"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
