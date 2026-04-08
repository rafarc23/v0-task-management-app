import { Pool } from 'pg'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Determine if we need SSL (for cloud databases like Neon)
const isLocalhost = process.env.DATABASE_URL?.includes('localhost') || 
                    process.env.DATABASE_URL?.includes('127.0.0.1') ||
                    process.env.DATABASE_URL?.includes('192.168.')

// Create a connection pool with optimized settings for performance
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Reduced pool size for better resource management
  max: 10,
  min: 2,
  // Keep connections alive longer
  idleTimeoutMillis: 60000,
  // Faster connection timeout
  connectionTimeoutMillis: 5000,
  // For cloud databases, use SSL with verify-full to avoid the security warning
  // For local databases, disable SSL
  ssl: isLocalhost ? false : { rejectUnauthorized: true },
  // Statement timeout to prevent long-running queries
  statement_timeout: 30000,
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
