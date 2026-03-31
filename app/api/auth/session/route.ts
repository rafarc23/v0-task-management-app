import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')?.value

    if (!sessionToken) {
      return NextResponse.json({ user: null })
    }

    // Find session and user
    const sessions = await sql`
      SELECT s.*, u.id as user_id, u.username, u.email, u.name, u.role, u.avatar, u.is_active
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ${sessionToken}
      AND s.expires_at > NOW()
      AND u.is_active = true
    `

    if (sessions.length === 0) {
      // Invalid or expired session, clear cookie
      cookieStore.delete('session_token')
      return NextResponse.json({ user: null })
    }

    const session = sessions[0]

    return NextResponse.json({
      user: {
        id: session.user_id,
        username: session.username,
        email: session.email,
        name: session.name,
        role: session.role,
        avatar: session.avatar,
      }
    })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null })
  }
}
