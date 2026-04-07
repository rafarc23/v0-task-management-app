import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Determine if we need SSL (for cloud databases like Neon)
const isLocalhost = process.env.DATABASE_URL?.includes('localhost') || 
                    process.env.DATABASE_URL?.includes('127.0.0.1') ||
                    process.env.DATABASE_URL?.includes('192.168.')

// Create a connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  // For cloud databases, use SSL with verify-full to avoid the security warning
  // For local databases, disable SSL
  ssl: isLocalhost ? false : { rejectUnauthorized: true },
})

// Helper function to run queries
export async function query<T = Record<string, unknown>>(
  text: string, 
  params?: unknown[]
): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}

// Helper function to generate UUID on server
export function generateUUID(): string {
  return crypto.randomUUID()
}
