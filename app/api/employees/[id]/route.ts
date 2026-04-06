import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET single employee
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const employees = await query(
      `SELECT id, user_id, name, email, role, avatar, color, is_active, created_at
       FROM employees WHERE id = $1`,
      [id]
    )

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

    await query(
      `UPDATE employees 
       SET name = $1, email = $2, role = $3, color = $4, avatar = $5, is_active = $6
       WHERE id = $7`,
      [name, email, role, color, avatar, is_active, id]
    )

    const updatedEmployee = await query(
      `SELECT id, user_id, name, email, role, avatar, color, is_active, created_at
       FROM employees WHERE id = $1`,
      [id]
    )

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
    await query('UPDATE employees SET is_active = false WHERE id = $1', [id])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete employee error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
