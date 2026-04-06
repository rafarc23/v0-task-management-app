import { NextRequest, NextResponse } from 'next/server'
import { query, generateUUID } from '@/lib/db'
import { cookies } from 'next/headers'

// Helper to verify admin session
async function verifyAdmin() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value
  
  if (!sessionToken) return null
  
  const sessions = await query<{ id: string; role: string }>(
    `SELECT u.id, u.role
     FROM sessions s
     JOIN users u ON s.user_id = u.id
     WHERE s.token = $1
     AND s.expires_at > NOW()
     AND u.is_active = true`,
    [sessionToken]
  )
  
  if (sessions.length === 0 || sessions[0].role !== 'admin') return null
  return sessions[0]
}

// GET all users
export async function GET() {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const users = await query(
      `SELECT id, username, email, name, role, avatar, is_active, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    )

    return NextResponse.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { username, email, name, password, role } = await request.json()

    if (!username || !email || !name || !password) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }

    // Check if username or email already exists
    const existing = await query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    )
    
    if (existing.length > 0) {
      return NextResponse.json({ error: 'El usuario o email ya existe' }, { status: 400 })
    }

    const id = generateUUID()
    
    await query(
      `INSERT INTO users (id, username, email, name, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())`,
      [id, username, email, name, password, role || 'employee']
    )

    const newUser = await query(
      `SELECT id, username, email, name, role, avatar, is_active, created_at
       FROM users WHERE id = $1`,
      [id]
    )

    return NextResponse.json(newUser[0], { status: 201 })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
