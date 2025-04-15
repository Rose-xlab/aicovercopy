// lib/queues/openaiQueue.ts
import { Queue } from 'bullmq';
import redisConnection from '../redis'; // Reuse a shared Redis connection config

export const openaiQueue = new Queue('openai-requests', {
  connection: redisConnection,
});