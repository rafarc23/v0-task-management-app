import { NextRequest, NextResponse } from 'next/server'
import { query, generateUUID } from '@/lib/db'
import { cookies } from 'next/headers'

// Helper to get current user from session
async function getCurrentUser() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  
  if (!sessionToken) return null
  
  const sessions = await query<{
    id: string
    username: string
    name: string
    role: string
    avatar: string | null
  }>(
    `SELECT u.id, u.username, u.name, u.role, u.avatar
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token = $1
     AND s.expires_at > NOW()
     AND u.is_active = true`,
    [sessionToken]
  )
  
  if (sessions.length === 0) return null
  return sessions[0]
}

// GET single task with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const tasks = await query(
      `SELECT t.*, 
        e.id as emp_id, e.name as emp_name, e.email as emp_email, e.color as emp_color, e.avatar as emp_avatar, e.role as emp_role,
        u.id as req_id, u.name as req_name, u.avatar as req_avatar,
        p.id as proj_id, p.name as proj_name, p.color as proj_color
       FROM tasks t
       LEFT JOIN employees e ON t.assigned_to_id = e.id
       LEFT JOIN users u ON t.requested_by_id = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.id = $1`,
      [id]
    )

    if (tasks.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    const t = tasks[0] as Record<string, unknown>

    // Get attachments
    const attachments = await query(
      `SELECT id, type, url, name, created_at
       FROM task_attachments
       WHERE task_id = $1
       ORDER BY created_at ASC`,
      [id]
    )

    // Get comments
    const comments = await query(
      `SELECT id, user_id, user_name, user_avatar, text, created_at
       FROM task_comments
       WHERE task_id = $1
       ORDER BY created_at ASC`,
      [id]
    )

    // Get history
    const history = await query(
      `SELECT id, user_id, user_name, action, details, created_at
       FROM task_history
       WHERE task_id = $1
       ORDER BY created_at DESC`,
      [id]
    )

    const task = {
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.due_date,
      dueTime: t.due_time,
      isArchived: t.is_archived,
      completedAt: t.completed_at,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      assignedTo: t.emp_id ? {
        id: t.emp_id,
        name: t.emp_name,
        email: t.emp_email,
        color: t.emp_color,
        avatar: t.emp_avatar,
        role: t.emp_role
      } : null,
      requestedBy: {
        id: t.req_id,
        name: t.req_name,
        avatar: t.req_avatar
      },
      project: t.proj_id ? {
        id: t.proj_id,
        name: t.proj_name,
        color: t.proj_color
      } : null,
      attachments: (attachments as Record<string, unknown>[]).map(a => ({
        id: a.id,
        type: a.type,
        url: a.url,
        name: a.name,
        createdAt: a.created_at
      })),
      comments: (comments as Record<string, unknown>[]).map(c => ({
        id: c.id,
        userId: c.user_id,
        userName: c.user_name,
        userAvatar: c.user_avatar,
        text: c.text,
        createdAt: c.created_at
      })),
      history: (history as Record<string, unknown>[]).map(h => ({
        id: h.id,
        userId: h.user_id,
        userName: h.user_name,
        action: h.action,
        details: h.details,
        createdAt: h.created_at
      }))
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Get task error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT update task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, status, priority, dueDate, dueTime, assignedToId, projectId, isArchived } = body

    // Get current task state for history
    const currentTask = await query<Record<string, unknown>>('SELECT * FROM tasks WHERE id = $1', [id])
    if (currentTask.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    const oldTask = currentTask[0]
    const changes: string[] = []

    if (title !== undefined && title !== oldTask.title) changes.push(`Título cambiado`)
    if (description !== undefined && description !== oldTask.description) changes.push(`Descripción actualizada`)
    if (status !== undefined && status !== oldTask.status) changes.push(`Estado: ${oldTask.status} → ${status}`)
    if (priority !== undefined && priority !== oldTask.priority) changes.push(`Prioridad: ${oldTask.priority} → ${priority}`)
    if (assignedToId !== undefined && assignedToId !== oldTask.assigned_to_id) changes.push(`Asignación cambiada`)

    // Update task
    const completedAt = status === 'completada' && oldTask.status !== 'completada' ? new Date().toISOString() : oldTask.completed_at

    await query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           due_date = $5,
           due_time = $6,
           assigned_to_id = $7,
           project_id = $8,
           is_archived = COALESCE($9, is_archived),
           completed_at = $10,
           updated_at = NOW()
       WHERE id = $11`,
      [
        title, 
        description, 
        status, 
        priority, 
        dueDate !== undefined ? dueDate : oldTask.due_date, 
        dueTime !== undefined ? dueTime : oldTask.due_time, 
        assignedToId !== undefined ? assignedToId : oldTask.assigned_to_id, 
        projectId !== undefined ? projectId : oldTask.project_id, 
        isArchived, 
        completedAt, 
        id
      ]
    )

    // Add history entry if there were changes
    if (changes.length > 0) {
      await query(
        `INSERT INTO task_history (id, task_id, user_id, user_name, action, details, created_at)
         VALUES ($1, $2, $3, $4, 'updated', $5, NOW())`,
        [generateUUID(), id, user.id, user.name, changes.join(', ')]
      )
    }

    // Create notification if task was assigned to someone new
    if (assignedToId && assignedToId !== oldTask.assigned_to_id) {
      const employee = await query<{ user_id: string | null }>('SELECT user_id FROM employees WHERE id = $1', [assignedToId])
      if (employee.length > 0 && employee[0].user_id) {
        await query(
          `INSERT INTO notifications (id, user_id, type, title, message, task_id, is_read, created_at)
           VALUES ($1, $2, 'task_assigned', 'Tarea asignada', $3, $4, false, NOW())`,
          [generateUUID(), employee[0].user_id, title || oldTask.title, id]
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update task error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await query('DELETE FROM tasks WHERE id = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
