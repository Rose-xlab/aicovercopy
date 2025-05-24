import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { stripe } from '@/lib/stripe';
import type Stripe from 'stripe';

interface StripeInvoice {
  id: string;
  stripe_invoice_id: string;
  stripe_subscription_id: string | null;
  amount: number;
  currency: string;
  status: string;
  created: number;
  created_at: string;
  period_start: string | null;
  period_end: string | null;
  invoice_pdf: string | null;
  description: string;
  plan?: string;
  interval?: string;
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get user's profile to find Stripe customer ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw profileError;
    }
    
    const stripeCustomerId = profile?.stripe_customer_id;
    
    // If user has a Stripe customer ID, attempt to fetch invoices from Stripe directly
    let stripeInvoices: StripeInvoice[] = [];
    if (stripeCustomerId) {
      try {
        const invoices = await stripe.invoices.list({
          customer: stripeCustomerId,
          limit: 100, // Increase if needed
        });
        
        // Map Stripe invoice data to our format
        stripeInvoices = invoices.data.map(invoice => {
          // Safely access potentially undefined properties
          const subscriptionId = invoice.subscription || null;
          const lineItem = invoice.lines.data[0] || {};
          
          return {
            id: invoice.id,
            stripe_invoice_id: invoice.id,
            stripe_subscription_id: subscriptionId,
            amount: invoice.amount_paid,
            currency: invoice.currency,
            status: invoice.status,
            created: invoice.created,
            created_at: new Date(invoice.created * 1000).toISOString(),
            period_start: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
            period_end: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
            invoice_pdf: invoice.invoice_pdf,
            description: invoice.description || `Subscription payment`,
            // Safely access plan details
            plan: (lineItem as any)?.plan?.nickname || 'Pro Plan',
            interval: (lineItem as any)?.plan?.interval || 'month',
          };
        });
      } catch (stripeError) {
        console.error('Error fetching Stripe invoices:', stripeError);
        // Continue using database invoices only
      }
    }
    
    // Get user's invoices from database as fallback or to merge with Stripe data
    const { data: dbInvoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching invoices from database:', error);
      // If Stripe invoices exist, use those instead of failing
      if (stripeInvoices.length > 0) {
        return NextResponse.json({ invoices: stripeInvoices });
      }
      throw error;
    }
    
    // Combine Stripe invoices with database invoices, removing duplicates
    let combinedInvoices: any[] = [...stripeInvoices];
    
    // Only add database invoices that aren't already in the Stripe list
    if (dbInvoices) {
      const stripeIds = new Set(stripeInvoices.map(inv => inv.stripe_invoice_id));
      
      dbInvoices.forEach(dbInvoice => {
        if (!stripeIds.has(dbInvoice.stripe_invoice_id)) {
          combinedInvoices.push(dbInvoice);
        }
      });
    }
    
    // Sort by created date descending
    combinedInvoices.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
    
    return NextResponse.json({ invoices: combinedInvoices });
  } catch (error: any) {
    console.error('Error fetching user invoices:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoice information' }, 
      { status: 500 }
    );
  }
}