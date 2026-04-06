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

// POST add comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'El texto es requerido' }, { status: 400 })
    }

    const commentId = generateUUID()

    await query(
      `INSERT INTO task_comments (id, task_id, user_id, user_name, user_avatar, text, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [commentId, taskId, user.id, user.name, user.avatar || null, text]
    )

    // Add history entry
    await query(
      `INSERT INTO task_history (id, task_id, user_id, user_name, action, details, created_at)
       VALUES ($1, $2, $3, $4, 'comment', 'Comentario añadido', NOW())`,
      [generateUUID(), taskId, user.id, user.name]
    )

    const comment = await query<{
      id: string
      user_id: string
      user_name: string
      user_avatar: string | null
      text: string
      created_at: string
    }>(
      `SELECT id, user_id, user_name, user_avatar, text, created_at
       FROM task_comments WHERE id = $1`,
      [commentId]
    )

    return NextResponse.json({
      id: comment[0].id,
      userId: comment[0].user_id,
      userName: comment[0].user_name,
      userAvatar: comment[0].user_avatar,
      text: comment[0].text,
      createdAt: comment[0].created_at
    }, { status: 201 })
  } catch (error) {
    console.error('Add comment error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
