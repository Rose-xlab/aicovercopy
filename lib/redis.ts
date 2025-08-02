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
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4,
  connectTimeout: 10000,
  commandTimeout: 5000,
  
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  
  reconnectOnError: (err) => {
    const targetError = 'READONLY';
    return err.message.includes(targetError);
  }
});

redisConnection.on('connect', () => {
  console.log('Successfully connected to Redis (Upstash).');
});

redisConnection.on('error', (err) => {
  console.error('Redis Connection Error:', err);
});

redisConnection.on('close', () => {
  console.log('Redis connection closed.');
});

redisConnection.on('reconnecting', () => {
  console.log('Redis reconnecting...');
});

export default redisConnection;