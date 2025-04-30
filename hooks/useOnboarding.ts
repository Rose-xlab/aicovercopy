"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { createBrowserClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export function useOnboarding() {
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createBrowserClient();
  const { toast } = useToast();

  // Check if user has completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (loading) return;
      
      if (!user) {
        setOnboardingCompleted(null);
        setIsCheckingStatus(false);
        return;
      }
      
      try {
        setIsCheckingStatus(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        setOnboardingCompleted(data?.onboarding_completed || false);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setOnboardingCompleted(false);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    
    checkOnboardingStatus();
  }, [user, loading, supabase]);

  // Mark onboarding as completed
  const completeOnboarding = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setOnboardingCompleted(true);
      
      toast({
        title: "Profile Setup Complete",
        description: "Your profile has been set up successfully.",
      });
      
      return true;
    } catch (error) {
      console.error('Error marking onboarding as completed:', error);
      
      toast({
        title: "Error",
        description: "Failed to complete profile setup. Please try again.",
        variant: "destructive",
      });
      
      return false;
    }
  };

  // Redirect to onboarding
  const redirectToOnboarding = () => {
    router.push('/onboarding');
  };

  // Skip onboarding
  const skipOnboarding = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      setOnboardingCompleted(true);
      
      toast({
        title: "Onboarding Skipped",
        description: "You can update your profile information later in settings.",
      });
      
      router.push('/dashboard');
      
      return true;
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      
      toast({
        title: "Error",
        description: "Failed to skip onboarding. Please try again.",
        variant: "destructive",
      });
      
      return false;
    }
  };

  return {
    onboardingCompleted,
    isCheckingStatus,
    completeOnboarding,
    redirectToOnboarding,
    skipOnboarding
  };
}