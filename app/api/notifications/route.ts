import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
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

// GET notifications for current user
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const notifications = await sql`
      SELECT id, type, title, message, task_id, is_read, created_at
      FROM notifications
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 50
    `

    const unreadCount = await sql`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ${user.id} AND is_read = false
    `

    return NextResponse.json({
      notifications: notifications.map(n => ({
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
      await sql`
        UPDATE notifications SET is_read = true
        WHERE user_id = ${user.id}
      `
    } else if (notificationId) {
      await sql`
        UPDATE notifications SET is_read = true
        WHERE id = ${notificationId} AND user_id = ${user.id}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update notifications error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
