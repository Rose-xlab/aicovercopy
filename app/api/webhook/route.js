//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\app\api\webhook\route.js
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Supabase client with service role for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// This is your Stripe webhook secret
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  
  let event;
  
  try {
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not set');
    }
    
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  
  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Error handling webhook: ${error.message}`);
    return NextResponse.json(
      { error: 'Failed to process webhook' }, 
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session) {
  if (!session.subscription || !session.customer) {
    console.log('No subscription or customer in session');
    return;
  }
  
  const { userId, tier, interval } = session.metadata || {};
  
  if (!userId || !tier) {
    console.log('Missing userId or tier in session metadata');
    return;
  }
  
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  
  await storeSubscription(
    subscription,
    userId,
    tier,
    interval
  );
  
  console.log(`Subscription created for user ${userId}, tier: ${tier}, interval: ${interval}`);
}

async function handleSubscriptionUpdated(subscription) {
  const customerId = subscription.customer;
  
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId);
  
  if (error || !users || users.length === 0) {
    console.error('User not found for customer:', customerId, error);
    return;
  }
  
  const userId = users[0].id;
  
  await updateSubscription(subscription, userId);
  
  console.log(`Subscription updated for user ${userId}, status: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer;
  
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId);
  
  if (error || !users || users.length === 0) {
    console.error('User not found for customer:', customerId, error);
    return;
  }
  
  const userId = users[0].id;
  
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('stripe_subscription_id', subscription.id);
  
  console.log(`Handling post-cancellation for user ${userId}`);
}

async function handleInvoicePaymentSucceeded(invoice) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId || !invoice.customer) {
    console.log('No subscription or customer in invoice');
    return;
  }
  
  const customerId = invoice.customer;
  
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId);
  
  if (error || !users || users.length === 0) {
    console.error('User not found for customer:', customerId, error);
    return;
  }
  
  const userId = users[0].id;
  
  await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      created_at: new Date(invoice.created * 1000).toISOString(),
      period_start: new Date(invoice.period_start * 1000).toISOString(),
      period_end: new Date(invoice.period_end * 1000).toISOString(),
      invoice_pdf: invoice.invoice_pdf,
      description: invoice.description,
    });
  
  console.log(`Invoice recorded for user ${userId} for invoice ${invoice.id}`);
}

async function handleInvoicePaymentFailed(invoice) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId || !invoice.customer) {
    console.log('No subscription or customer in invoice');
    return;
  }
  
  const customerId = invoice.customer;
  
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('stripe_customer_id', customerId);
  
  if (error || !users || users.length === 0) {
    console.error('User not found for customer:', customerId, error);
    return;
  }
  
  const userId = users[0].id;
  const userEmail = users[0].email;
  
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('stripe_subscription_id', subscriptionId);
  
  console.log(`Payment failure recorded for ${userEmail} for invoice ${invoice.id}`);
}

async function storeSubscription(subscription, userId, tier, interval) {
  const item = subscription.items.data[0];
  const planId = tier;
  
  const subscriptionInterval = interval || getIntervalFromStripeInterval(item.plan.interval);
  
  try {
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    const startTime = subscription.start_date * 1000;
    const currentPeriodStart = subscription.current_period_start * 1000;
    const currentPeriodEnd = subscription.current_period_end * 1000;
    
    const subscriptionData = {
      plan_id: planId,
      status: subscription.status,
      current_period_start: new Date(currentPeriodStart).toISOString(),
      current_period_end: new Date(currentPeriodEnd).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      interval: subscriptionInterval,
      updated_at: new Date().toISOString(),
    };
    
    if (existingSubscription) {
      await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id);
    } else {
      await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          stripe_customer_id: subscription.customer,
          stripe_subscription_id: subscription.id,
          created_at: new Date().toISOString(),
          ...subscriptionData
        });
    }
  } catch (error) {
    console.error('Error storing subscription:', error);
    throw error;
  }
}

async function updateSubscription(subscription, userId) {
  try {
    const currentPeriodStart = subscription.current_period_start * 1000;
    const currentPeriodEnd = subscription.current_period_end * 1000;
    
    await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(currentPeriodStart).toISOString(),
        current_period_end: new Date(currentPeriodEnd).toISOString(),
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

function getIntervalFromStripeInterval(stripeInterval) {
  switch (stripeInterval) {
    case 'month':
      return 'monthly';
    case 'year':
      return 'annually';
    default:
      return 'monthly';
  }
}