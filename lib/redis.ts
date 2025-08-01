// lib/redis.ts
import { Redis } from 'ioredis'

let connection: Redis

// --- Add these three lines for debugging ---
console.log('--- DEBUGGING REDIS CONNECTION ---')
console.log('Value of process.env.REDISURL:', process.env.REDISURL)
console.log('Type of process.env.REDISURL:', typeof process.env.REDISURL)
// -----------------------------------------

// Use REDISURL (no underscore) for Railway
if (process.env.REDISURL) {
  // Use connection string (Railway provides this)
  connection = new Redis(process.env.REDISURL, {
    maxRetriesPerRequest: null,
    lazyConnect: true
  })
} else {
  // Use individual variables (local development)
  console.log('--- Falling back to localhost connection ---') // Added for extra debug info
  connection = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    lazyConnect: true
  })
}

export default connection