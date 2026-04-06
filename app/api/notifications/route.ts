import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
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

// GET notifications for current user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const notifications = await query(
      `SELECT id, type, title, message, task_id, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [user.id]
    )

    const unreadCount = await query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM notifications
       WHERE user_id = $1 AND is_read = false`,
      [user.id]
    )

    return NextResponse.json({
      notifications: (notifications as Record<string, unknown>[]).map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        taskId: n.task_id,
        isRead: n.is_read,
        createdAt: n.created_at
      })),
      unreadCount: Number(unreadCount[0].count)
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT mark notifications as read
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { notificationId, markAllRead } = await request.json()

    if (markAllRead) {
      await query('UPDATE notifications SET is_read = true WHERE user_id = $1', [user.id])
    } else if (notificationId) {
      await query(
        'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2',
        [notificationId, user.id]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update notifications error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
