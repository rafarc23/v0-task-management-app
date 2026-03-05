import type { Task, TaskComment } from "./types"
import { createNotification } from "./notification-storage"
import { getEmployeeById } from "./employee-storage"

const STORAGE_KEY = "tasks"
const DEPARTMENTS_KEY = "custom_departments"
const CATEGORIES_KEY = "custom_categories"

// --- Custom departments & categories management ---
export function getCustomDepartments(): string[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(DEPARTMENTS_KEY)
  return stored ? JSON.parse(stored) : []
}

export function addCustomDepartment(name: string) {
  const departments = getCustomDepartments()
  if (!departments.includes(name)) {
    departments.push(name)
    localStorage.setItem(DEPARTMENTS_KEY, JSON.stringify(departments))
  }
}

export function getCustomCategories(): string[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(CATEGORIES_KEY)
  return stored ? JSON.parse(stored) : []
}

export function addCustomCategory(name: string) {
  const categories = getCustomCategories()
  if (!categories.includes(name)) {
    categories.push(name)
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  }
}

// --- Email queue ---
const emailQueue: Array<() => Promise<void>> = []
let isProcessingQueue = false

async function processEmailQueue() {
  if (isProcessingQueue) return
  isProcessingQueue = true
  while (emailQueue.length > 0) {
    const send = emailQueue.shift()
    if (send) {
      try { await send() } catch (e) { console.error("Email queue error:", e) }
    }
  }
  isProcessingQueue = false
}

function queueEmail(fn: () => Promise<void>) {
  emailQueue.push(fn)
  processEmailQueue()
}

async function sendTaskEmail(
  to: string,
  recipientName: string,
  type: "task_assigned" | "task_updated" | "task_comment" | "task_completed",
  taskTitle: string,
  taskId: string,
  message: string,
  extra?: { priority?: string; assignedBy?: string; commentBy?: string; commentText?: string }
) {
  try {
    const { sendEmailNotification } = await import("./email-service")
    await sendEmailNotification({ to, recipientName, type, taskTitle, taskId, message, ...extra })
  } catch (e) {
    console.error("Email send failed:", e)
  }
}

// --- Task CRUD ---
export function getTasks(): Task[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return getDemoTasks()
  return JSON.parse(stored, (key, value) => {
    if (key === "createdAt" || key === "updatedAt" || key === "dueDate" || key === "completedAt") {
      return value ? new Date(value) : undefined
    }
    return value
  })
}

