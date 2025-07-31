import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { stripe } from '@/lib/stripe';
import type { Database } from '@/types/supabase'; // Import Database type

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
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
    
    // FIX: Initialize as an array of 'any' to avoid strict type checking issues later.
    let stripeInvoices: any[] = [];
    if (stripeCustomerId) {
      try {
        const invoices = await stripe.invoices.list({
          customer: stripeCustomerId,
          limit: 100,
          expand: ['data.subscription'], // Expand subscription details
        });
        
        // FIX: Map Stripe invoice data, casting to 'any' to bypass type errors.
        stripeInvoices = invoices.data.map(invoice => {
          const inv = invoice as any; // Treat as 'any' to access properties without type errors.
          const lineItem = inv.lines.data[0];
          const plan = lineItem?.plan;

          return {
            id: inv.id,
            stripe_invoice_id: inv.id,
            // Safely access the subscription ID
            stripe_subscription_id: typeof inv.subscription === 'string' ? inv.subscription : (inv.subscription?.id || null),
            amount: inv.amount_paid,
            currency: inv.currency,
            status: inv.status,
            created: inv.created,
            created_at: new Date(inv.created * 1000).toISOString(),
            period_start: new Date(inv.period_start * 1000).toISOString(),
            period_end: new Date(inv.period_end * 1000).toISOString(),
            invoice_pdf: inv.invoice_pdf,
            description: inv.description || lineItem?.description || 'Subscription payment',
            plan: plan?.nickname || 'Subscription',
            interval: plan?.interval || 'month',
          };
        });
      } catch (stripeError) {
        console.error('Error fetching Stripe invoices:', stripeError);
      }
    }
    
    const { data: dbInvoices, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching invoices from database:', error);
      if (stripeInvoices.length > 0) {
        return NextResponse.json({ invoices: stripeInvoices });
      }
      throw error;
    }
    
    let combinedInvoices: any[] = [...stripeInvoices];
    
    if (dbInvoices) {
      const stripeIds = new Set(stripeInvoices.map(inv => inv.stripe_invoice_id));
      
      dbInvoices.forEach(dbInvoice => {
        if (!stripeIds.has(dbInvoice.stripe_invoice_id)) {
          combinedInvoices.push(dbInvoice);
        }
      });
    }
    
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
