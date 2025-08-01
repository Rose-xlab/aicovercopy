import Redis from 'ioredis';

// This will be the single "rediss://" URL from your Upstash dashboard
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  // This will now throw an error if the variable is missing on Railway
  throw new Error('REDIS_URL is not set in environment variables. Please add it to your Railway service.');
}

// Create a single, reusable Redis connection instance.
const redisConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Recommended for BullMQ
  
  // --- FIX ADDED HERE ---
  // Enable TCP Keep-Alives to prevent idle connection timeouts.
  // This sends a packet every 30 seconds to keep the connection active.
  keepAlive: 30000, 
  // ----------------------

  // Upstash requires TLS, which ioredis enables by default with rediss://
  // No explicit tls: {} object is needed unless you have specific TLS requirements.
});

redisConnection.on('connect', () => {
  console.log('Successfully connected to Redis (Upstash).');
});

redisConnection.on('error', (err) => {
  console.error('Redis Connection Error:', err);
});

export default redisConnection;
