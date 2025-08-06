//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\lib\stripe.ts
import { loadStripe } from '@stripe/stripe-js';
import type { Stripe as StripeType } from '@stripe/stripe-js';

// Server-side Stripe instance (for API routes)
import Stripe from 'stripe';

let stripePromise: Promise<StripeType | null>;

// Client-side Stripe initialization
export const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error('Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

// Server-side Stripe instance
const createStripe = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
  }

  return new Stripe(key, {
    // FIX: Updated to the exact API version required by your installed Stripe library.
    apiVersion: '2025-03-31.basil', 
    appInfo: {
      name: 'AI Cover Letter Assistant',
      version: '1.0.0',
    },
  });
};

// Export stripe instance or provide a helpful error
let stripe: Stripe;
try {
  stripe = createStripe();
} catch (error) {
  console.error('Failed to initialize Stripe:', error);
  // Create a dummy Stripe instance that throws errors for all methods
  // This prevents the app from crashing on startup if Stripe isn't configured
  stripe = new Proxy({} as Stripe, {
    get: (target, prop) => {
      return () => {
        throw new Error('Stripe is not properly configured: STRIPE_SECRET_KEY is missing');
      };
    }
  });
}

export { stripe };
