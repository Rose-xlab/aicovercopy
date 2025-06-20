"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import Onboarding from '@/components/Onboarding';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { createBrowserClient } from '@/lib/supabase';

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createBrowserClient();
  
  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!loading && !user) {
        // Redirect to login if not authenticated
        router.push('/auth/login?redirect=/onboarding');
        return;
      }
      
      if (user) {
        try {
          // Check if user has already completed onboarding
          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();
          
          if (error) throw error;
          
          // If onboarding is already completed, redirect to dashboard
          if (data && data.onboarding_completed) {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Error checking onboarding status:', error);
        }
      }
    };
    
    checkOnboardingStatus();
  }, [user, loading, router, supabase]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="h-10 w-10" />
      </div>
    );
  }
  
  if (!user) {
    return null; // Will redirect to login in useEffect
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-bold">Welcome to Resumemate AI</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            Let's set up your profile to personalize your experience and create better cover letters for your job applications.
          </p>
        </header>
        
        <Onboarding />
      </div>
    </div>
  );
}