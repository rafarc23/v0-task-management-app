import type { Task, Employee, Project, Notification } from '@/lib/types'

// Demo employees
export const DEMO_EMPLOYEES: Employee[] = [
  { id: "emp-1", name: "Carlos Rodriguez", email: "carlos@empresa.com", color: "#10b981", role: "Técnico Senior" },
  { id: "emp-2", name: "Maria Lopez", email: "maria@empresa.com", color: "#3b82f6", role: "Técnico" },
  { id: "emp-3", name: "Juan Garcia", email: "juan@empresa.com", color: "#8b5cf6", role: "Técnico Junior" },
  { id: "emp-4", name: "Ana Martinez", email: "ana@empresa.com", color: "#f59e0b", role: "Coordinadora" },
]

// Demo projects
export const DEMO_PROJECTS: Project[] = [
  { id: "proj-1", name: "Mantenimiento General", description: "Tareas de mantenimiento preventivo", color: "#10b981", active: true },
  { id: "proj-2", name: "Infraestructura TI", description: "Proyectos de tecnología", color: "#3b82f6", active: true },
  { id: "proj-3", name: "Renovaciones", description: "Obras y mejoras", color: "#f59e0b", active: true },
]

// Demo tasks
export const DEMO_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Reparación aire acondicionado",
    description: "El aire acondicionado de la sala de reuniones no enfría correctamente. Revisar filtros y gas.",
    status: "in-progress",
    priority: "high",
    assignedTo: DEMO_EMPLOYEES[0],
    project: DEMO_PROJECTS[0],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    requester: { id: "req-1", name: "Pedro Sanchez", email: "pedro@empresa.com" },
    comments: [
      { id: "c1", text: "He revisado los filtros, están sucios. Procederé a limpiarlos.", author: "Carlos Rodriguez", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    attachments: [],
    archived: false,
  },
  {
    id: "task-2",
    title: "Instalar nuevo servidor",
    description: "Configurar e instalar el nuevo servidor Dell PowerEdge en el rack principal del datacenter.",
    status: "pending",
    priority: "high",
    assignedTo: DEMO_EMPLOYEES[1],
    project: DEMO_PROJECTS[1],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    requester: { id: "req-2", name: "Laura Diaz", email: "laura@empresa.com" },
    comments: [],
    attachments: [],
    archived: false,
  },
  {
    id: "task-3",
    title: "Cambiar bombillas LED pasillo",
    description: "Varias bombillas del pasillo principal están fundidas. Cambiar por LED de bajo consumo.",
    status: "completed",
    priority: "low",
    assignedTo: DEMO_EMPLOYEES[2],
    project: DEMO_PROJECTS[0],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    requester: { id: "req-3", name: "Sofia Ruiz", email: "sofia@empresa.com" },
    comments: [
      { id: "c2", text: "Completado. Se han instalado 12 bombillas LED nuevas.", author: "Juan Garcia", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    attachments: [],
    archived: false,
  },
  {
    id: "task-4",
    title: "Actualizar firmware switches",
    description: "Actualizar el firmware de todos los switches de red a la última versión estable.",
    status: "in-progress",
    priority: "medium",
    assignedTo: DEMO_EMPLOYEES[0],
    project: DEMO_PROJECTS[1],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    requester: { id: "req-2", name: "Laura Diaz", email: "laura@empresa.com" },
    comments: [],
    attachments: [],
    archived: false,
  },
  {
    id: "task-5",
    title: "Pintura oficina 302",
    description: "Repintar las paredes de la oficina 302. Color blanco mate.",
    status: "pending",
    priority: "low",
    assignedTo: undefined,
    project: DEMO_PROJECTS[2],
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    requester: { id: "req-4", name: "Miguel Torres", email: "miguel@empresa.com" },
    comments: [],
    attachments: [],
    archived: false,
  },
  {
    id: "task-6",
    title: "Revisar UPS datacenter",
    description: "Mantenimiento preventivo del sistema UPS. Verificar baterías y conexiones.",
    status: "pending",
    priority: "high",
    assignedTo: DEMO_EMPLOYEES[3],
    project: DEMO_PROJECTS[1],
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    requester: { id: "req-2", name: "Laura Diaz", email: "laura@empresa.com" },
    comments: [],
    attachments: [],
    archived: false,
  },
]

// Demo notifications
export const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    type: "task_assigned",
    title: "Nueva tarea asignada",
    message: "Se te ha asignado la tarea 'Revisar UPS datacenter'",
    read: false,
    createdAt: new Date().toISOString(),
    taskId: "task-6",
  },
  {
    id: "notif-2",
    type: "comment",
    title: "Nuevo comentario",
    message: "Carlos Rodriguez comentó en 'Reparación aire acondicionado'",
    read: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    taskId: "task-1",
  },
  {
    id: "notif-3",
    type: "task_completed",
    title: "Tarea completada",
    message: "Juan Garcia completó 'Cambiar bombillas LED pasillo'",
    read: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    taskId: "task-3",
  },
]

// Demo users
export const DEMO_USERS = [
  { id: "user-1", username: "admin", name: "Administrador", email: "admin@empresa.com", role: "admin", isActive: true },
  { id: "user-2", username: "carlos", name: "Carlos Rodriguez", email: "carlos@empresa.com", role: "employee", isActive: true },
  { id: "user-3", username: "maria", name: "Maria Lopez", email: "maria@empresa.com", role: "employee", isActive: true },
  { id: "user-4", username: "pedro", name: "Pedro Sanchez", email: "pedro@empresa.com", role: "requester", isActive: true },
]

// Check if we're in demo mode
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('demoMode') === 'true'
}

// Set demo mode
export function setDemoMode(enabled: boolean): void {
  if (typeof window === 'undefined') return
  if (enabled) {
    localStorage.setItem('demoMode', 'true')
  } else {
    localStorage.removeItem('demoMode')
  }
}
