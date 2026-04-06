import { NextRequest, NextResponse } from 'next/server'
import { query, generateUUID } from '@/lib/db'

// GET all projects
export async function GET() {
  try {
    const projects = await query(
      `SELECT id, name, description, color, is_active, created_at
       FROM projects
       WHERE is_active = true
       ORDER BY name ASC`
    )

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// POST create new project
export async function POST(request: NextRequest) {
  try {
    const { name, description, color } = await request.json()

    if (!name) {
      return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 })
    }

    const id = generateUUID()
    
    await query(
      `INSERT INTO projects (id, name, description, color, is_active, created_at)
       VALUES ($1, $2, $3, $4, true, NOW())`,
      [id, name, description || '', color || '#3b82f6']
    )

    const newProject = await query(
      `SELECT id, name, description, color, is_active, created_at
       FROM projects WHERE id = $1`,
      [id]
    )

    return NextResponse.json(newProject[0], { status: 201 })
  } catch (error) {
    console.error('Create project error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
