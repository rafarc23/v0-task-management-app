import type { Project, ProjectDocument, ProjectMilestone } from "./types"

const STORAGE_KEY = "projects"

export function getProjects(): Project[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  const projects = JSON.parse(stored)
  return projects.map((p: any) => ({
    ...p,
    startDate: new Date(p.startDate),
    endDate: p.endDate ? new Date(p.endDate) : undefined,
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
    milestones: p.milestones.map((m: any) => ({
      ...m,
      dueDate: new Date(m.dueDate),
      completedAt: m.completedAt ? new Date(m.completedAt) : undefined,
    })),
    documents: p.documents.map((d: any) => ({
      ...d,
      uploadedAt: new Date(d.uploadedAt),
    })),
  }))
}

function saveProjects(projects: Project[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

export function getProjectById(id: string): Project | null {
  const projects = getProjects()
  return projects.find((p) => p.id === id) || null
}

export function addProject(data: Omit<Project, "id" | "createdAt" | "updatedAt">): Project {
  const newProject: Project = {
    ...data,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const projects = getProjects()
  projects.push(newProject)
  saveProjects(projects)
  return newProject
}

export function updateProject(id: string, data: Partial<Project>): Project | null {
  const projects = getProjects()
  const index = projects.findIndex((p) => p.id === id)
  if (index === -1) return null

  projects[index] = {
    ...projects[index],
    ...data,
    updatedAt: new Date(),
  }
  saveProjects(projects)
  return projects[index]
}

export function deleteProject(id: string): boolean {
  const projects = getProjects()
  const filtered = projects.filter((p) => p.id !== id)
  if (filtered.length === projects.length) return false
  saveProjects(filtered)
  return true
}

export function addDocument(projectId: string, document: Omit<ProjectDocument, "id">): ProjectDocument | null {
  const projects = getProjects()
  const project = projects.find((p) => p.id === projectId)
  if (!project) return null

  const newDocument: ProjectDocument = {
    ...document,
    id: Date.now().toString(),
  }

  project.documents.push(newDocument)
  project.updatedAt = new Date()
  saveProjects(projects)
  return newDocument
}

export function addMilestone(projectId: string, milestone: Omit<ProjectMilestone, "id">): ProjectMilestone | null {
  const projects = getProjects()
  const project = projects.find((p) => p.id === projectId)
  if (!project) return null

  const newMilestone: ProjectMilestone = {
    ...milestone,
    id: Date.now().toString(),
  }

  project.milestones.push(newMilestone)
  project.updatedAt = new Date()
  saveProjects(projects)
  return newMilestone
}

export function toggleMilestone(projectId: string, milestoneId: string): boolean {
  const projects = getProjects()
  const project = projects.find((p) => p.id === projectId)
  if (!project) return false

  const milestone = project.milestones.find((m) => m.id === milestoneId)
  if (!milestone) return false

  milestone.completed = !milestone.completed
  milestone.completedAt = milestone.completed ? new Date() : undefined
  project.updatedAt = new Date()

  const completedMilestones = project.milestones.filter((m) => m.completed).length
  project.progress = Math.round((completedMilestones / project.milestones.length) * 100)

  saveProjects(projects)
  return true
}
