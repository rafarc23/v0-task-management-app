import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// GET single employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const employees = await sql`
      SELECT id, user_id, name, email, role, avatar, color, is_active, created_at
      FROM employees WHERE id = ${id}
    `

    if (employees.length === 0) {
      return NextResponse.json({ error: 'Empleado no encontrado' }, { status: 404 })
    }

    return NextResponse.json(employees[0])
  } catch (error) {
    console.error('Get employee error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT update employee
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, email, role, color, avatar, is_active } = await request.json()

    await sql`
      UPDATE employees 
      SET name = ${name}, email = ${email}, role = ${role}, 
          color = ${color}, avatar = ${avatar}, is_active = ${is_active}
      WHERE id = ${id}
    `

    const updatedEmployee = await sql`
      SELECT id, user_id, name, email, role, avatar, color, is_active, created_at
      FROM employees WHERE id = ${id}
    `

    return NextResponse.json(updatedEmployee[0])
  } catch (error) {
    console.error('Update employee error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE employee (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await sql`UPDATE employees SET is_active = false WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete employee error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
