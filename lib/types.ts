export type TaskPriority = "baja" | "media" | "alta" | "urgente"
export type TaskStatus = "pendiente" | "en_proceso" | "completada" | "cancelada"
export type TaskCategory = "infraestructura" | "ti" | "mantenimiento" | "otro"

export interface Task {
  id: string
  title: string
  description: string
  category: TaskCategory
  priority: TaskPriority
  status: TaskStatus
  requestedBy: {
    id: string
    name: string
    department: string
    email: string
  }
  requesterDepartment?: string
  requesterName?: string
  assignedTo?: {
    id: string
    name: string
  }
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  completedAt?: Date
  comments: TaskComment[]
  attachments?: TaskAttachment[]
  order?: number
}

export interface TaskComment {
  id: string
  userId: string
  userName: string
  comment: string
  createdAt: Date
}

export interface Employee {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
  position: string
  avatar?: string
  color: string
  isActive: boolean
  createdAt: Date
}

export type UserRole = "employee" | "admin"

export interface TaskAttachment {
  id: string
  type: "image" | "audio"
  url: string
  filename: string
  uploadedAt: Date
}

export interface Notification {
  id: string
  userId: string
  type: "task_assigned" | "task_updated" | "task_comment" | "task_completed"
  title: string
  message: string
  taskId?: string
  taskTitle?: string
  read: boolean
  createdAt: Date
  metadata?: {
    assignedBy?: string
    priority?: TaskPriority
    status?: TaskStatus
  }
}

export interface Project {
  id: string
  name: string
  description: string
  status: "planning" | "in_progress" | "on_hold" | "completed" | "cancelled"
  priority: TaskPriority
  startDate: Date
  endDate?: Date
  progress: number
  budget?: number
  spentBudget?: number
  responsible: {
    id: string
    name: string
  }
  team: Array<{
    id: string
    name: string
  }>
  tasks: string[]
  documents: ProjectDocument[]
  milestones: ProjectMilestone[]
  createdAt: Date
  updatedAt: Date
}

export interface ProjectDocument {
  id: string
  name: string
  type: string
  url: string
  size: number
  uploadedBy: string
  uploadedAt: Date
}

export interface ProjectMilestone {
  id: string
  title: string
  description: string
  dueDate: Date
  completed: boolean
  completedAt?: Date
}
