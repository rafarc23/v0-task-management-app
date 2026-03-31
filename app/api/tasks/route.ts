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

// GET all tasks
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const archived = searchParams.get('archived') === 'true'
    const employeeId = searchParams.get('employee')
    const status = searchParams.get('status')

    let tasks
    
    if (archived) {
      tasks = await sql`
        SELECT t.*, 
          e.id as emp_id, e.name as emp_name, e.email as emp_email, e.color as emp_color, e.avatar as emp_avatar,
          u.id as req_id, u.name as req_name, u.avatar as req_avatar,
          p.id as proj_id, p.name as proj_name, p.color as proj_color
        FROM tasks t
        LEFT JOIN employees e ON t.assigned_to_id = e.id
        LEFT JOIN users u ON t.requested_by_id = u.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.is_archived = true
        ORDER BY t.updated_at DESC
      `
    } else {
      tasks = await sql`
        SELECT t.*, 
          e.id as emp_id, e.name as emp_name, e.email as emp_email, e.color as emp_color, e.avatar as emp_avatar,
          u.id as req_id, u.name as req_name, u.avatar as req_avatar,
          p.id as proj_id, p.name as proj_name, p.color as proj_color
        FROM tasks t
        LEFT JOIN employees e ON t.assigned_to_id = e.id
        LEFT JOIN users u ON t.requested_by_id = u.id
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.is_archived = false
        ORDER BY t.created_at DESC
      `
    }

    // Transform to expected format
    const formattedTasks = tasks.map(t => ({
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
        avatar: t.emp_avatar
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
      attachments: [],
      comments: [],
      history: []
    }))

    // Filter by employee or status if requested
    let filteredTasks = formattedTasks
    if (employeeId && employeeId !== 'all') {
      filteredTasks = filteredTasks.filter(t => t.assignedTo?.id === employeeId)
    }
    if (status) {
      filteredTasks = filteredTasks.filter(t => t.status === status)
    }

    return NextResponse.json(filteredTasks)
  } catch (error) {
    console.error('Get tasks error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST create new task
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { title, description, priority, dueDate, dueTime, assignedToId, projectId, attachments } = await request.json()

    if (!title || !description) {
      return NextResponse.json({ error: 'Título y descripción son requeridos' }, { status: 400 })
    }

    const taskId = generateUUID()
    
    await sql`
      INSERT INTO tasks (id, title, description, status, priority, due_date, due_time, assigned_to_id, requested_by_id, project_id, is_archived, created_at, updated_at)
      VALUES (${taskId}, ${title}, ${description}, 'pendiente', ${priority || 'media'}, ${dueDate || null}, ${dueTime || null}, ${assignedToId || null}, ${user.id}, ${projectId || null}, false, NOW(), NOW())
    `

    // Add attachments if any
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        await sql`
          INSERT INTO task_attachments (id, task_id, type, url, name, created_at)
          VALUES (${generateUUID()}, ${taskId}, ${att.type}, ${att.url}, ${att.name || null}, NOW())
        `
      }
    }

    // Add history entry
    await sql`
      INSERT INTO task_history (id, task_id, user_id, user_name, action, details, created_at)
      VALUES (${generateUUID()}, ${taskId}, ${user.id}, ${user.name}, 'created', 'Tarea creada', NOW())
    `

    // Create notification for assigned employee if any
    if (assignedToId) {
      const employee = await sql`SELECT user_id FROM employees WHERE id = ${assignedToId}`
      if (employee.length > 0 && employee[0].user_id) {
        await sql`
          INSERT INTO notifications (id, user_id, type, title, message, task_id, is_read, created_at)
          VALUES (${generateUUID()}, ${employee[0].user_id}, 'task_assigned', 'Nueva tarea asignada', ${title}, ${taskId}, false, NOW())
        `
      }
    }

    return NextResponse.json({ id: taskId, success: true }, { status: 201 })
  } catch (error) {
    console.error('Create task error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
