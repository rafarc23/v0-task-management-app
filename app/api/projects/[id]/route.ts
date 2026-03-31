import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// GET single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const projects = await sql`
      SELECT id, name, description, color, is_active, created_at
      FROM projects WHERE id = ${id}
    `

    if (projects.length === 0) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
    }

    return NextResponse.json(projects[0])
  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// PUT update project
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { name, description, color, is_active } = await request.json()

    await sql`
      UPDATE projects 
      SET name = ${name}, description = ${description}, color = ${color}, is_active = ${is_active}
      WHERE id = ${id}
    `

    const updatedProject = await sql`
      SELECT id, name, description, color, is_active, created_at
      FROM projects WHERE id = ${id}
    `

    return NextResponse.json(updatedProject[0])
  } catch (error) {
    console.error('Update project error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE project (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await sql`UPDATE projects SET is_active = false WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
