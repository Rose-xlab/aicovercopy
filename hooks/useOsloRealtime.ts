"use client";

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@/lib/supabase';
import { RealtimeChannel, RealtimePostgresInsertPayload, RealtimePostgresUpdatePayload } from '@supabase/supabase-js';

// Define activity event types
export interface ActivityEvent {
  id: string;
  type: 'user_created' | 'cover_letter_created' | 'resume_created' | 'subscription_updated' | 'ats_scan' | 'interview_session' | 'follow_up_email';
  user_id: string;
  user_email?: string;
  details?: any;
  timestamp: string;
}

// Define payload types for better type safety
interface ProfilePayload {
  id: string;
  email?: string;
  created_at?: string;
}

interface CoverLetterPayload {
  id: string;
  user_id: string;
  job_title?: string;
  company_name?: string;
  created_at?: string;
}

interface ResumePayload {
  id: string;
  user_id: string;
  title?: string;
  created_at?: string;
}

interface SubscriptionPayload {
  id: string;
  user_id: string;
  status?: string;
  plan_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface ATSAnalysisPayload {
  id: string;
  user_id: string;
  resume_id?: string;
  created_at?: string;
}

interface InterviewSessionPayload {
  id: string;
  user_id: string;
  job_title?: string;
  created_at?: string;
}

interface FollowUpEmailPayload {
  id: string;
  user_id: string;
  job_title?: string;
  company_name?: string;
  created_at?: string;
}

export function useOsloRealtime() {
  const [newEvents, setNewEvents] = useState<ActivityEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const supabase = createBrowserClient();
  
  useEffect(() => {
    // Set up real-time subscriptions to various tables
    
    // Subscribe to profiles changes
    const usersSubscription = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        (payload: RealtimePostgresInsertPayload<ProfilePayload>) => {
          console.log('New user inserted:', payload);
          // Transform payload into ActivityEvent
          const newEvent: ActivityEvent = {
            id: `user-${payload.new.id}`,
            type: 'user_created',
            user_id: payload.new.id,
            user_email: payload.new.email,
            timestamp: payload.new.created_at || new Date().toISOString(),
          };
          
          setNewEvents(newEvent);
        }
      )
      .subscribe((status) => {
        console.log('Users channel status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });
      
    // Subscribe to cover letters changes
    const coverLettersSubscription = supabase
      .channel('public:cover_letters')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'cover_letters'
        },
        (payload: RealtimePostgresInsertPayload<CoverLetterPayload>) => {
          console.log('New cover letter inserted:', payload);
          // Transform payload into ActivityEvent
          const newEvent: ActivityEvent = {
            id: `letter-${payload.new.id}`,
            type: 'cover_letter_created',
            user_id: payload.new.user_id,
            details: {
              job_title: payload.new.job_title,
              company_name: payload.new.company_name,
            },
            timestamp: payload.new.created_at || new Date().toISOString(),
          };
          
          setNewEvents(newEvent);
        }
      )
      .subscribe();
      
    // Subscribe to resumes changes
    const resumesSubscription = supabase
      .channel('public:resumes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'resumes'
        },
        (payload: RealtimePostgresInsertPayload<ResumePayload>) => {
          console.log('New resume inserted:', payload);
          // Transform payload into ActivityEvent
          const newEvent: ActivityEvent = {
            id: `resume-${payload.new.id}`,
            type: 'resume_created',
            user_id: payload.new.user_id,
            details: {
              title: payload.new.title,
            },
            timestamp: payload.new.created_at || new Date().toISOString(),
          };
          
          setNewEvents(newEvent);
        }
      )
      .subscribe();
      
    // Subscribe to subscriptions changes  
    const subscriptionsSubscription = supabase
      .channel('public:subscriptions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'subscriptions'
        },
        (payload: RealtimePostgresInsertPayload<SubscriptionPayload>) => {
          console.log('New subscription inserted:', payload);
          // Transform payload into ActivityEvent
          const newEvent: ActivityEvent = {
            id: `subscription-${payload.new.id}`,
            type: 'subscription_updated',
            user_id: payload.new.user_id,
            details: {
              status: payload.new.status,
              plan_id: payload.new.plan_id,
            },
            timestamp: payload.new.created_at || new Date().toISOString(),
          };
          
          setNewEvents(newEvent);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'subscriptions'
        },
        (payload: RealtimePostgresUpdatePayload<SubscriptionPayload>) => {
          console.log('Subscription updated:', payload);
          // Transform payload into ActivityEvent
          const newEvent: ActivityEvent = {
            id: `subscription-update-${payload.new.id}-${Date.now()}`,
            type: 'subscription_updated',
            user_id: payload.new.user_id,
            details: {
              status: payload.new.status,
              plan_id: payload.new.plan_id,
            },
            timestamp: payload.new.updated_at || new Date().toISOString(),
          };
          
          setNewEvents(newEvent);
        }
      )
      .subscribe();
      
    // Subscribe to ATS scans
    const atsScansSubscription = supabase
      .channel('public:resume_ats_analyses')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'resume_ats_analyses'
        },
        (payload: RealtimePostgresInsertPayload<ATSAnalysisPayload>) => {
          console.log('New ATS scan inserted:', payload);
          // Transform payload into ActivityEvent
          const newEvent: ActivityEvent = {
            id: `ats-scan-${payload.new.id}`,
            type: 'ats_scan',
            user_id: payload.new.user_id,
            details: {
              resume_id: payload.new.resume_id,
            },
            timestamp: payload.new.created_at || new Date().toISOString(),
          };
          
          setNewEvents(newEvent);
        }
      )
      .subscribe();
      
    // Subscribe to interview sessions
    const interviewSessionsSubscription = supabase
      .channel('public:interview_sessions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'interview_sessions'
        },
        (payload: RealtimePostgresInsertPayload<InterviewSessionPayload>) => {
          console.log('New interview session inserted:', payload);
          // Transform payload into ActivityEvent
          const newEvent: ActivityEvent = {
            id: `interview-${payload.new.id}`,
            type: 'interview_session',
            user_id: payload.new.user_id,
            details: {
              job_title: payload.new.job_title,
            },
            timestamp: payload.new.created_at || new Date().toISOString(),
          };
          
          setNewEvents(newEvent);
        }
      )
      .subscribe();
      
    // Subscribe to follow-up emails
    const followUpEmailsSubscription = supabase
      .channel('public:follow_up_emails')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'follow_up_emails'
        },
        (payload: RealtimePostgresInsertPayload<FollowUpEmailPayload>) => {
          console.log('New follow-up email inserted:', payload);
          // Transform payload into ActivityEvent
          const newEvent: ActivityEvent = {
            id: `followup-${payload.new.id}`,
            type: 'follow_up_email',
            user_id: payload.new.user_id,
            details: {
              job_title: payload.new.job_title,
              company_name: payload.new.company_name,
            },
            timestamp: payload.new.created_at || new Date().toISOString(),
          };
          
          setNewEvents(newEvent);
        }
      )
      .subscribe();
    
    // Cleanup function
    return () => {
      supabase.removeChannel(usersSubscription);
      supabase.removeChannel(coverLettersSubscription);
      supabase.removeChannel(resumesSubscription);
      supabase.removeChannel(subscriptionsSubscription);
      supabase.removeChannel(atsScansSubscription);
      supabase.removeChannel(interviewSessionsSubscription);
      supabase.removeChannel(followUpEmailsSubscription);
    };
  }, [supabase]);
  
  return {
    newEvents,
    isConnected,
  };
}