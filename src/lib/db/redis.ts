import Redis from 'ioredis';

interface GlobalRedis {
  _redisClient?: Redis;
}

const globalWithRedis = global as typeof globalThis & GlobalRedis;

export function getRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null;
  }

  if (!globalWithRedis._redisClient) {
    console.log("Initializing Redis Client globally...");
    globalWithRedis._redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      connectTimeout: 5000,
      lazyConnect: true, // Terkoneksi saat query pertama kali dipanggil
      retryStrategy(times) {
        const delay = Math.min(times * 100, 3000);
        return delay;
      }
    });

    globalWithRedis._redisClient.on('error', (err) => {
      console.error('Redis global connection error:', err);
    });
  }

  return globalWithRedis._redisClient;
}
