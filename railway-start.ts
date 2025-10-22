import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { swagger } from '@elysiajs/swagger'

const startApp = async () => {
  console.log('🚀 Starting Selsila Airdrop API on Railway...')
  
  try {
    // Dynamic import untuk handle different environments
    let sql, testConnection, cache, testRedisConnection
    
    if (process.env.DATABASE_URL) {
      // Railway environment - use PostgreSQL from DATABASE_URL
      const postgresModule = await import('./src/core/database/postgres-railway')
      sql = postgresModule.sql
      testConnection = postgresModule.testConnection
    } else {
      // Local environment
      const postgresModule = await import('./src/core/database/postgres')
      sql = postgresModule.sql
      testConnection = postgresModule.testConnection
    }

    // Import main app
    const { app } = await import('./src/index')
    
    const port = process.env.PORT || 3001
    app.listen(port, () => {
      console.log(`✅ Selsila Airdrop API running on port ${port}`)
      console.log(`📚 Documentation: http://localhost:${port}/swagger`)
      console.log(`🏥 Health Check: http://localhost:${port}/health`)
    })
    
  } catch (error) {
    console.error('❌ Failed to start app:', error)
    process.exit(1)
  }
}

startApp()
