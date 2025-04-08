// lib/redis.ts
import { Redis } from 'ioredis'

const connection = new Redis({
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null  // Add this line to resolve BullMQ error
})

export default connection
