//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\types\subscription.ts

export type SubscriptionTier = 'FREE' | 'PRO' | 'BUSINESS';
export type SubscriptionInterval = 'monthly' | 'quarterly' | 'annually';
export type TemplateAccess = 'none' | 'basic' | 'all' | 'premium';

export interface SubscriptionLimits {
  coverLetters: number; // -1 for unlimited
  resumes: number; // -1 for unlimited
  templates: TemplateAccess;
  atsScans: number; // -1 for unlimited
  interviewSessions: number; // -1 for unlimited
}

export interface SubscriptionPricing {
  monthly: number;
  quarterly: number;
  annually: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  limits: SubscriptionLimits;
  price: SubscriptionPricing;
  stripePriceIds: Record<SubscriptionInterval, string>;
}

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  interval?: SubscriptionInterval;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
}

// Database subscription table row type
export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  plan_id: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  interval: SubscriptionInterval;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}