import type { Notification } from "./types"

const STORAGE_KEY = "notifications"

export function getNotifications(): Notification[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  return JSON.parse(stored, (key, value) => {
    if (key === "createdAt") {
      return value ? new Date(value) : undefined
    }
    return value
  })
}

export function saveNotifications(notifications: Notification[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
}

export function getUserNotifications(userId: string): Notification[] {
  const notifications = getNotifications()
  return notifications.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export function getUnreadCount(userId: string): number {
  const notifications = getUserNotifications(userId)
  return notifications.filter((n) => !n.read).length
}

export function createNotification(
  userId: string,
  type: Notification["type"],
  title: string,
  message: string,
  taskId?: string,
  taskTitle?: string,
  metadata?: Notification["metadata"],
): Notification {
  const notifications = getNotifications()
  const newNotification: Notification = {
    id: Date.now().toString(),
    userId,
    type,
    title,
    message,
    taskId,
    taskTitle,
    read: false,
    createdAt: new Date(),
    metadata,
  }
  notifications.push(newNotification)
  saveNotifications(notifications)

  // Simular envío de email/Slack (en producción, llamar a API)
  console.log("[v0] Notification created:", newNotification)
  simulateExternalNotification(newNotification)

  return newNotification
}

export function markAsRead(notificationId: string): boolean {
  const notifications = getNotifications()
  const notification = notifications.find((n) => n.id === notificationId)
  if (!notification) return false
  notification.read = true
  saveNotifications(notifications)
  return true
}

export function markAllAsRead(userId: string): void {
  const notifications = getNotifications()
  notifications.forEach((n) => {
    if (n.userId === userId) {
      n.read = true
    }
  })
  saveNotifications(notifications)
}

export function deleteNotification(notificationId: string): boolean {
  const notifications = getNotifications()
  const filtered = notifications.filter((n) => n.id !== notificationId)
  if (filtered.length === notifications.length) return false
  saveNotifications(filtered)
  return true
}

// Simulación de notificaciones externas (Email/Slack)
function simulateExternalNotification(notification: Notification) {
  // En producción, aquí se llamaría a:
  // - API de Email (SendGrid, Resend, etc.)
  // - API de Slack (webhook o Slack SDK)

  console.log("[v0] 📧 Email notification would be sent:")
  console.log(`To: User ${notification.userId}`)
  console.log(`Subject: ${notification.title}`)
  console.log(`Body: ${notification.message}`)

  console.log("[v0] 💬 Slack notification would be sent:")
  console.log(`Channel: @user_${notification.userId}`)
  console.log(`Message: ${notification.title} - ${notification.message}`)
}
