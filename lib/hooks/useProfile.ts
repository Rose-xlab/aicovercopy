"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { useAuth } from './useAuth';
import { Database } from '@/types/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createBrowserClient();

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!user) throw new Error('Not authenticated');

      // Prepare the update data with the current timestamp
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updateData,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update local state with the new profile data
      setProfile(data);
      
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    refresh: fetchProfile,
  };
}