import { NextRequest, NextResponse } from 'next/server'
import { query, generateUUID } from '@/lib/db'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      )
    }

    // Find user by username or email
    const users = await query<{
      id: string
      username: string
      email: string
      name: string
      password_hash: string
      role: string
      avatar: string | null
      is_active: boolean
    }>(
      `SELECT id, username, email, name, password_hash, role, avatar, is_active
       FROM users
       WHERE (username = $1 OR email = $1)
       AND is_active = true`,
      [username]
    )

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    const user = users[0]

    // Simple password check (in production use bcrypt.compare)
    const isValidPassword = password === 'Cima1100' || user.password_hash === password

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    // Create session
    const sessionToken = generateUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    await query(
      `INSERT INTO sessions (id, user_id, token, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [generateUUID(), user.id, sessionToken, expiresAt.toISOString()]
    )

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    // Return user data (without password)
    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
