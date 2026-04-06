import { NextRequest, NextResponse } from 'next/server'
import { query, generateUUID } from '@/lib/db'

// GET all employees
export async function GET() {
  try {
    const employees = await query(
      `SELECT id, user_id, name, email, role, avatar, color, is_active, created_at
       FROM employees
       WHERE is_active = true
       ORDER BY name ASC`
    )

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
    
    await query(
      `INSERT INTO employees (id, name, email, role, color, avatar, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, NOW())`,
      [id, name, email, role || 'Empleado', color || '#3b82f6', avatar || null]
    )

    const newEmployee = await query(
      `SELECT id, user_id, name, email, role, avatar, color, is_active, created_at
       FROM employees WHERE id = $1`,
      [id]
    )

    return NextResponse.json(newEmployee[0], { status: 201 })
  } catch (error) {
    console.error('Create employee error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
