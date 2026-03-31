import useSWR from 'swr'
import type { Task, Employee, Project, Notification } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Error fetching data')
  return res.json()
})

// Tasks hook
export function useTasks(options?: { archived?: boolean; employee?: string; status?: string; includeArchived?: boolean }) {
  const params = new URLSearchParams()
  if (options?.archived) params.set('archived', 'true')
  if (options?.includeArchived) params.set('includeArchived', 'true')
  if (options?.employee) params.set('employee', options.employee)
  if (options?.status) params.set('status', options.status)
  
  const queryString = params.toString()
  const url = `/api/tasks${queryString ? `?${queryString}` : ''}`
  
  const { data, error, isLoading, mutate } = useSWR<Task[]>(url, fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true,
  })

  return {
    tasks: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Single task hook
export function useTask(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Task>(
    id ? `/api/tasks/${id}` : null,
    fetcher
  )

  return {
    task: data,
    isLoading,
    isError: error,
    mutate,
  }
}

// Employees hook
export function useEmployees() {
  const { data, error, isLoading, mutate } = useSWR<Employee[]>('/api/employees', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // Cache for 1 minute
  })

  return {
    employees: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Projects hook
export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<Project[]>('/api/projects', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  })

  return {
    projects: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Notifications hook
export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<{ notifications: Notification[]; unreadCount: number }>(
    '/api/notifications',
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  )

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    isError: error,
    mutate,
  }
}

// Users hook (admin only)
export function useUsers() {
  const { data, error, isLoading, mutate } = useSWR('/api/users', fetcher, {
    revalidateOnFocus: false,
  })

  return {
    users: data || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Mutation hooks for convenience
export function useUpdateTask() {
  return {
    updateTask: async (id: string, data: Partial<Task>) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error updating task')
      return res.json()
    }
  }
}

export function useCreateEmployee() {
  return {
    createEmployee: async (data: Partial<Employee>) => {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error creating employee')
      return res.json()
    }
  }
}

export function useUpdateEmployee() {
  return {
    updateEmployee: async (id: string, data: Partial<Employee>) => {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error updating employee')
      return res.json()
    }
  }
}

export function useDeleteEmployee() {
  return {
    deleteEmployee: async (id: string) => {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error deleting employee')
      return res.json()
    }
  }
}

export function useCreateProject() {
  return {
    createProject: async (data: Partial<Project>) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error creating project')
      return res.json()
    }
  }
}

export function useDeleteProject() {
  return {
    deleteProject: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error deleting project')
      return res.json()
    }
  }
}

export function useCreateUser() {
  return {
    createUser: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error creating user')
      return res.json()
    }
  }
}

export function useUpdateUser() {
  return {
    updateUser: async (id: string, data: Record<string, unknown>) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error('Error updating user')
      return res.json()
    }
  }
}

export function useDeleteUser() {
  return {
    deleteUser: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error deleting user')
      return res.json()
    }
  }
}

// API mutation helpers
export const api = {
  // Tasks
  createTask: async (data: Partial<Task>) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error creating task')
    return res.json()
  },

  updateTask: async (id: string, data: Partial<Task>) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error updating task')
    return res.json()
  },

  deleteTask: async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error deleting task')
    return res.json()
  },

  addComment: async (taskId: string, text: string) => {
    const res = await fetch(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error('Error adding comment')
    return res.json()
  },

  // Employees
  createEmployee: async (data: Partial<Employee>) => {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error creating employee')
    return res.json()
  },

  updateEmployee: async (id: string, data: Partial<Employee>) => {
    const res = await fetch(`/api/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error updating employee')
    return res.json()
  },

  deleteEmployee: async (id: string) => {
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error deleting employee')
    return res.json()
  },

  // Projects
  createProject: async (data: Partial<Project>) => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error creating project')
    return res.json()
  },

  updateProject: async (id: string, data: Partial<Project>) => {
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error updating project')
    return res.json()
  },

  deleteProject: async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error deleting project')
    return res.json()
  },

  // Users
  createUser: async (data: Record<string, unknown>) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error creating user')
    return res.json()
  },

  updateUser: async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Error updating user')
    return res.json()
  },

  deleteUser: async (id: string) => {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Error deleting user')
    return res.json()
  },

  // Notifications
  markNotificationRead: async (notificationId?: string, markAllRead?: boolean) => {
    const res = await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId, markAllRead }),
    })
    if (!res.ok) throw new Error('Error updating notification')
    return res.json()
  },
}
