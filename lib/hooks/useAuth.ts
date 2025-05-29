//lib\hooks\useAuth.ts

"use client";

import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // Initially get the session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error fetching initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }
  };

  const signInWithProvider = async (
    provider: 'google' | 'github' | 'linkedin',
    options?: {
      scopes?: string[],
      redirectTo?: string
    }
  ) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: options?.redirectTo || `${window.location.origin}/auth/callback`,
          scopes: provider === 'linkedin'
            ? ['openid', 'profile', 'email']
            : options?.scopes,
          // Add provider-specific configuration
          ...(provider === 'linkedin' && {
            provider: 'linkedin'
          })
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      console.error(`Error signing in with ${provider}:`, error);
      return { data: null, error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      
      // Store flag for redirecting to onboarding after verification
      localStorage.setItem('pendingOnboarding', 'true');

      // Show success toast
      toast({
        title: "Account created!",
        description: "Please check your email to confirm your account, then complete your profile setup."
      });

      return { data, error: null };
    } catch (error: any) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Check your email for a password reset link."
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been successfully updated."
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error updating password:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any pending onboarding
      localStorage.removeItem('pendingOnboarding');
      
      // Redirect to home page
      router.push('/');
      
      return { error: null };
    } catch (error: any) {
      console.error('Error signing out:', error);
      return { error };
    }
  };

  // Check if the user has completed onboarding
  const checkOnboardingStatus = async () => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      return data?.onboarding_completed || false;
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  };

  return {
    user,
    loading,
    signIn,
    signInWithProvider,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    checkOnboardingStatus
  };
}