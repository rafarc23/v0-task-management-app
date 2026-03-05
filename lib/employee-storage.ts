import type { Employee } from "./types"

const EMPLOYEES_KEY = "employees"

export function getEmployees(): Employee[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem(EMPLOYEES_KEY)
  if (!stored) return getDemoEmployees()
  return JSON.parse(stored, (key, value) => {
    if (key === "createdAt") {
      return value ? new Date(value) : undefined
    }
    return value
  })
}

export function saveEmployees(employees: Employee[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(EMPLOYEES_KEY, JSON.stringify(employees))
}

export function addEmployee(employee: Omit<Employee, "id" | "createdAt">): Employee {
  const employees = getEmployees()
  const newEmployee: Employee = {
    ...employee,
    id: Date.now().toString(),
    createdAt: new Date(),
  }
  employees.push(newEmployee)
  saveEmployees(employees)
  return newEmployee
}

export function updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
  const employees = getEmployees()
  const index = employees.findIndex((e) => e.id === id)
  if (index === -1) return null

  employees[index] = {
    ...employees[index],
    ...updates,
  }
  saveEmployees(employees)
  return employees[index]
}

export function deleteEmployee(id: string): boolean {
  const employees = getEmployees()
  const filtered = employees.filter((e) => e.id !== id)
  if (filtered.length === employees.length) return false
  saveEmployees(filtered)
  return true
}

export function getEmployeeById(id: string): Employee | null {
  const employees = getEmployees()
  return employees.find((e) => e.id === id) || null
}

function getDemoEmployees(): Employee[] {
  return [
    {
      id: "1",
      name: "Carlos Rodríguez",
      email: "carlos@empresa.com",
      role: "admin",
      department: "Infraestructura y TI",
      position: "Jefe de Departamento",
      color: "#6366f1",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "2",
      name: "María González",
      email: "maria@empresa.com",
      role: "employee",
      department: "Infraestructura y TI",
      position: "Técnico de Sistemas",
      color: "#06b6d4",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "3",
      name: "Juan Pérez",
      email: "juan@empresa.com",
      role: "employee",
      department: "Infraestructura y TI",
      position: "Técnico de Redes",
      color: "#10b981",
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: "4",
      name: "Ana Martínez",
      email: "ana@empresa.com",
      role: "employee",
      department: "Infraestructura y TI",
      position: "Soporte Técnico",
      color: "#f59e0b",
      isActive: true,
      createdAt: new Date(),
    },
  ]
}
