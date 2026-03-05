"use client"

import type React from "react"
import { useState, useRef } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from "@/lib/employee-storage"
import { getTasks } from "@/lib/task-storage"
import type { Employee } from "@/lib/types"
import {
  UserPlus,
  Mail,
  Briefcase,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Camera,
  ImagePlus,
} from "lucide-react"

export default function TeamPage() {
  return (
    <AuthGuard requiredRole="admin">
      <TeamPageContent />
    </AuthGuard>
  )
}

function TeamPageContent() {
  const [employees, setEmployees] = useState<Employee[]>(getEmployees())
  const [isAddingEmployee, setIsAddingEmployee] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "employee" as "employee" | "admin",
    department: "Infraestructura y TI",
    position: "",
    color: "#6366f1",
    avatar: "" as string | undefined,
    isActive: true,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  const tasks = getTasks()

  const getEmployeeStats = (employeeId: string) => {
    const employeeTasks = tasks.filter((t) => t.assignedTo?.id === employeeId)
    return {
      total: employeeTasks.length,
      pendiente: employeeTasks.filter((t) => t.status === "pendiente").length,
      en_proceso: employeeTasks.filter((t) => t.status === "en_proceso").length,
      completada: employeeTasks.filter((t) => t.status === "completada").length,
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, avatar: reader.result as string }))
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingEmployee) {
      const updated = updateEmployee(editingEmployee.id, formData)
      if (updated) {
        setEmployees(getEmployees())
      }
      setEditingEmployee(null)
      setEditDialogOpen(false)
    } else {
      addEmployee(formData)
      setEmployees(getEmployees())
      setIsAddingEmployee(false)
    }
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "employee",
      department: "Infraestructura y TI",
      position: "",
      color: "#6366f1",
      avatar: "",
      isActive: true,
    })
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      role: employee.role,
      department: employee.department,
      position: employee.position,
      color: employee.color,
      avatar: employee.avatar || "",
      isActive: employee.isActive,
    })
    setEditDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("Estas seguro de eliminar este empleado?")) {
      deleteEmployee(id)
      setEmployees(getEmployees())
    }
  }

  const colorOptions = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"]

  const EmployeeForm = ({ isEdit }: { isEdit: boolean }) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Photo upload */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative group">
          <Avatar className="h-24 w-24 border-4 border-muted shadow-lg" style={{ backgroundColor: formData.color }}>
            {formData.avatar ? (
              <AvatarImage src={formData.avatar} alt="Foto" className="object-cover" />
            ) : (
              <AvatarFallback className="text-3xl font-bold text-white">
                {formData.name
                  ? formData.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "?"}
              </AvatarFallback>
            )}
          </Avatar>
          <button
            type="button"
            onClick={() => (isEdit ? editFileInputRef : fileInputRef).current?.click()}
            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg hover:opacity-80 transition-opacity"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input
            ref={isEdit ? editFileInputRef : fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhotoUpload(e, isEdit)}
          />
        </div>
        {!formData.avatar && (
          <button
            type="button"
            onClick={() => (isEdit ? editFileInputRef : fileInputRef).current?.click()}
            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <ImagePlus className="h-3 w-3" />
            Subir foto de perfil
          </button>
        )}
        {formData.avatar && (
          <button
            type="button"
            onClick={() => setFormData({ ...formData, avatar: "" })}
            className="text-sm text-destructive hover:underline"
          >
            Eliminar foto
          </button>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-name" : "name"}>Nombre Completo</Label>
        <Input
          id={isEdit ? "edit-name" : "name"}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-email" : "email"}>Email</Label>
        <Input
          id={isEdit ? "edit-email" : "email"}
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-position" : "position"}>Cargo</Label>
        <Input
          id={isEdit ? "edit-position" : "position"}
          value={formData.position}
          onChange={(e) => setFormData({ ...formData, position: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-department" : "department"}>Departamento</Label>
        <Input
          id={isEdit ? "edit-department" : "department"}
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label>Rol</Label>
        <Select
          value={formData.role}
          onValueChange={(value: "employee" | "admin") => setFormData({ ...formData, role: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="employee">Empleado</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Color Identificativo</Label>
        <div className="flex gap-2 flex-wrap">
          {colorOptions.map((color) => (
            <button
              key={color}
              type="button"
              className={`w-9 h-9 rounded-full border-3 transition-transform ${
                formData.color === color ? "border-foreground scale-125 shadow-lg" : "border-transparent hover:scale-110"
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData({ ...formData, color })}
            />
          ))}
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">
          {isEdit ? "Guardar Cambios" : "Agregar Empleado"}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <DashboardHeader />
      <main className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">
              Gestion de Equipo
            </h1>
            <p className="text-muted-foreground mt-2">Administra tu equipo de trabajo y sus tareas</p>
          </div>
          <Dialog
            open={isAddingEmployee}
            onOpenChange={(open) => {
              setIsAddingEmployee(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button size="lg" className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-lg">
                <UserPlus className="mr-2 h-5 w-5" />
                Agregar Empleado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
                <DialogDescription>Completa la informacion del nuevo miembro del equipo</DialogDescription>
              </DialogHeader>
              <EmployeeForm isEdit={false} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) {
              setEditingEmployee(null)
              resetForm()
            }
          }}
        >
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Empleado</DialogTitle>
              <DialogDescription>Actualiza la informacion del empleado</DialogDescription>
            </DialogHeader>
            <EmployeeForm isEdit={true} />
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => {
            const stats = getEmployeeStats(employee.id)
            const initials = employee.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()

            return (
              <Card key={employee.id} className="overflow-hidden border-2 hover:shadow-xl transition-all group">
                <div className="h-20" style={{ background: `linear-gradient(135deg, ${employee.color}, ${employee.color}99)` }} />
                <CardHeader className="pb-4 -mt-12">
                  <div className="flex items-start justify-between">
                    <Avatar
                      className="h-20 w-20 border-4 border-background shadow-lg"
                      style={{ backgroundColor: employee.color }}
                    >
                      {employee.avatar ? (
                        <AvatarImage src={employee.avatar} alt={employee.name} className="object-cover" />
                      ) : (
                        <AvatarFallback className="text-2xl font-bold text-white">{initials}</AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-100 hover:text-blue-700"
                        onClick={() => handleEdit(employee)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-100 text-destructive"
                        onClick={() => handleDelete(employee.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <CardTitle className="text-xl">{employee.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Briefcase className="h-3 w-3" />
                      {employee.position}
                    </CardDescription>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Mail className="h-3 w-3" />
                      {employee.email}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant={employee.role === "admin" ? "default" : "secondary"}>
                      {employee.role === "admin" ? "Administrador" : "Empleado"}
                    </Badge>
                    <Badge className={employee.isActive ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-slate-400 text-white"}>
                      {employee.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-900">Pendientes</span>
                      </div>
                      <span className="text-xl font-bold text-amber-600">{stats.pendiente}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">En Proceso</span>
                      </div>
                      <span className="text-xl font-bold text-blue-600">{stats.en_proceso}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-900">Completadas</span>
                      </div>
                      <span className="text-xl font-bold text-emerald-600">{stats.completada}</span>
                    </div>
                    {stats.total > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Progreso</span>
                          <span>{stats.total > 0 ? Math.round((stats.completada / stats.total) * 100) : 0}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${stats.total > 0 ? (stats.completada / stats.total) * 100 : 0}%`,
                              backgroundColor: employee.color,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
