"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

// Special admin email that will bypass checks
const TEMP_ADMIN_EMAIL = 'jennifernanyombi1@gmail.com';

export function useOsloAuth() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createBrowserClient();

  useEffect(() => {
    // Check if there's an active session on mount
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session?.user) {
          // Bypass check for special admin email
          if (session.user.email === TEMP_ADMIN_EMAIL) {
            setUser(session.user);
            return;
          }
          
          // For all other users, verify admin privileges as normal
          const { data: adminData, error: adminError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();
            
          if (adminError) throw adminError;
          
          // Only set user if they have admin privileges
          if (adminData?.is_admin) {
            setUser(session.user);
          } else {
            // User is authenticated but not an admin
            await supabase.auth.signOut(); // Sign them out
            throw new Error('Unauthorized: Admin privileges required');
          }
        }
      } catch (error: any) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Bypass check for special admin email
        if (session.user.email === TEMP_ADMIN_EMAIL) {
          setUser(session.user);
          return;
        }
        
        // Verify admin privileges when signing in for other users
        try {
          const { data: adminData, error: adminError } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();
            
          if (adminError) throw adminError;
          
          if (adminData?.is_admin) {
            setUser(session.user);
          } else {
            // User is authenticated but not an admin
            await supabase.auth.signOut(); // Sign them out
            throw new Error('Unauthorized: Admin privileges required');
          }
        } catch (error: any) {
          console.error('Auth verification error:', error);
          toast({
            title: "Authentication Failed",
            description: "You don't have administrator privileges",
            variant: "destructive",
          });
          setUser(null);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    checkSession();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Bypass admin check for special admin email
      if (data?.user && data.user.email === TEMP_ADMIN_EMAIL) {
        // Successfully signed in as admin
        toast({
          title: "Signed in",
          description: "Welcome to the admin dashboard",
        });
        setUser(data.user);
        return { success: true };
      }

      // For all other users, verify admin privileges as normal
      if (data?.user) {
        const { data: adminData, error: adminError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', data.user.id)
          .single();
          
        if (adminError) throw adminError;
        
        if (!adminData?.is_admin) {
          // User is authenticated but not an admin
          await supabase.auth.signOut(); // Sign them out
          throw new Error('Unauthorized: Admin privileges required');
        }
        
        // Successfully signed in as admin
        toast({
          title: "Signed in",
          description: "Welcome to the admin dashboard",
        });
        
        return { success: true };
      }
      
      return { success: false, error: new Error('Sign in failed') };
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "Failed to sign in. Please check your credentials.",
        variant: "destructive",
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You have been signed out of the admin dashboard",
      });
      
      router.push('/oslo/auth/login');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    signIn,
    signOut,
  };
}