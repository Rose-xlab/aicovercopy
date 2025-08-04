// app/pricing/page.tsx

// NO "use client" at the top. This is now a Server Component.
import { Suspense } from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, ArrowRight, Mail, CreditCard, Check } from "lucide-react";
import Link from "next/link";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import PricingClient from './PricingClient'; // Import the new dynamic component

// The page is now an async function to allow fetching data on the server.
export default async function PricingPage() {
  // Fetch user data on the server to correctly render the header and CTA
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Header - This is now rendered on the server */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-bold">Resume Mate AI</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="outline">Log In</Button>
                </Link>
                <Link href="/auth/register">
                  <Button>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Pricing Hero */}
      <section className="container mx-auto px-4 py-12 md:py-20 text-center max-w-5xl">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
          Choose the Right Plan for Your Career
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
          Unlock premium features to create professional cover letters, resumes, and prepare for interviews
        </p>
        
        {/* The dynamic pricing plans are now loaded via a Client Component inside Suspense */}
        <Suspense fallback={
          <div className="flex justify-center my-8">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        }>
          <PricingClient />
        </Suspense>
      </section>

      {/* Features Comparison - This is static JSX */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Compare Plan Features
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 w-1/3">Feature</th>
                <th className="text-center p-4">Free</th>
                <th className="text-center p-4 bg-teal-50">Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4 font-medium">Cover Letters</td>
                <td className="text-center p-4">1 per month</td>
                <td className="text-center p-4 bg-teal-50">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">Resumes</td>
                <td className="text-center p-4">1</td>
                <td className="text-center p-4 bg-teal-50">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">Templates</td>
                <td className="text-center p-4">Basic only</td>
                <td className="text-center p-4 bg-teal-50">All templates</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">ATS Scanner</td>
                <td className="text-center p-4">2 scans/month</td>
                <td className="text-center p-4 bg-teal-50">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">Interview Practice</td>
                <td className="text-center p-4">1 session</td>
                <td className="text-center p-4 bg-teal-50">Unlimited</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">AI Cover Letter Enhancement</td>
                <td className="text-center p-4">Basic</td>
                <td className="text-center p-4 bg-teal-50">Advanced</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">Support</td>
                <td className="text-center p-4">Standard email</td>
                <td className="text-center p-4 bg-teal-50">Priority email</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">Price</td>
                <td className="text-center p-4">$0</td>
                <td className="text-center p-4 bg-teal-50">
                  <div>$20/month</div>
                  <div className="text-xs text-teal-600 font-medium">or $100/year (save 58%)</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section - This is static JSX */}
      <section className="container mx-auto px-4 py-16 max-w-4xl">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="grid gap-6 md:gap-8">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Can I cancel my subscription at any time?</h3>
            <p className="text-gray-600">Yes, you can cancel your subscription at any time. You'll continue to have access to your plan's features until the end of your billing period.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">How do the billing cycles work?</h3>
            <p className="text-gray-600">We offer monthly and annual billing options. With annual billing, you'll save 58% compared to the monthly plan ($100/year instead of $240/year for monthly payments).</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">What payment methods do you accept?</h3>
            <p className="text-gray-600">We accept all major credit cards including Visa, Mastercard, American Express, and Discover.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Is there a free trial for paid plans?</h3>
            <p className="text-gray-600">All paid plans include a 7-day money-back guarantee. If you're not satisfied, simply contact our support team within 7 days of your purchase for a full refund.</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Can I upgrade or downgrade my plan?</h3>
            <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference for the remainder of your billing cycle. When downgrading, the change will take effect at the end of your current billing cycle.</p>
          </div>
        </div>
      </section>

      {/* Testimonials - This is static JSX */}
      <section className="bg-gradient-to-b from-teal-50 to-white py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <Card className="p-6 bg-white shadow-md border-teal-100">
              <div className="flex flex-col h-full">
                <div className="text-amber-400 flex mb-4">★★★★★</div>
                <p className="italic text-gray-700 mb-4 flex-grow">"The Pro plan was a game-changer for my job search. I landed interviews at two top companies within a week of using the ATS scanner to optimize my resume."</p>
                <div className="mt-2">
                  <p className="font-semibold">Thomas K.</p>
                  <p className="text-sm text-gray-500">Software Engineer</p>
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-white shadow-md border-teal-100">
               <div className="flex flex-col h-full">
                 <div className="text-amber-400 flex mb-4">★★★★★</div>
                 <p className="italic text-gray-700 mb-4 flex-grow">"Worth every penny! The annual plan saved me a lot of money, and the unlimited cover letters helped me customize applications for each position. I finally got my dream job!"</p>
                 <div className="mt-2">
                   <p className="font-semibold">Sarah J.</p>
                   <p className="text-sm text-gray-500">Marketing Director</p>
                 </div>
               </div>
            </Card>
            <Card className="p-6 bg-white shadow-md border-teal-100">
              <div className="flex flex-col h-full">
                <div className="text-amber-400 flex mb-4">★★★★★</div>
                <p className="italic text-gray-700 mb-4 flex-grow">"The interview preparation feature alone is worth the subscription. I felt so much more confident going into interviews and it showed. Landed my dream job after just 3 weeks!"</p>
                <div className="mt-2">
                  <p className="font-semibold">Michael T.</p>
                  <p className="text-sm text-gray-500">Product Manager</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - This is static JSX */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg shadow-xl p-8 md:p-12 text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Advance Your Career?</h2>
          <p className="text-lg mb-8 text-teal-50">
            Join thousands of professionals who have already improved their job search results with our AI-powered tools.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="bg-white text-teal-700 hover:bg-teal-50" asChild>
              <Link href="#pricing">
                <CreditCard className="mr-2 h-5 w-5" />
                Get Started Today
              </Link>
            </Button>
            {!user && (
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-teal-600" asChild>
                <Link href="/auth/register">
                  Create Free Account
                </Link>
              </Button>
            )}
          </div>
          <div className="mt-6 text-sm text-teal-100 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <div className="flex items-center">
              <Check className="h-4 w-4 mr-1" />
              No credit card required for Free plan
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 mr-1" />
              7-day money-back guarantee
            </div>
          </div>
        </div>
      </section>

      {/* Footer - This is static JSX */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <FileText className="h-5 w-5 text-primary mr-2" />
              <span className="font-semibold">Resume Mate AI</span>
            </div>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition">Terms of Service</Link>
              <Link href="#" className="hover:text-foreground transition">Privacy Policy</Link>
              <Link href="#" className="hover:text-foreground transition">Contact Us</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Resume Mate AI. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}