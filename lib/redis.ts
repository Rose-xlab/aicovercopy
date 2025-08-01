// lib/redis.ts
import { Redis } from 'ioredis'

let connection: Redis

if (process.env.REDIS_URL) {
  // Use connection string (Railway provides this)
  connection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect: true
  })
} else {
  // Use individual variables (local development)
  connection = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    lazyConnect: true
  })
}

export default connection