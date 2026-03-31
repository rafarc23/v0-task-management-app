export type UserRole = "employee" | "admin" | "requester"

export interface StoredUser {
  id: string
  username: string
  password: string // In production, this should be hashed
  name: string
  email: string
  role: UserRole
  department?: string
  avatar?: string
  employeeId?: string
  isActive: boolean
  createdAt: Date
  lastLogin?: Date
}

const USERS_KEY = "app_users"
const INITIALIZED_KEY = "app_users_initialized"

// Default admin user
const DEFAULT_ADMIN: StoredUser = {
  id: "admin-001",
  username: "admin",
  password: "Cima1100",
  name: "Administrador",
  email: "admin@empresa.com",
  role: "admin",
  department: "Infraestructura y TI",
  isActive: true,
  createdAt: new Date(),
}

// Demo users (migrated from old system)
const DEMO_USERS: StoredUser[] = [
  DEFAULT_ADMIN,
  {
    id: "emp-001",
    username: "empleado@empresa.com",
    password: "empleado123",
    name: "Operario",
    email: "empleado@empresa.com",
    role: "employee",
    department: "Infraestructura y TI",
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "req-001",
    username: "solicitante@empresa.com",
    password: "solicitante123",
    name: "Ana Martinez",
    email: "solicitante@empresa.com",
    role: "requester",
    department: "Produccion",
    isActive: true,
    createdAt: new Date(),
  },
]

function initializeUsers(): void {
  if (typeof window === "undefined") return
  const initialized = localStorage.getItem(INITIALIZED_KEY)
  if (!initialized) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEMO_USERS))
    localStorage.setItem(INITIALIZED_KEY, "true")
  }
}

export function getUsers(): StoredUser[] {
  if (typeof window === "undefined") return []
  initializeUsers()
  const stored = localStorage.getItem(USERS_KEY)
  if (!stored) return DEMO_USERS
  return JSON.parse(stored, (key, value) => {
    if (key === "createdAt" || key === "lastLogin") {
      return value ? new Date(value) : undefined
    }
    return value
  })
}

export function saveUsers(users: StoredUser[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function getUserById(id: string): StoredUser | null {
  const users = getUsers()
  return users.find(u => u.id === id) || null
}

export function getUserByUsername(username: string): StoredUser | null {
  const users = getUsers()
  // Support login with username or email
  return users.find(u => 
    u.username.toLowerCase() === username.toLowerCase() || 
    u.email.toLowerCase() === username.toLowerCase()
  ) || null
}

export function validateCredentials(username: string, password: string): StoredUser | null {
  const user = getUserByUsername(username)
  if (!user) return null
  if (!user.isActive) return null
  if (user.password !== password) return null
  
  // Update last login
  const users = getUsers()
  const index = users.findIndex(u => u.id === user.id)
  if (index !== -1) {
    users[index].lastLogin = new Date()
    saveUsers(users)
  }
  
  return user
}

export function addUser(user: Omit<StoredUser, "id" | "createdAt">): StoredUser {
  const users = getUsers()
  
  // Check for duplicate username or email
  const exists = users.find(u => 
    u.username.toLowerCase() === user.username.toLowerCase() ||
    u.email.toLowerCase() === user.email.toLowerCase()
  )
  if (exists) {
    throw new Error("El nombre de usuario o email ya existe")
  }
  
  const newUser: StoredUser = {
    ...user,
    id: `user-${Date.now()}`,
    createdAt: new Date(),
  }
  users.push(newUser)
  saveUsers(users)
  return newUser
}

export function updateUser(id: string, updates: Partial<Omit<StoredUser, "id" | "createdAt">>): StoredUser | null {
  const users = getUsers()
  const index = users.findIndex(u => u.id === id)
  if (index === -1) return null
  
  // If updating username/email, check for duplicates
  if (updates.username || updates.email) {
    const duplicate = users.find(u => 
      u.id !== id && (
        (updates.username && u.username.toLowerCase() === updates.username.toLowerCase()) ||
        (updates.email && u.email.toLowerCase() === updates.email.toLowerCase())
      )
    )
    if (duplicate) {
      throw new Error("El nombre de usuario o email ya existe")
    }
  }
  
  users[index] = { ...users[index], ...updates }
  saveUsers(users)
  return users[index]
}

export function deleteUser(id: string): boolean {
  const users = getUsers()
  // Prevent deleting the main admin
  const user = users.find(u => u.id === id)
  if (user?.username === "admin") {
    throw new Error("No se puede eliminar el usuario administrador principal")
  }
  
  const filtered = users.filter(u => u.id !== id)
  if (filtered.length === users.length) return false
  saveUsers(filtered)
  return true
}

export function changePassword(id: string, currentPassword: string, newPassword: string): boolean {
  const users = getUsers()
  const index = users.findIndex(u => u.id === id)
  if (index === -1) return false
  
  if (users[index].password !== currentPassword) {
    throw new Error("La contrasena actual es incorrecta")
  }
  
  users[index].password = newPassword
  saveUsers(users)
  return true
}

export function resetPassword(id: string, newPassword: string): boolean {
  const users = getUsers()
  const index = users.findIndex(u => u.id === id)
  if (index === -1) return false
  
  users[index].password = newPassword
  saveUsers(users)
  return true
}
