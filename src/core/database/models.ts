import { sql } from './postgres'
import { cache } from '../cache/redis'

// Helper function untuk handle BigInt serialization
function safeSerialize(data: any): any {
  if (data === null || data === undefined) {
    return data
  }
  
  if (typeof data === 'bigint') {
    return Number(data)
  }
  
  if (Array.isArray(data)) {
    return data.map(safeSerialize)
  }
  
  if (typeof data === 'object') {
    const result: any = {}
    for (const [key, value] of Object.entries(data)) {
      result[key] = safeSerialize(value)
    }
    return result
  }
  
  return data
}

// User model berdasarkan structure actual
export interface User {
  id: string
  email: string
  username: string
  full_name: string
  wallet_address: string
  status: string
  created_at: Date
  updated_at: Date
}

export const UserModel = {
  // Get user by ID dengan cache
  async findById(id: string): Promise<User | null> {
    const cacheKey = `user:${id}`
    
    const cached = await cache.get<User>(cacheKey)
    if (cached) return cached
    
    const users = await sql<User[]>`SELECT * FROM users WHERE id = ${id}`
    const user = users[0] || null
    
    if (user) await cache.set(cacheKey, safeSerialize(user), 300)
    return safeSerialize(user)
  },

  // Get user by email
  async findByEmail(email: string): Promise<User | null> {
    const users = await sql<User[]>`SELECT * FROM users WHERE email = ${email}`
    return safeSerialize(users[0] || null)
  },

  // Get users dengan pagination untuk dashboard - OPTIMIZED
  async findPaginated(limit: number = 50, offset: number = 0): Promise<User[]> {
    const users = await sql<User[]>`
      SELECT id, email, username, full_name, wallet_address, status, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `
    return safeSerialize(users)
  },

  // Count total users untuk dashboard - CACHED
  async count(): Promise<number> {
    const cacheKey = 'users_count'
    const cached = await cache.get<number>(cacheKey)
    if (cached) return cached
    
    const result = await sql<{ count: number }[]>`SELECT COUNT(*) as count FROM users`
    const count = parseInt(result[0]?.count?.toString() || '0')
    
    await cache.set(cacheKey, count, 120)
    return count
  },

  // Get users by status
  async countByStatus(): Promise<{ status: string, count: number }[]> {
    const cacheKey = 'users_by_status'
    const cached = await cache.get<{ status: string, count: number }[]>(cacheKey)
    if (cached) return cached
    
    const result = await sql<{ status: string, count: number }[]>`
      SELECT status, COUNT(*) as count 
      FROM users 
      GROUP BY status
    `
    
    await cache.set(cacheKey, safeSerialize(result), 120)
    return safeSerialize(result)
  }
}

// Withdrawals model berdasarkan structure actual
export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  wallet_address: string
  transaction_hash?: string
  status: 'pending' | 'completed' | 'failed'
  created_at: Date
  updated_at: Date
}

export const WithdrawalModel = {
  // Get withdrawals by user
  async findByUserId(userId: string): Promise<Withdrawal[]> {
    const withdrawals = await sql<Withdrawal[]>`
      SELECT * FROM withdrawals 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC
    `
    return safeSerialize(withdrawals)
  },

  // Get recent withdrawals untuk dashboard - CACHED
  async findRecent(limit: number = 100): Promise<Withdrawal[]> {
    const cacheKey = `recent_withdrawals:${limit}`
    const cached = await cache.get<Withdrawal[]>(cacheKey)
    if (cached) return cached
    
    const withdrawals = await sql<Withdrawal[]>`
      SELECT * FROM withdrawals 
      ORDER BY created_at DESC 
      LIMIT ${limit}
    `
    
    await cache.set(cacheKey, safeSerialize(withdrawals), 60)
    return safeSerialize(withdrawals)
  },

  // Count withdrawals by status - CACHED
  async countByStatus(): Promise<{ status: string, count: number }[]> {
    const cacheKey = 'withdrawals_by_status'
    const cached = await cache.get<{ status: string, count: number }[]>(cacheKey)
    if (cached) return cached
    
    const result = await sql<{ status: string, count: number }[]>`
      SELECT status, COUNT(*) as count 
      FROM withdrawals 
      GROUP BY status
    `
    
    await cache.set(cacheKey, safeSerialize(result), 120)
    return safeSerialize(result)
  },

  // Dashboard stats - HEAVILY CACHED
  async getDashboardStats() {
    const cacheKey = 'dashboard_stats'
    const cached = await cache.get(cacheKey)
    if (cached) return cached
    
    // Single query untuk semua stats - SUPER OPTIMIZED
    const stats = await sql<{
      total_users: number,
      total_withdrawals: number,
      pending_withdrawals: number,
      completed_withdrawals: number,
      failed_withdrawals: number,
      total_withdrawn: number
    }[]>`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM withdrawals) as total_withdrawals,
        (SELECT COUNT(*) FROM withdrawals WHERE status = 'pending') as pending_withdrawals,
        (SELECT COUNT(*) FROM withdrawals WHERE status = 'completed') as completed_withdrawals,
        (SELECT COUNT(*) FROM withdrawals WHERE status = 'failed') as failed_withdrawals,
        (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE status = 'completed') as total_withdrawn
    `
    
    const result = safeSerialize({
      ...stats[0],
      timestamp: new Date().toISOString()
    })
    
    await cache.set(cacheKey, result, 60)
    return result
  }
}

// User balances model
export interface UserBalance {
  id: string
  user_id: string
  balance: number
  total_earned: number
  total_withdrawn: number
  updated_at: Date
}

export const UserBalanceModel = {
  // Get balance by user
  async findByUserId(userId: string): Promise<UserBalance | null> {
    const balances = await sql<UserBalance[]>`SELECT * FROM user_balances WHERE user_id = ${userId}`
    return safeSerialize(balances[0] || null)
  },

  // Get total platform balance
  async getTotalPlatformBalance(): Promise<number> {
    const cacheKey = 'total_platform_balance'
    const cached = await cache.get<number>(cacheKey)
    if (cached) return cached
    
    const result = await sql<{ total: number }[]>`SELECT COALESCE(SUM(balance), 0) as total FROM user_balances`
    const total = result[0]?.total || 0
    
    await cache.set(cacheKey, Number(total), 300)
    return Number(total)
  }
}