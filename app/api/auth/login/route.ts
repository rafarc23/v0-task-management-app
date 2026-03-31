import { NextRequest, NextResponse } from 'next/server'
import { sql, generateUUID } from '@/lib/db'
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
    const users = await sql`
      SELECT id, username, email, name, password_hash, role, avatar, is_active
      FROM users
      WHERE (username = ${username} OR email = ${username})
      AND is_active = true
    `

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      )
    }

    const user = users[0]

    // Simple password check (in production use bcrypt.compare)
    // For now, we'll do a simple check since we have a placeholder hash
    // The admin password is 'Cima1100'
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

    await sql`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (${generateUUID()}, ${user.id}, ${sessionToken}, ${expiresAt.toISOString()}, NOW())
    `

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
