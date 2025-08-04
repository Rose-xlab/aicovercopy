// lib/subscription-client.ts
// This file contains only the client-safe parts of subscription logic
import { SubscriptionPlan, SubscriptionTier } from '@/types/subscription';

// Define subscription tiers and their respective Stripe product IDs
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  FREE: {
    id: 'free',
    name: 'Free',
    description: 'Basic access to the platform',
    features: [
      '1 Cover letter per month',
      '1 Resume',
      'Basic templates',
      '2 ATS scans per month',
      '1 Interview session',
      'Standard support',
    ],
    limits: {
      coverLetters: 1,
      resumes: 1,
      templates: 'basic',
      atsScans: 2,
      interviewSessions: 1,
    },
    price: {
      monthly: 0,
      quarterly: 0,
      annually: 0,
    },
    stripePriceIds: {
      monthly: '',
      quarterly: '',
      annually: '',
    },
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    description: 'Premium features for job seekers',
    features: [
      'Unlimited cover letters',
      'Unlimited resumes',
      'All templates',
      'Unlimited ATS scans',
      'Unlimited interview sessions',
      'Priority support',
    ],
    limits: {
      coverLetters: -1,
      resumes: -1,
      templates: 'all',
      atsScans: -1,
      interviewSessions: -1,
    },
    price: {
      monthly: 20.00,
      quarterly: 0,
      annually: 100.00,
    },
    stripePriceIds: {
      monthly: 'price_1RK5xpBh2Msdef2rOP2A93hO',
      quarterly: '',
      annually: 'price_1RK6FHBh2Msdef2rzti7qMbN',
    },
  },
  BUSINESS: {
    id: 'business',
    name: 'Business',
    description: 'Placeholder for business tier.',
    features: [],
    limits: {
      coverLetters: 0,
      resumes: 0,
      templates: 'none',
      atsScans: 0,
      interviewSessions: 0,
    },
    price: { monthly: 0, quarterly: 0, annually: 0 },
    stripePriceIds: { monthly: '', quarterly: '', annually: '' },
  },
};