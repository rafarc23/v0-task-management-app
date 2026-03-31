import { NextRequest, NextResponse } from 'next/server'
import { sql, generateUUID } from '@/lib/db'
import { cookies } from 'next/headers'

// Helper to get current user from session
async function getCurrentUser() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  
  if (!sessionToken) return null
  
  const sessions = await sql`
    SELECT u.id, u.username, u.name, u.role, u.avatar
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ${sessionToken}
    AND s.expires_at > NOW()
    AND u.is_active = true
  `
  
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

    const tasks = await sql`
      SELECT t.*, 
        e.id as emp_id, e.name as emp_name, e.email as emp_email, e.color as emp_color, e.avatar as emp_avatar, e.role as emp_role,
        u.id as req_id, u.name as req_name, u.avatar as req_avatar,
        p.id as proj_id, p.name as proj_name, p.color as proj_color
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to_id = e.id
      LEFT JOIN users u ON t.requested_by_id = u.id
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ${id}
    `

    if (tasks.length === 0) {
      return NextResponse.json({ error: 'Tarea no encontrada' }, { status: 404 })
    }

    const t = tasks[0]

    // Get attachments
    const attachments = await sql`
      SELECT id, type, url, name, created_at
      FROM task_attachments
      WHERE task_id = ${id}
      ORDER BY created_at ASC
    `

    // Get comments
    const comments = await sql`
      SELECT id, user_id, user_name, user_avatar, text, created_at
      FROM task_comments
      WHERE task_id = ${id}
      ORDER BY created_at ASC
    `

    // Get history
    const history = await sql`
      SELECT id, user_id, user_name, action, details, created_at
      FROM task_history
      WHERE task_id = ${id}
      ORDER BY created_at DESC
    `

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
      attachments: attachments.map(a => ({
        id: a.id,
        type: a.type,
        url: a.url,
        name: a.name,
        createdAt: a.created_at
      })),
      comments: comments.map(c => ({
        id: c.id,
        userId: c.user_id,
        userName: c.user_name,
        userAvatar: c.user_avatar,
        text: c.text,
        createdAt: c.created_at
      })),
      history: history.map(h => ({
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
    const currentTask = await sql`SELECT * FROM tasks WHERE id = ${id}`
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

    await sql`
      UPDATE tasks 
      SET title = COALESCE(${title}, title),
          description = COALESCE(${description}, description),
          status = COALESCE(${status}, status),
          priority = COALESCE(${priority}, priority),
          due_date = ${dueDate !== undefined ? dueDate : oldTask.due_date},
          due_time = ${dueTime !== undefined ? dueTime : oldTask.due_time},
          assigned_to_id = ${assignedToId !== undefined ? assignedToId : oldTask.assigned_to_id},
          project_id = ${projectId !== undefined ? projectId : oldTask.project_id},
          is_archived = COALESCE(${isArchived}, is_archived),
          completed_at = ${completedAt},
          updated_at = NOW()
      WHERE id = ${id}
    `

    // Add history entry if there were changes
    if (changes.length > 0) {
      await sql`
        INSERT INTO task_history (id, task_id, user_id, user_name, action, details, created_at)
        VALUES (${generateUUID()}, ${id}, ${user.id}, ${user.name}, 'updated', ${changes.join(', ')}, NOW())
      `
    }

    // Create notification if task was assigned to someone new
    if (assignedToId && assignedToId !== oldTask.assigned_to_id) {
      const employee = await sql`SELECT user_id FROM employees WHERE id = ${assignedToId}`
      if (employee.length > 0 && employee[0].user_id) {
        await sql`
          INSERT INTO notifications (id, user_id, type, title, message, task_id, is_read, created_at)
          VALUES (${generateUUID()}, ${employee[0].user_id}, 'task_assigned', 'Tarea asignada', ${title || oldTask.title}, ${id}, false, NOW())
        `
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

    await sql`DELETE FROM tasks WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete task error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
