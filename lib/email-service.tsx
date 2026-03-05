// Email notification service
// Sends email notifications when tasks are assigned, updated, or commented

export type EmailType = "task_assigned" | "task_updated" | "task_comment" | "task_completed"

interface EmailPayload {
  to: string
  recipientName: string
  type: EmailType
  taskTitle: string
  taskId: string
  message: string
  priority?: string
  assignedBy?: string
  commentBy?: string
  commentText?: string
}

function generateEmailHtml(payload: EmailPayload): string {
  const priorityColors: Record<string, string> = {
    urgente: "#ef4444",
    alta: "#f97316",
    media: "#3b82f6",
    baja: "#94a3b8",
  }

  const typeConfig: Record<EmailType, { icon: string; title: string; color: string }> = {
    task_assigned: { icon: "&#128203;", title: "Nueva Tarea Asignada", color: "#3b82f6" },
    task_updated: { icon: "&#128260;", title: "Tarea Actualizada", color: "#f59e0b" },
    task_comment: { icon: "&#128172;", title: "Nuevo Comentario", color: "#8b5cf6" },
    task_completed: { icon: "&#9989;", title: "Tarea Completada", color: "#10b981" },
  }

  const config = typeConfig[payload.type]
  const prioColor = payload.priority ? priorityColors[payload.priority] || "#94a3b8" : "#94a3b8"

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,${config.color},${config.color}dd);padding:30px;border-radius:16px 16px 0 0;text-align:center;">
      <div style="font-size:48px;margin-bottom:10px;">${config.icon}</div>
      <h1 style="color:white;margin:0;font-size:24px;">${config.title}</h1>
    </div>
    <div style="background:white;padding:30px;border-radius:0 0 16px 16px;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
      <p style="color:#475569;font-size:16px;margin-top:0;">Hola <strong>${payload.recipientName}</strong>,</p>
      <p style="color:#475569;font-size:15px;">${payload.message}</p>
      <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:20px;margin:20px 0;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <strong style="color:#1e293b;font-size:18px;">${payload.taskTitle}</strong>
        </div>
        ${payload.priority ? `
        <div style="margin-bottom:8px;">
          <span style="background:${prioColor};color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:bold;text-transform:uppercase;">
            ${payload.priority}
          </span>
        </div>
        ` : ""}
        ${payload.assignedBy ? `<p style="color:#64748b;font-size:13px;margin:8px 0 0;">Asignado por: <strong>${payload.assignedBy}</strong></p>` : ""}
        ${payload.commentBy ? `
        <div style="margin-top:12px;padding:12px;background:white;border-left:3px solid ${config.color};border-radius:0 8px 8px 0;">
          <p style="color:#64748b;font-size:12px;margin:0 0 4px;"><strong>${payload.commentBy}</strong> comento:</p>
          <p style="color:#334155;font-size:14px;margin:0;">"${payload.commentText}"</p>
        </div>
        ` : ""}
      </div>
      <p style="color:#94a3b8;font-size:12px;text-align:center;margin-bottom:0;">
        Sistema de Gestion de Tareas - Departamento de Infraestructura y TI
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function sendEmailNotification(payload: EmailPayload): Promise<{ sent: boolean; method: string }> {
  try {
    const html = generateEmailHtml(payload)

    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: payload.to,
        subject: `[Tareas] ${payload.type === "task_assigned" ? "Nueva tarea asignada" : payload.type === "task_comment" ? "Nuevo comentario" : payload.type === "task_completed" ? "Tarea completada" : "Tarea actualizada"}: ${payload.taskTitle}`,
        html,
        type: payload.type,
      }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error("[v0] Failed to send email:", error)
    return { sent: false, method: "error" }
  }
}
