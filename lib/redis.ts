import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

console.log('=== REDIS DEBUG INFO ===');
console.log('REDIS_URL:', redisUrl);
console.log('Process ENV keys:', Object.keys(process.env).filter(k => k.includes('REDIS')));
console.log('========================');

if (!redisUrl) {
  throw new Error('REDIS_URL is not set in environment variables.');
}

const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required for BullMQ
  enableReadyCheck: false,
  lazyConnect: true,
  
  // Increased timeouts for Upstash
  connectTimeout: 60000, // 60 seconds
  commandTimeout: 60000, // 60 seconds
  
  // Connection pooling
  keepAlive: 30000,
  family: 4,
  
  // Retry strategy
  retryStrategy: (times) => {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  
  // Reconnect settings
  reconnectOnError: (err) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    return targetErrors.some(target => err.message.includes(target));
  },
  
  // Additional stability options
  enableOfflineQueue: false,
});

redisConnection.on('connect', () => {
  console.log('Successfully connected to Redis (Upstash).');
});

redisConnection.on('error', (err) => {
  // Filter command timeout noise but log other errors
  if (err.message?.includes('Command timed out')) {
    console.log('Redis command timeout (retrying...)');
    return;
  }
  console.error('Redis Connection Error:', err);
});

redisConnection.on('close', () => {
  console.log('Redis connection closed.');
});

redisConnection.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

export default redisConnection;