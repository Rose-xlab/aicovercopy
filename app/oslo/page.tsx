"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Users, 
  CreditCard, 
  FileText, 
  RefreshCw, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  BarChart,
  FileCheck,
  MailCheck
} from "lucide-react";
import { RealtimeMonitor } from "@/components/oslo/RealtimeMonitor";

interface DashboardStats {
  userCount: number;
  activeSubscriptions: number;
  freeUsers: number;
  proUsers: number;
  businessUsers: number;
  coverLettersCount: number;
  resumesCount: number;
  followUpEmailsCount: number;
  atsScansCount: number;
  interviewSessionsCount: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  const loadDashboardStats = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      // Get user count
      const { count: userCount, error: userError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (userError) throw userError;

      // Get subscription counts
      const { data: subscriptions, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('plan_id, status');

      if (subscriptionError) throw subscriptionError;

      const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active').length;
      const planCounts = subscriptions.reduce((acc: any, sub) => {
        if (sub.status === 'active') {
          acc[sub.plan_id] = (acc[sub.plan_id] || 0) + 1;
        }
        return acc;
      }, {});

      // Free users = total users - users with active subscriptions
      const freeUsers = userCount - activeSubscriptions;
      
      // Get cover letters count
      const { count: coverLettersCount, error: coverLettersError } = await supabase
        .from('cover_letters')
        .select('*', { count: 'exact', head: true });
        
      if (coverLettersError) throw coverLettersError;
      
      // Get resumes count
      const { count: resumesCount, error: resumesError } = await supabase
        .from('resumes')
        .select('*', { count: 'exact', head: true });
        
      if (resumesError) throw resumesError;
      
      // Get follow-up emails count
      const { count: followUpEmailsCount, error: followUpEmailsError } = await supabase
        .from('follow_up_emails')
        .select('*', { count: 'exact', head: true });
        
      if (followUpEmailsError) throw followUpEmailsError;
      
      // Get ATS scans count
      const { count: atsScansCount, error: atsScansError } = await supabase
        .from('resume_ats_analyses')
        .select('*', { count: 'exact', head: true });
        
      if (atsScansError) throw atsScansError;
      
      // Get interview sessions count
      const { count: interviewSessionsCount, error: interviewSessionsError } = await supabase
        .from('interview_sessions')
        .select('*', { count: 'exact', head: true });
        
      if (interviewSessionsError) throw interviewSessionsError;

      // Set dashboard stats
      setStats({
        userCount: userCount || 0,
        activeSubscriptions,
        freeUsers,
        proUsers: planCounts['pro'] || 0,
        businessUsers: planCounts['business'] || 0,
        coverLettersCount: coverLettersCount || 0,
        resumesCount: resumesCount || 0,
        followUpEmailsCount: followUpEmailsCount || 0,
        atsScansCount: atsScansCount || 0,
        interviewSessionsCount: interviewSessionsCount || 0
      });
    } catch (err: any) {
      console.error('Error loading dashboard stats:', err);
      setError(err.message || 'Failed to load dashboard statistics');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    loadDashboardStats();
  }, []);

  const handleRefresh = () => {
    loadDashboardStats();
  };

  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner className="h-8 w-8 mr-3" />
        <p className="text-lg">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your application's performance and user activity
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="w-full md:w-auto"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md mb-6 flex items-center">
          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* User and Subscription Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.userCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Free: {stats?.freeUsers || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pro: {stats?.proUsers || 0} | Business: {stats?.businessUsers || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.coverLettersCount || 0) + (stats?.resumesCount || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cover Letters: {stats?.coverLettersCount || 0} | Resumes: {stats?.resumesCount || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.atsScansCount || 0) + (stats?.interviewSessionsCount || 0) + (stats?.followUpEmailsCount || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ATS Scans: {stats?.atsScansCount || 0} | Interviews: {stats?.interviewSessionsCount || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Feature Usage</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2 text-teal-500" />
              Cover Letters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.coverLettersCount || 0}</div>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="bg-teal-500 h-full rounded-full" 
                style={{ width: `${Math.min(100, ((stats?.coverLettersCount || 0) / 100) * 100)}%` }}
              ></div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>100</span>
              <span>1000+</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileCheck className="h-4 w-4 mr-2 text-blue-500" />
              Resumes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.resumesCount || 0}</div>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full" 
                style={{ width: `${Math.min(100, ((stats?.resumesCount || 0) / 50) * 100)}%` }}
              ></div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>50</span>
              <span>500+</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <MailCheck className="h-4 w-4 mr-2 text-purple-500" />
              Follow-Up Emails
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.followUpEmailsCount || 0}</div>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full rounded-full" 
                style={{ width: `${Math.min(100, ((stats?.followUpEmailsCount || 0) / 30) * 100)}%` }}
              ></div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>30</span>
              <span>300+</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart className="h-4 w-4 mr-2 text-green-500" />
              ATS Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.atsScansCount || 0}</div>
            <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="bg-green-500 h-full rounded-full" 
                style={{ width: `${Math.min(100, ((stats?.atsScansCount || 0) / 40) * 100)}%` }}
              ></div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>40</span>
              <span>400+</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Real-time Activity Monitor</h2>
      <Card>
        <CardHeader>
          <CardTitle>Live User Activity</CardTitle>
          <CardDescription>
            Real-time monitoring of user activities across the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <RealtimeMonitor />
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Quick Actions</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button asChild variant="outline" className="h-20">
          <Link href="/oslo/users">
            <Users className="h-5 w-5 mr-2" />
            Manage Users
          </Link>
        </Button>
        
        <Button asChild variant="outline" className="h-20">
          <Link href="/oslo/subscriptions">
            <CreditCard className="h-5 w-5 mr-2" />
            View Subscriptions
          </Link>
        </Button>
        
        <Button asChild variant="outline" className="h-20">
          <Link href="/oslo/analytics">
            <TrendingUp className="h-5 w-5 mr-2" />
            View Analytics
          </Link>
        </Button>
        
        <Button asChild variant="outline" className="h-20">
          <Link href="/oslo/templates">
            <FileText className="h-5 w-5 mr-2" />
            Manage Templates
          </Link>
        </Button>
      </div>
    </div>
  );
}