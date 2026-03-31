"use client"

import type React from "react"
import { useState, useCallback, useMemo } from "react"
import { AuthGuard } from "@/components/auth-guard"
import { DashboardHeader } from "@/components/dashboard-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { 
  getUsers, 
  addUser, 
  updateUser, 
  deleteUser, 
  resetPassword,
  type StoredUser, 
  type UserRole 
} from "@/lib/user-storage"
import {
  UserPlus,
  Mail,
  Shield,
  Wrench,
  Send,
  Edit2,
  Trash2,
  Key,
  Users,
  CheckCircle,
  XCircle,
  Search,
  Calendar,
  Clock,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { toast } from "sonner"

export default function UsersPage() {
  return (
    <AuthGuard requiredRole="admin">
      <UsersPageContent />
    </AuthGuard>
  )
}

function UsersPageContent() {
  const [users, setUsers] = useState<StoredUser[]>(getUsers())
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [editingUser, setEditingUser] = useState<StoredUser | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<StoredUser | null>(null)
  const [userToResetPassword, setUserToResetPassword] = useState<StoredUser | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "employee" as UserRole,
    department: "",
    isActive: true,
  })

  const refreshUsers = useCallback(() => {
    setUsers(getUsers())
  }, [])

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users
    const query = searchQuery.toLowerCase()
    return users.filter(u => 
      u.name.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.department?.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  const stats = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admins: users.filter(u => u.role === "admin").length,
    employees: users.filter(u => u.role === "employee").length,
    requesters: users.filter(u => u.role === "requester").length,
  }), [users])

  const resetForm = useCallback(() => {
    setFormData({
      username: "",
      password: "",
      name: "",
      email: "",
      role: "employee",
      department: "",
      isActive: true,
    })
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingUser) {
        const { password, ...updates } = formData
        updateUser(editingUser.id, updates)
        toast.success("Usuario actualizado correctamente")
        setEditingUser(null)
        setEditDialogOpen(false)
      } else {
        if (!formData.password) {
          toast.error("La contrasena es requerida")
          return
        }
        addUser(formData)
        toast.success("Usuario creado correctamente")
        setIsAddingUser(false)
      }
      resetForm()
      refreshUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar usuario")
    }
  }, [editingUser, formData, resetForm, refreshUsers])

  const handleEdit = useCallback((user: StoredUser) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: "",
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || "",
      isActive: user.isActive,
    })
    setEditDialogOpen(true)
  }, [])

  const handleDelete = useCallback(() => {
    if (!userToDelete) return
    try {
      deleteUser(userToDelete.id)
      toast.success("Usuario eliminado correctamente")
      refreshUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar usuario")
    }
    setUserToDelete(null)
    setDeleteDialogOpen(false)
  }, [userToDelete, refreshUsers])

  const handleResetPassword = useCallback(() => {
    if (!userToResetPassword || !newPassword) return
    try {
      resetPassword(userToResetPassword.id, newPassword)
      toast.success("Contrasena restablecida correctamente")
      setNewPassword("")
      setUserToResetPassword(null)
      setResetPasswordDialogOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al restablecer contrasena")
    }
  }, [userToResetPassword, newPassword])

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "admin": return <Shield className="h-4 w-4" />
      case "employee": return <Wrench className="h-4 w-4" />
      case "requester": return <Send className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case "admin": return "bg-blue-500 text-white"
      case "employee": return "bg-emerald-500 text-white"
      case "requester": return "bg-amber-500 text-white"
    }
  }

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case "admin": return "Administrador"
      case "employee": return "Empleado"
      case "requester": return "Solicitante"
    }
  }

  const UserForm = ({ isEdit }: { isEdit: boolean }) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={isEdit ? "edit-username" : "username"}>Usuario</Label>
          <Input
            id={isEdit ? "edit-username" : "username"}
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
            disabled={isEdit && editingUser?.username === "admin"}
            placeholder="nombre.usuario"
          />
        </div>
        {!isEdit && (
          <div className="space-y-2">
            <Label htmlFor="password">Contrasena</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!isEdit}
              placeholder="********"
            />
          </div>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-name" : "name"}>Nombre Completo</Label>
        <Input
          id={isEdit ? "edit-name" : "name"}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Juan Perez"
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
          placeholder="usuario@empresa.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={isEdit ? "edit-department" : "department"}>Departamento</Label>
        <Input
          id={isEdit ? "edit-department" : "department"}
          value={formData.department}
          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          placeholder="Infraestructura y TI"
        />
      </div>
      <div className="space-y-2">
        <Label>Rol</Label>
        <Select
          value={formData.role}
          onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
          disabled={isEdit && editingUser?.username === "admin"}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Administrador
              </div>
            </SelectItem>
            <SelectItem value="employee">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-emerald-500" />
                Empleado
              </div>
            </SelectItem>
            <SelectItem value="requester">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-amber-500" />
                Solicitante
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {isEdit && (
        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div className="space-y-0.5">
            <Label htmlFor="isActive">Usuario Activo</Label>
            <p className="text-xs text-muted-foreground">
              Los usuarios inactivos no pueden iniciar sesion
            </p>
          </div>
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            disabled={editingUser?.username === "admin"}
          />
        </div>
      )}
      <DialogFooter>
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
        >
          {isEdit ? "Guardar Cambios" : "Crear Usuario"}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <DashboardHeader />
      <main className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Gestion de Usuarios</h1>
            <p className="text-muted-foreground mt-2">Administra los usuarios del sistema</p>
          </div>
          <Dialog
            open={isAddingUser}
            onOpenChange={(open) => {
              setIsAddingUser(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>Completa la informacion del nuevo usuario</DialogDescription>
              </DialogHeader>
              <UserForm isEdit={false} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-100">
                  <Users className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Activos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">{stats.admins}</p>
                  <p className="text-xs text-muted-foreground">Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-100">
                  <Wrench className="h-5 w-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-600">{stats.employees}</p>
                  <p className="text-xs text-muted-foreground">Empleados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Send className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">{stats.requesters}</p>
                  <p className="text-xs text-muted-foreground">Solicitantes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar usuarios..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-2"
          />
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const initials = user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)

            return (
              <Card key={user.id} className="border-2 hover:shadow-lg transition-all group overflow-hidden">
                <div className={`h-1.5 ${user.isActive ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-slate-300"}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-slate-200">
                        <AvatarFallback className={`font-bold ${getRoleColor(user.role)}`}>
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {user.name}
                          {user.username === "admin" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">Principal</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          @{user.username}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-100 hover:text-blue-700"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-amber-100 hover:text-amber-700"
                        onClick={() => {
                          setUserToResetPassword(user)
                          setResetPasswordDialogOpen(true)
                        }}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      {user.username !== "admin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-100 text-destructive"
                          onClick={() => {
                            setUserToDelete(user)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </div>
                  {user.department && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {user.department}
                    </div>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getRoleColor(user.role)}>
                      <span className="mr-1">{getRoleIcon(user.role)}</span>
                      {getRoleName(user.role)}
                    </Badge>
                    <Badge variant={user.isActive ? "outline" : "secondary"} className={user.isActive ? "border-emerald-500 text-emerald-700" : ""}>
                      {user.isActive ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Activo</>
                      ) : (
                        <><XCircle className="h-3 w-3 mr-1" /> Inactivo</>
                      )}
                    </Badge>
                  </div>
                  <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Creado: {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: es })}
                    </div>
                    {user.lastLogin && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Ultimo acceso: {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true, locale: es })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">No se encontraron usuarios</p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog
          open={editDialogOpen}
          onOpenChange={(open) => {
            setEditDialogOpen(open)
            if (!open) {
              setEditingUser(null)
              resetForm()
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>Actualiza la informacion del usuario</DialogDescription>
            </DialogHeader>
            <UserForm isEdit={true} />
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Restablecer Contrasena</DialogTitle>
              <DialogDescription>
                Establece una nueva contrasena para {userToResetPassword?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contrasena</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nueva contrasena"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleResetPassword} disabled={!newPassword}>
                  Restablecer
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar Usuario</AlertDialogTitle>
              <AlertDialogDescription>
                Esta seguro de eliminar a {userToDelete?.name}? Esta accion no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}
