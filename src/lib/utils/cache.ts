import { getRedisClient } from '../db/redis';

export async function getCachedData<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (error) {
    console.error(`[Cache] Get error for key "${key}":`, error);
  }
  return null;
}

export async function setCachedData(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch (error) {
    console.error(`[Cache] Set error for key "${key}":`, error);
  }
}

export async function invalidateCacheKeys(keys: string[]): Promise<void> {
  const redis = getRedisClient();
  if (!redis || keys.length === 0) return;

  try {
    await redis.del(...keys);
    console.log(`[Cache] Invalidated keys:`, keys);
  } catch (error) {
    console.error(`[Cache] Delete keys error:`, error);
  }
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    let cursor = '0';
    let count = 0;
    do {
      const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = newCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
        count += keys.length;
      }
    } while (cursor !== '0');
    if (count > 0) {
      console.log(`[Cache] Invalidated ${count} keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error(`[Cache] Invalidate pattern "${pattern}" error:`, error);
  }
}
