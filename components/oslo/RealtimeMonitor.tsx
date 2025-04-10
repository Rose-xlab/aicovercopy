"use client";

import { useState, useEffect } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { 
  FileText, 
  UserPlus, 
  CreditCard, 
  FileSpreadsheet, 
  ScanSearch, 
  MessagesSquare,
  User,
  MailCheck
} from "lucide-react";
import { useOsloRealtime } from "@/hooks/useOsloRealtime";

interface ActivityEvent {
  id: string;
  type: 'user_created' | 'cover_letter_created' | 'resume_created' | 'subscription_updated' | 'ats_scan' | 'interview_session' | 'follow_up_email';
  user_id: string;
  user_email?: string; // This is defined as optional string (string | undefined)
  details?: any;
  timestamp: string;
}

// Define profile type for the API results
interface Profile {
  id: string;
  email: string | null; // Allow null to match database
  created_at?: string; // Make optional since it might not exist in the table
}

// Define cover letter type for the API results
interface CoverLetter {
  id: string;
  user_id: string;
  job_title: string | null;
  company_name: string | null;
  created_at: string | null;
}

export function RealtimeMonitor() {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createBrowserClient();
  
  // Custom hook for real-time updates
  const { newEvents } = useOsloRealtime();
  
  // Load initial activity data
  useEffect(() => {
    const loadInitialActivities = async () => {
      try {
        setIsLoading(true);
        
        // In a real application, you would fetch from a dedicated activity log table
        // For this example, we'll simulate by getting recent entries from various tables
        
        // Get recent users - use updated_at instead of created_at if that's what exists in the profiles table
        const { data: recentUsers, error: usersError } = await supabase
          .from('profiles')
          .select('id, email, updated_at') // Changed from created_at to updated_at
          .order('updated_at', { ascending: false }) // Changed from created_at to updated_at
          .limit(5);
          
        if (usersError) throw usersError;
        
        // Get recent cover letters
        const { data: recentCoverLetters, error: coverLettersError } = await supabase
          .from('cover_letters')
          .select('id, user_id, job_title, company_name, created_at')
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (coverLettersError) throw coverLettersError;
        
        // Transform data into activity events - ensure we handle the data type safely
        const userActivities: ActivityEvent[] = recentUsers ? recentUsers.map(user => ({
          id: `user-${user.id}`,
          type: 'user_created',
          user_id: user.id,
          user_email: user.email || undefined, // Convert null to undefined to match the ActivityEvent type
          timestamp: user.updated_at || new Date().toISOString(), // Use updated_at instead of created_at
        })) : [];
        
        const coverLetterActivities: ActivityEvent[] = recentCoverLetters ? recentCoverLetters.map(letter => ({
          id: `letter-${letter.id}`,
          type: 'cover_letter_created',
          user_id: letter.user_id,
          details: {
            job_title: letter.job_title,
            company_name: letter.company_name,
          },
          timestamp: letter.created_at || new Date().toISOString(), // Provide default if null
        })) : [];
        
        // Combine and sort by timestamp
        const allActivities = [...userActivities, ...coverLetterActivities]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10); // Only show the 10 most recent
          
        setActivities(allActivities);
      } catch (err) {
        console.error('Error loading initial activities:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialActivities();
  }, [supabase]);
  
  // Add new events from real-time updates
  useEffect(() => {
    if (newEvents) {
      setActivities(prev => {
        // Add new event to the top of the list
        const updated = [newEvents, ...prev];
        // Keep only the 10 most recent events
        return updated.slice(0, 10);
      });
    }
  }, [newEvents]);
  
  // Function to get the appropriate icon for each activity type
  const getActivityIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'user_created':
        return <UserPlus className="h-5 w-5 text-green-500" />;
      case 'cover_letter_created':
        return <FileText className="h-5 w-5 text-teal-500" />;
      case 'resume_created':
        return <FileSpreadsheet className="h-5 w-5 text-blue-500" />;
      case 'subscription_updated':
        return <CreditCard className="h-5 w-5 text-purple-500" />;
      case 'ats_scan':
        return <ScanSearch className="h-5 w-5 text-amber-500" />;
      case 'interview_session':
        return <MessagesSquare className="h-5 w-5 text-indigo-500" />;
      case 'follow_up_email':
        return <MailCheck className="h-5 w-5 text-pink-500" />;
      default:
        return <User className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Function to format the activity message
  const getActivityMessage = (activity: ActivityEvent) => {
    switch (activity.type) {
      case 'user_created':
        return `New user registered: ${activity.user_email || 'Unknown user'}`;
      case 'cover_letter_created':
        return `Cover letter created for ${activity.details?.job_title || 'a position'} at ${activity.details?.company_name || 'a company'}`;
      case 'resume_created':
        return `New resume created`;
      case 'subscription_updated':
        return `Subscription ${activity.details?.status || 'updated'}: ${activity.details?.plan_id || 'plan'}`;
      case 'ats_scan':
        return `ATS scan performed`;
      case 'interview_session':
        return `Interview practice session created`;
      case 'follow_up_email':
        return `Follow-up email created`;
      default:
        return 'Unknown activity';
    }
  };
  
  // Function to format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-pulse flex justify-center">
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
        <div className="mt-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex px-6 py-3 border-b last:border-0 animate-pulse">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 mr-3"></div>
              <div className="flex-1">
                <div className="h-4 w-3/4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-1/4 bg-gray-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="divide-y">
      {activities.length > 0 ? (
        activities.map((activity) => (
          <div key={activity.id} className="flex items-start px-6 py-3 hover:bg-gray-50">
            <div className="flex-shrink-0 mr-3">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {getActivityMessage(activity)}
              </p>
              <p className="text-xs text-gray-500">
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          No recent activity to display
        </div>
      )}
    </div>
  );
}