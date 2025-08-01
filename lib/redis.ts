// lib/redis.ts
import Redis from 'ioredis';

// This will be the single "rediss://" URL from your Upstash dashboard
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  // This will now throw an error if the variable is missing on Railway
  throw new Error('REDIS_URL is not set in environment variables. Please add it to your Railway service.');
}

// Create a single, reusable Redis connection instance.
// This ioredis instance is compatible with BullMQ and general Redis commands.
const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Recommended for BullMQ
  // Upstash requires TLS, which ioredis enables by default with rediss://
});

redisConnection.on('connect', () => {
  console.log('Successfully connected to Redis (Upstash).');
});

redisConnection.on('error', (err) => {
  console.error('Redis Connection Error:', err);
});

export default redisConnection;