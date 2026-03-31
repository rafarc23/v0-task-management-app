import { neon } from '@neondatabase/serverless'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

export const sql = neon(process.env.DATABASE_URL)

// Helper function to generate UUID on server
export function generateUUID(): string {
  return crypto.randomUUID()
}
