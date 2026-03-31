import { NextRequest, NextResponse } from 'next/server'
import { sql, generateUUID } from '@/lib/db'

// GET all employees
export async function GET() {
  try {
    const employees = await sql`
      SELECT id, user_id, name, email, role, avatar, color, is_active, created_at
      FROM employees
      WHERE is_active = true
      ORDER BY name ASC
    `

    return NextResponse.json(employees)
  } catch (error) {
    console.error('Get employees error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST create new employee
export async function POST(request: NextRequest) {
  try {
    const { name, email, role, color, avatar } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Nombre y email son requeridos' }, { status: 400 })
    }

    const id = generateUUID()
    
    await sql`
      INSERT INTO employees (id, name, email, role, color, avatar, is_active, created_at)
      VALUES (${id}, ${name}, ${email}, ${role || 'Empleado'}, ${color || '#3b82f6'}, ${avatar || null}, true, NOW())
    `

    const newEmployee = await sql`
      SELECT id, user_id, name, email, role, avatar, color, is_active, created_at
      FROM employees WHERE id = ${id}
    `

    return NextResponse.json(newEmployee[0], { status: 201 })
  } catch (error) {
    console.error('Create employee error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
