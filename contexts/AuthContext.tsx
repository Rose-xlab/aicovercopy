"use client";

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getBrowserClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signInWithProvider: (provider: 'google', options?: any) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  checkOnboardingStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const [supabase] = useState(() => getBrowserClient());

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error fetching initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          router.refresh();
        } else if (event === 'SIGNED_OUT') {
          router.push('/');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (error: any) {
      console.error('Error signing in:', error);
      return { data: null, error };
    }
  }, [supabase]);

  const signInWithProvider = useCallback(async (
    provider: 'google',
    options?: { redirectTo?: string }
  ) => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          // CORRECTED: Point to your server-side API route for the callback
          redirectTo: `${window.location.origin}/api/auth/callback`,
        }
      });
      
      return { data, error };
    } catch (error: any) {
      console.error(`Error signing in with ${provider}:`, error);
      return { data: null, error };
    }
  }, [supabase]);

  const signUp = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/login`,
        },
      });

      if (!error && data) {
        localStorage.setItem('pendingOnboarding', 'true');
        toast({
          title: "Account created! ✅",
          description: "Please check your email to confirm your account.",
        });
      }

      return { data, error };
    } catch (error: any) {
      console.error('Error signing up:', error);
      return { data: null, error };
    }
  }, [supabase, toast]);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        localStorage.removeItem('pendingOnboarding');
      }
      return { error };
    } catch (error: any) {
      console.error('Error signing out:', error);
      return { error };
    }
  }, [supabase]);

  const resetPassword = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      return { error };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      return { error };
    }
  }, [supabase]);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      return { error };
    } catch (error: any) {
      console.error('Error updating password:', error);
      return { error };
    }
  }, [supabase]);

  const checkOnboardingStatus = useCallback(async () => {
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
  }, [supabase, user]);

  const value = {
    user,
    session,
    loading,
    signIn,
    signInWithProvider,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    checkOnboardingStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
};