export function saveTasks(tasks: Task[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function addTask(task: Omit<Task, "id" | "createdAt" | "updatedAt" | "status" | "comments">): Task {
  const tasks = getTasks()
  const newTask: Task = {
    ...task,
    id: Date.now().toString(),
    status: "pendiente",
    createdAt: new Date(),
    updatedAt: new Date(),
    comments: [],
  }
  tasks.push(newTask)
  saveTasks(tasks)
  return newTask
}

export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const tasks = getTasks()
  const index = tasks.findIndex((t) => t.id === id)
  if (index === -1) return null

  const oldTask = tasks[index]
  const updatedFields = { ...updates }
  if (updates.status === "completada" && tasks[index].status !== "completada") {
    updatedFields.completedAt = new Date()
  }

  tasks[index] = { ...tasks[index], ...updatedFields, updatedAt: new Date() }
  saveTasks(tasks)
  const newTask = tasks[index]

  // Task assigned
  if (updates.assignedTo && updates.assignedTo.id !== oldTask.assignedTo?.id) {
    createNotification(updates.assignedTo.id, "task_assigned", "Nueva tarea asignada",
      `Se te ha asignado la tarea: "${newTask.title}"`, newTask.id, newTask.title,
      { priority: newTask.priority, status: newTask.status })

    const emp = getEmployeeById(updates.assignedTo.id)
    if (emp?.email) {
      queueEmail(() => sendTaskEmail(emp.email, emp.name, "task_assigned", newTask.title, newTask.id,
        `Se te ha asignado una nueva tarea: "${newTask.title}"`, { priority: newTask.priority, assignedBy: "Administrador" }))
    }
  }

  // Task completed
  if (updates.status === "completada" && oldTask.status !== "completada") {
    if (oldTask.requestedBy?.id) {
      createNotification(oldTask.requestedBy.id, "task_completed", "Tarea completada",
        `Tu solicitud "${newTask.title}" ha sido completada`, newTask.id, newTask.title, { status: newTask.status })
      if (oldTask.requestedBy.email) {
        queueEmail(() => sendTaskEmail(oldTask.requestedBy.email, oldTask.requestedBy.name, "task_completed",
          newTask.title, newTask.id, `Tu solicitud "${newTask.title}" ha sido completada satisfactoriamente.`))
      }
    }
  }

  // Task updated (status/priority changed)
  if ((updates.priority && updates.priority !== oldTask.priority) ||
    (updates.status && updates.status !== oldTask.status && updates.status !== "completada")) {
    if (newTask.assignedTo?.id) {
      createNotification(newTask.assignedTo.id, "task_updated", "Tarea actualizada",
        `La tarea "${newTask.title}" ha sido actualizada`, newTask.id, newTask.title,
        { priority: newTask.priority, status: newTask.status })
      const emp = getEmployeeById(newTask.assignedTo.id)
      if (emp?.email) {
        queueEmail(() => sendTaskEmail(emp.email, emp.name, "task_updated", newTask.title, newTask.id,
          `La tarea "${newTask.title}" ha sido actualizada. Revisa los cambios.`, { priority: newTask.priority }))
      }
    }
  }

  return tasks[index]
}

export function deleteTask(id: string): boolean {
  const tasks = getTasks()
  const filtered = tasks.filter((t) => t.id !== id)
  if (filtered.length === tasks.length) return false
  saveTasks(filtered)
  return true
}

export function addComment(taskId: string, comment: Omit<TaskComment, "id" | "createdAt">): TaskComment | null {
  const tasks = getTasks()
  const taskIndex = tasks.findIndex((t) => t.id === taskId)
  if (taskIndex === -1) return null

  const newComment: TaskComment = { ...comment, id: Date.now().toString(), createdAt: new Date() }
  tasks[taskIndex].comments.push(newComment)
  tasks[taskIndex].updatedAt = new Date()
  saveTasks(tasks)

  const task = tasks[taskIndex]

  // Notify assigned employee
  if (task.assignedTo?.id && task.assignedTo.id !== comment.userId) {
    createNotification(task.assignedTo.id, "task_comment", "Nuevo comentario",
      `${comment.userName} comento en "${task.title}"`, task.id, task.title)
    const emp = getEmployeeById(task.assignedTo.id)
    if (emp?.email) {
      queueEmail(() => sendTaskEmail(emp.email, emp.name, "task_comment", task.title, task.id,
        `${comment.userName} ha dejado un nuevo comentario en la tarea "${task.title}"`,
        { commentBy: comment.userName, commentText: comment.comment }))
    }
  }

  // Notify requester
  if (task.requestedBy?.id && task.requestedBy.id !== comment.userId) {
    createNotification(task.requestedBy.id, "task_comment", "Nuevo comentario",
      `${comment.userName} comento en tu solicitud "${task.title}"`, task.id, task.title)
    if (task.requestedBy.email) {
      queueEmail(() => sendTaskEmail(task.requestedBy.email, task.requestedBy.name, "task_comment", task.title, task.id,
        `${comment.userName} ha dejado un nuevo comentario en tu solicitud "${task.title}"`,
        { commentBy: comment.userName, commentText: comment.comment }))
    }
  }

  return newComment
}

// --- Archived tasks (completed > 30 days) ---
const ARCHIVE_KEY = "archived_tasks"

export function getArchivedTasks(): Task[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(ARCHIVE_KEY)
  if (!stored) return []
  return JSON.parse(stored, (key, value) => {
    if (key === "createdAt" || key === "updatedAt" || key === "dueDate" || key === "completedAt") {
      return value ? new Date(value) : undefined
    }
    return value
  })
}

function saveArchivedTasks(tasks: Task[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(tasks))
}

export function archiveOldTasks(): { archived: number } {
  const tasks = getTasks()
  const now = new Date()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
  const toArchive: Task[] = []
  const remaining: Task[] = []

  tasks.forEach((t) => {
    if (t.status === "completada" && t.completedAt && (now.getTime() - new Date(t.completedAt).getTime()) > thirtyDaysMs) {
      toArchive.push(t)
    } else {
      remaining.push(t)
    }
  })

  if (toArchive.length > 0) {
    const existing = getArchivedTasks()
    const existingIds = new Set(existing.map((t) => t.id))
    const newArchived = toArchive.filter((t) => !existingIds.has(t.id))
    saveArchivedTasks([...newArchived, ...existing])
    saveTasks(remaining)
  }

  return { archived: toArchive.length }
}

export function getTaskById(id: string): Task | null {
  const tasks = getTasks()
  const found = tasks.find((t) => t.id === id)
  if (found) return found
  // Also check archive
  const archived = getArchivedTasks()
  return archived.find((t) => t.id === id) || null
}

function getDemoTasks(): Task[] {
  return [
    {
      id: "1",
      title: "Reparacion de servidor principal",
      description: "El servidor de produccion presenta fallos intermitentes. Necesita revision urgente.",
      category: "infraestructura",
      priority: "urgente",
      status: "en_proceso",
      requestedBy: { id: "3", name: "Ana Martinez", department: "Produccion", email: "solicitante@empresa.com" },
      requesterName: "Ana Martinez",
      requesterDepartment: "produccion",
      assignedTo: { id: "2", name: "Maria Gonzalez" },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      comments: [
        { id: "1", userId: "1", userName: "Administrador", comment: "Revisando el problema. Parece ser un tema de memoria RAM.", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      ],
    },
    {
      id: "2",
      title: "Instalacion de nuevo software contable",
      description: "Solicito la instalacion del software de contabilidad en mi estacion de trabajo.",
      category: "ti",
      priority: "media",
      status: "pendiente",
      requestedBy: { id: "3", name: "Ana Martinez", department: "Produccion", email: "solicitante@empresa.com" },
      requesterName: "Ana Martinez",
      requesterDepartment: "produccion",
      assignedTo: { id: "3", name: "Juan Perez" },
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      comments: [],
    },
    {
      id: "3",
      title: "Mantenimiento de red electrica",
      description: "Revision preventiva del sistema electrico de la planta.",
      category: "infraestructura",
      priority: "alta",
      status: "completada",
      requestedBy: { id: "100", name: "Juan Garcia", department: "Mantenimiento", email: "juan@empresa.com" },
      requesterName: "Juan Garcia",
      requesterDepartment: "mantenimiento",
      assignedTo: { id: "2", name: "Maria Gonzalez" },
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      comments: [],
    },
    {
      id: "4",
      title: "Actualizacion de antivirus corporativo",
      description: "Actualizar todos los equipos con la ultima version del antivirus.",
      category: "ti",
      priority: "media",
      status: "pendiente",
      requestedBy: { id: "101", name: "Laura Lopez", department: "Recursos Humanos", email: "laura@empresa.com" },
      requesterName: "Laura Lopez",
      requesterDepartment: "recursos_humanos",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      comments: [],
    },
    {
      id: "5",
      title: "Reparacion de aire acondicionado",
      description: "El sistema de climatizacion de la oficina no funciona correctamente.",
      category: "infraestructura",
      priority: "urgente",
      status: "pendiente",
      requestedBy: { id: "102", name: "Pedro Sanchez", department: "Administracion", email: "pedro@empresa.com" },
      requesterName: "Pedro Sanchez",
      requesterDepartment: "administracion",
      assignedTo: { id: "4", name: "Ana Martinez" },
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      comments: [],
    },
  ]
}
