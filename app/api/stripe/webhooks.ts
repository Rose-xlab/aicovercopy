import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// This is your Stripe webhook secret for testing your endpoint locally.
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') as string;
  
  let event: Stripe.Event;
  
  try {
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not set');
    }
    
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  
  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Error handling webhook: ${error.message}`);
    return NextResponse.json(
      { error: 'Failed to process webhook' }, 
      { status: 500 }
    );
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Get customer and subscription details
  if (!session.subscription || !session.customer) {
    console.log('No subscription or customer in session');
    return;
  }
  
  // Get metadata from the session
  const { userId, tier, interval } = session.metadata || {};
  
  if (!userId || !tier) {
    console.log('Missing userId or tier in session metadata');
    return;
  }
  
  // Get subscription details from Stripe
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  
  // Store the subscription in our database
  await storeSubscription(
    subscription,
    userId,
    tier,
    interval
  );
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Get the customer ID
  const customerId = subscription.customer as string;
  
  // Find the user with this customer ID
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId);
  
  if (error || !users || users.length === 0) {
    console.error('User not found for customer:', customerId, error);
    return;
  }
  
  const userId = users[0].id;
  
  // Update the subscription in our database
  await updateSubscription(subscription, userId);
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Get the customer ID
  const customerId = subscription.customer as string;
  
  // Find the user with this customer ID
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId);
  
  if (error || !users || users.length === 0) {
    console.error('User not found for customer:', customerId, error);
    return;
  }
  
  const userId = users[0].id;
  
  // Update the subscription status to canceled in our database
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('stripe_subscription_id', subscription.id);
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // Store the invoice in our database for billing history
  if (!invoice.subscription || !invoice.customer) {
    console.log('No subscription or customer in invoice');
    return;
  }
  
  const customerId = invoice.customer as string;
  
  // Find the user with this customer ID
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId);
  
  if (error || !users || users.length === 0) {
    console.error('User not found for customer:', customerId, error);
    return;
  }
  
  const userId = users[0].id;
  
  // Store the invoice
  await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: invoice.subscription,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      created_at: new Date(invoice.created * 1000).toISOString(),
      period_start: new Date(invoice.period_start * 1000).toISOString(),
      period_end: new Date(invoice.period_end * 1000).toISOString(),
      invoice_pdf: invoice.invoice_pdf,
      description: invoice.description,
    });
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Update subscription status to past_due
  if (!invoice.subscription || !invoice.customer) {
    console.log('No subscription or customer in invoice');
    return;
  }
  
  const customerId = invoice.customer as string;
  
  // Find the user with this customer ID
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId);
  
  if (error || !users || users.length === 0) {
    console.error('User not found for customer:', customerId, error);
    return;
  }
  
  const userId = users[0].id;
  
  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('stripe_subscription_id', invoice.subscription);
}

/**
 * Store a new subscription in the database
 */
async function storeSubscription(
  subscription: Stripe.Subscription,
  userId: string,
  tier: string,
  interval?: string
) {
  // Get the plan ID from the first subscription item
  const item = subscription.items.data[0];
  const planId = tier;
  
  // Default to first price's interval if not provided
  const subscriptionInterval = interval || getIntervalFromStripeInterval(subscription.items.data[0].plan.interval);
  
  try {
    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (existingSubscription) {
      // Update existing subscription
      await supabase
        .from('subscriptions')
        .update({
          plan_id: planId,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          interval: subscriptionInterval,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingSubscription.id);
    } else {
      // Create new subscription record
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          stripe_customer_id: subscription.customer as string,
          stripe_subscription_id: subscription.id,
          plan_id: planId,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          interval: subscriptionInterval,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('Error storing subscription:', error);
    throw error;
  }
}

/**
 * Update an existing subscription in the database
 */
async function updateSubscription(
  subscription: Stripe.Subscription,
  userId: string
) {
  try {
    // Update the subscription
    await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('stripe_subscription_id', subscription.id);
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Convert Stripe's interval to our interval format
 */
function getIntervalFromStripeInterval(stripeInterval: string): 'monthly' | 'quarterly' | 'annually' {
  switch (stripeInterval) {
    case 'month':
      return 'monthly';
    case 'year':
      return 'annually';
    // For custom 3-month interval (or any other - default to monthly)
    default:
      return 'monthly';
  }
}