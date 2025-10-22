import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { testConnection, sql } from './core/database/postgres';
import { testRedisConnection, cache, redis } from './core/cache/redis';
import { UserModel, WithdrawalModel, UserBalanceModel } from './core/database/models';
// Simple console logger
const logger = {
    info: (msg) => console.log(`[INFO] ${new Date().toISOString()}: ${msg}`),
    error: (msg, error) => console.error(`[ERROR] ${new Date().toISOString()}: ${msg}`, error),
    warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()}: ${msg}`)
};
// Initialize app
const app = new Elysia();
// Global middleware dengan database dan cache
app
    .use(cors())
    .use(swagger({
    documentation: {
        info: {
            title: 'Selsila Airdrop API',
            version: '2.0.0',
            description: 'Optimized Airdrop API with Database & Caching'
        }
    }
}))
    .decorate('db', sql)
    .decorate('cache', cache)
    .onStart(async () => {
    logger.info('🚀 Selsila Airdrop API Optimized Started!');
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
        logger.error('Database connection failed!');
    }
    // Test Redis connection
    const redisConnected = await testRedisConnection();
    if (!redisConnected) {
        logger.error('Redis connection failed!');
    }
})
    .onStop(async () => {
    logger.info('🛑 Selsila Airdrop API Stopped');
    await sql.end();
    await redis.quit();
});
// Enhanced health check dengan database & cache status
app.get('/health', async () => {
    const dbStatus = await testConnection();
    const cacheStatus = await testRedisConnection();
    return {
        success: true,
        message: 'Selsila Airdrop API Optimized is running!',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: '2.0.0',
        services: {
            database: dbStatus ? 'connected' : 'disconnected',
            cache: cacheStatus ? 'connected' : 'disconnected'
        }
    };
}, {
    detail: {
        tags: ['System'],
        summary: 'Health check with service status'
    }
});
// ==================== DASHBOARD ENDPOINTS - OPTIMIZED ====================
// SUPER FAST DASHBOARD STATS
app.get('/dashboard/stats', async () => {
    const startTime = Date.now();
    const stats = await WithdrawalModel.getDashboardStats();
    const responseTime = Date.now() - startTime;
    return {
        ...stats,
        performance: {
            response_time_ms: responseTime,
            source: responseTime < 100 ? 'cache' : 'database'
        }
    };
}, {
    detail: {
        tags: ['Dashboard'],
        summary: 'Get dashboard statistics - OPTIMIZED'
    }
});
// USERS LIST WITH PAGINATION
app.get('/dashboard/users', async ({ query }) => {
    const page = parseInt(query.page || '1');
    const limit = Math.min(parseInt(query.limit || '50'), 100);
    const offset = (page - 1) * limit;
    const [users, total, statusCount] = await Promise.all([
        UserModel.findPaginated(limit, offset),
        UserModel.count(),
        UserModel.countByStatus()
    ]);
    return {
        users,
        summary: {
            total,
            by_status: statusCount
        },
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
}, {
    detail: {
        tags: ['Dashboard'],
        summary: 'Get users list with pagination'
    }
});
// RECENT WITHDRAWALS
app.get('/dashboard/withdrawals', async ({ query }) => {
    const limit = Math.min(parseInt(query.limit || '100'), 500);
    const withdrawals = await WithdrawalModel.findRecent(limit);
    return {
        withdrawals,
        total: withdrawals.length
    };
}, {
    detail: {
        tags: ['Dashboard'],
        summary: 'Get recent withdrawals'
    }
});
// USER DETAILS WITH BALANCE & WITHDRAWALS
app.get('/dashboard/users/:id', async ({ params: { id } }) => {
    const [user, balance, withdrawals] = await Promise.all([
        UserModel.findById(id),
        UserBalanceModel.findByUserId(id),
        WithdrawalModel.findByUserId(id)
    ]);
    if (!user) {
        return {
            success: false,
            message: 'User not found'
        };
    }
    return {
        success: true,
        user,
        balance: balance || { balance: 0, total_earned: 0, total_withdrawn: 0 },
        withdrawals,
        withdrawal_count: withdrawals.length
    };
}, {
    detail: {
        tags: ['Dashboard'],
        summary: 'Get user details with balance and withdrawals'
    }
});
// WITHDRAWALS BY STATUS
app.get('/dashboard/withdrawals/status/:status', async ({ params: { status } }) => {
    const validStatuses = ['pending', 'completed', 'failed'];
    if (!validStatuses.includes(status)) {
        return {
            success: false,
            message: 'Invalid status. Use: pending, completed, or failed'
        };
    }
    const withdrawals = await WithdrawalModel.findRecent(1000); // Get more to filter
    const filtered = withdrawals.filter(w => w.status === status);
    return {
        success: true,
        status,
        withdrawals: filtered.slice(0, 100), // Limit to 100
        total: filtered.length
    };
}, {
    detail: {
        tags: ['Dashboard'],
        summary: 'Get withdrawals by status'
    }
});
// PLATFORM BALANCE SUMMARY
app.get('/dashboard/balance-summary', async () => {
    const [totalBalance, userStats, withdrawalStats] = await Promise.all([
        UserBalanceModel.getTotalPlatformBalance(),
        UserModel.countByStatus(),
        WithdrawalModel.countByStatus()
    ]);
    return {
        total_platform_balance: totalBalance,
        user_summary: userStats,
        withdrawal_summary: withdrawalStats,
        timestamp: new Date().toISOString()
    };
}, {
    detail: {
        tags: ['Dashboard'],
        summary: 'Get platform balance and summary'
    }
});
// ==================== BASIC ENDPOINTS ====================
// Cached example endpoint
app.get('/cached-data', async () => {
    const cacheKey = 'cached_example_data';
    // Try to get from cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
        logger.info('Returning cached data');
        return {
            source: 'cache',
            data: cached,
            timestamp: new Date().toISOString()
        };
    }
    // If not in cache, get from database (simulated)
    logger.info('Fetching fresh data from database');
    const freshData = {
        message: 'This is fresh data from database',
        items: ['item1', 'item2', 'item3'],
        count: 3
    };
    // Store in cache for 5 minutes
    await cache.set(cacheKey, freshData, 300);
    return {
        source: 'database',
        data: freshData,
        timestamp: new Date().toISOString()
    };
}, {
    detail: {
        tags: ['Cache'],
        summary: 'Example of cached data endpoint'
    }
});
// Basic info endpoint
app.get('/', () => {
    return {
        message: 'Welcome to Selsila Airdrop Optimized API',
        version: '2.0.0',
        features: [
            'High performance architecture',
            'Advanced caching with Redis',
            'Database connection pooling',
            'Optimized dashboard endpoints',
            'User management system',
            'Withdrawal tracking',
            'Balance management',
            'Better error handling',
            'Enhanced security'
        ]
    };
});
// Test endpoint dengan parameter
app.get('/test/:name', ({ params: { name } }) => {
    return {
        message: `Hello ${name}!`,
        timestamp: new Date().toISOString()
    };
});
// ==================== ERROR HANDLING ====================
// Error handling
app.onError(({ code, error, set }) => {
    logger.error(`Error ${code}:`, error);
    if (code === 'VALIDATION') {
        set.status = 422;
        return {
            success: false,
            message: 'Validation error',
            errors: error.all
        };
    }
    set.status = 500;
    return {
        success: false,
        message: 'Internal server error'
    };
});
// Custom 404 handler
app.all('*', ({ set }) => {
    set.status = 404;
    return {
        success: false,
        message: 'Endpoint not found'
    };
});
// ==================== SERVER START ====================
// Start server
const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
app.listen({
    port: port,
    hostname: '0.0.0.0'
}, () => {
    logger.info(`✅ Server running on port ${port}`);
    logger.info(`📚 API Documentation: http://localhost:${port}/swagger`);
    logger.info(`🏥 Health Check: http://localhost:${port}/health`);
    logger.info(`📊 Dashboard: http://localhost:${port}/dashboard/stats`);
});
