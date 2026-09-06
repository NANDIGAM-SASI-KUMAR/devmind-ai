import { LRUCache } from 'lru-cache';

// One cache interface, two possible backends:
//   - Redis (ioredis), used when REDIS_URL is set and reachable — shares state across
//     server instances and survives restarts.
//   - An in-process LRU+TTL cache, used automatically otherwise — this app runs as a
//     single Node process today, so this delivers the same practical benefit (fewer
//     repeated aggregations, bounded memory via LRU eviction) with zero extra
//     infrastructure to run. Nothing else in the codebase needs to know which is active.
//
// Eviction policy: every cached entry carries a TTL (time-based eviction). The in-memory
// backend additionally caps total entries and evicts least-recently-used ones first
// (size-based eviction) so cache memory can never grow unbounded.

const LRU_MAX_ENTRIES = 500;
const memoryCache = new LRUCache({ max: LRU_MAX_ENTRIES });

let redisClient = null;
let redisReady = false;

const initRedis = async () => {
  if (!process.env.REDIS_URL) {
    console.log('[cache] REDIS_URL not set — using in-memory LRU cache');
    return;
  }
  try {
    const { default: Redis } = await import('ioredis');
    redisClient = new Redis(process.env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null // don't hang retrying forever if Redis goes away
    });
    await redisClient.connect();
    redisReady = true;
    console.log('[cache] Connected to Redis — using it as the cache backend');
    redisClient.on('error', (err) => {
      if (redisReady) console.error('[cache] Redis error, falling back to in-memory cache:', err.message);
      redisReady = false;
    });
  } catch (err) {
    console.error('[cache] Could not connect to Redis, using in-memory LRU cache instead:', err.message);
    redisReady = false;
  }
};

// Fire-and-forget at module load; every call below tolerates redisReady still being false.
initRedis();

export const cacheGet = async (key) => {
  if (redisReady) {
    try {
      const raw = await redisClient.get(key);
      return raw ? JSON.parse(raw) : undefined;
    } catch (err) {
      console.error('[cache] Redis get failed, falling back to memory:', err.message);
    }
  }
  return memoryCache.get(key);
};

export const cacheSet = async (key, value, ttlSeconds) => {
  if (redisReady) {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    } catch (err) {
      console.error('[cache] Redis set failed, falling back to memory:', err.message);
    }
  }
  memoryCache.set(key, value, { ttl: ttlSeconds * 1000 });
};

export const cacheDel = async (key) => {
  if (redisReady) {
    try {
      await redisClient.del(key);
    } catch (err) {
      console.error('[cache] Redis del failed:', err.message);
    }
  }
  memoryCache.delete(key);
};

// Invalidates every key starting with `prefix` — used when a write makes a family of
// cached reads stale (e.g. a new quiz attempt invalidates that study plan's progress cache).
export const cacheDelByPrefix = async (prefix) => {
  if (redisReady) {
    try {
      let cursor = '0';
      do {
        const [next, keys] = await redisClient.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = next;
        if (keys.length > 0) await redisClient.del(...keys);
      } while (cursor !== '0');
    } catch (err) {
      console.error('[cache] Redis scan/del failed:', err.message);
    }
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key);
  }
};

// Cache-aside helper: return the cached value if present, otherwise compute it, cache it,
// and return it. This is the one most call sites should use.
export const cached = async (key, ttlSeconds, computeFn) => {
  const hit = await cacheGet(key);
  if (hit !== undefined) return hit;
  const value = await computeFn();
  await cacheSet(key, value, ttlSeconds);
  return value;
};
