import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { cookies } from 'next/headers'

// Helper to verify admin session
async function verifyAdmin() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  
  if (!sessionToken) return null
  
  const sessions = await sql`
    SELECT u.id, u.role, u.username
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ${sessionToken}
    AND s.expires_at > NOW()
    AND u.is_active = true
  `
  
  if (sessions.length === 0 || sessions[0].role !== 'admin') return null
  return sessions[0]
}

// GET single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const users = await sql`
      SELECT id, username, email, name, role, avatar, is_active, created_at, updated_at
      FROM users WHERE id = ${id}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json(users[0])
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { username, email, name, role, is_active, password } = await request.json()

    // Check if trying to modify the main admin user's role
    const targetUser = await sql`SELECT username FROM users WHERE id = ${id}`
    if (targetUser.length > 0 && targetUser[0].username === 'admin' && role !== 'admin') {
      return NextResponse.json({ error: 'No se puede cambiar el rol del administrador principal' }, { status: 400 })
    }

    // Build update query
    if (password) {
      await sql`
        UPDATE users 
        SET username = ${username}, email = ${email}, name = ${name}, 
            role = ${role}, is_active = ${is_active}, password_hash = ${password}, updated_at = NOW()
        WHERE id = ${id}
      `
    } else {
      await sql`
        UPDATE users 
        SET username = ${username}, email = ${email}, name = ${name}, 
            role = ${role}, is_active = ${is_active}, updated_at = NOW()
        WHERE id = ${id}
      `
    }

    const updatedUser = await sql`
      SELECT id, username, email, name, role, avatar, is_active, created_at, updated_at
      FROM users WHERE id = ${id}
    `

    return NextResponse.json(updatedUser[0])
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Check if trying to delete the main admin user
    const targetUser = await sql`SELECT username FROM users WHERE id = ${id}`
    if (targetUser.length > 0 && targetUser[0].username === 'admin') {
      return NextResponse.json({ error: 'No se puede eliminar el administrador principal' }, { status: 400 })
    }

    await sql`DELETE FROM users WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
