import { createClient } from 'redis';
// Redis client with connection pooling
export const redis = createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
    },
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DB || '0')
});
// Cache utility functions
export class CacheService {
    // Get cached data
    async get(key) {
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error(`[ERROR] Cache get failed for key ${key}:`, error);
            return null;
        }
    }
    // Set cached data with TTL
    async set(key, data, ttl = 3600) {
        try {
            await redis.setEx(key, ttl, JSON.stringify(data));
        }
        catch (error) {
            console.error(`[ERROR] Cache set failed for key ${key}:`, error);
        }
    }
    // Delete cached data
    async delete(key) {
        try {
            await redis.del(key);
        }
        catch (error) {
            console.error(`[ERROR] Cache delete failed for key ${key}:`, error);
        }
    }
    // Clear all cache (use with caution)
    async clear() {
        try {
            await redis.flushDb();
        }
        catch (error) {
            console.error('[ERROR] Cache clear failed:', error);
        }
    }
}
export const cache = new CacheService();
// Test Redis connection
export const testRedisConnection = async () => {
    try {
        await redis.connect();
        console.log('[INFO] Redis connected successfully');
        return true;
    }
    catch (error) {
        console.error('[ERROR] Redis connection failed:', error);
        return false;
    }
};
