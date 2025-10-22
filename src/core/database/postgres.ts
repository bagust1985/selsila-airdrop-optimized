import postgres from 'postgres'

// Database connection with connection pooling
export const sql = postgres({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'selsila_airdrop',
  username: process.env.DB_USER || 'selsila',
  password: process.env.DB_PASSWORD || 'selsiladb',
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
  types: {
    // Handle numeric types as float instead of BigInt
    numeric: {
      to: 0,
      from: [1700],
      parse: (x: any) => parseFloat(x),
      serialize: (x: any) => x.toString()
    },
    // Properly handle bigint from PostgreSQL
    bigint: postgres.BigInt
  },
  transform: {
    // Transform PostgreSQL numeric to JavaScript number
    value: (value) => {
      if (typeof value === 'bigint') {
        return Number(value)
      }
      return value
    }
  }
})

// Test database connection
export const testConnection = async () => {
  try {
    const result = await sql`SELECT version()`
    console.log(`[INFO] Database connected: ${result[0].version}`)
    return true
  } catch (error) {
    console.error('[ERROR] Database connection failed:', error)
    return false
  }
}