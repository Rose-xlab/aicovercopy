"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Briefcase, 
  CreditCard, 
  Shield, 
  Clock, 
  CheckCircle2, 
  Ban, 
  Edit, 
  Trash, 
  MoreVertical,
  AlertTriangle,
  FileText,
  FileBadge,
  MailCheck,
  ScanSearch,
  MessagesSquare,
  FileSpreadsheet
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Link from "next/link";

// Define user type
interface User {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  location: string | null;
  created_at: string;
  updated_at: string | null;
  onboarding_completed: boolean | null;
  stripe_customer_id: string | null;
  is_admin: boolean | null;
  status: 'active' | 'suspended' | 'deleted';
  // Additional profile fields
  industry: string | null;
  job_search_status: string | null;
  current_role: string | null;
  desired_role: string | null;
  desired_industries: string[] | null;
  experience_level: string | null;
  professional_summary: string | null;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  interval: string;
  current_period_end: string;
  current_period_start: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
}

interface UserActivity {
  type: string;
  id: string;
  date: string;
  title: string;
  details?: string;
}

export default function UserDetailPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  
  const params = useParams();
  const router = useRouter();
  const supabase = createBrowserClient();
  
  // Get the user ID from params
  const userId = params.id as string;
  
  // Fetch user activities from various tables
  const fetchUserActivities = useCallback(async (userId: string) => {
    try {
      // Fetch cover letters
      const { data: coverLetters, error: coverLettersError } = await supabase
        .from('cover_letters')
        .select('id, job_title, company_name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (coverLettersError) throw coverLettersError;
      
      // Fetch resumes
      const { data: resumes, error: resumesError } = await supabase
        .from('resumes')
        .select('id, title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (resumesError) throw resumesError;
      
      // Fetch ATS scans
      const { data: atsScans, error: atsScansError } = await supabase
        .from('resume_ats_analyses')
        .select('id, created_at, resume_id, resumes(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (atsScansError) throw atsScansError;
      
      // Fetch follow-up emails
      const { data: followUpEmails, error: followUpEmailsError } = await supabase
        .from('follow_up_emails')
        .select('id, job_title, company_name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (followUpEmailsError) throw followUpEmailsError;
      
      // Fetch interview sessions
      const { data: interviewSessions, error: interviewSessionsError } = await supabase
        .from('interview_sessions')
        .select('id, job_title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (interviewSessionsError) throw interviewSessionsError;
      
      // Transform data into activities
      const coverLetterActivities: UserActivity[] = (coverLetters || []).map(letter => ({
        type: 'cover_letter',
        id: letter.id,
        date: letter.created_at || new Date().toISOString(),
        title: `Created cover letter for ${letter.job_title || 'unknown position'} at ${letter.company_name || 'unknown company'}`,
        details: letter.job_title ? `${letter.job_title} at ${letter.company_name || 'unknown company'}` : undefined
      }));
      
      const resumeActivities: UserActivity[] = (resumes || []).map(resume => ({
        type: 'resume',
        id: resume.id,
        date: resume.created_at || new Date().toISOString(),
        title: `Created resume: ${resume.title || 'Untitled Resume'}`,
        details: resume.title || undefined
      }));
      
      const atsScanActivities: UserActivity[] = (atsScans || []).map(scan => ({
        type: 'ats_scan',
        id: scan.id,
        date: scan.created_at || new Date().toISOString(),
        title: `Performed ATS scan on resume`,
        details: scan.resumes?.title ? `Resume: ${scan.resumes.title}` : undefined
      }));
      
      const followUpEmailActivities: UserActivity[] = (followUpEmails || []).map(email => ({
        type: 'follow_up_email',
        id: email.id,
        date: email.created_at || new Date().toISOString(),
        title: `Created follow-up email for ${email.job_title || 'unknown position'} at ${email.company_name || 'unknown company'}`,
        details: email.job_title ? `${email.job_title} at ${email.company_name || 'unknown company'}` : undefined
      }));
      
      const interviewSessionActivities: UserActivity[] = (interviewSessions || []).map(session => ({
        type: 'interview_session',
        id: session.id,
        date: session.created_at || new Date().toISOString(),
        title: `Created interview practice for ${session.job_title || 'unknown position'}`,
        details: session.job_title || undefined
      }));
      
      // Combine all activities
      const allActivities = [
        ...coverLetterActivities,
        ...resumeActivities,
        ...atsScanActivities,
        ...followUpEmailActivities,
        ...interviewSessionActivities
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setActivities(allActivities);
      
    } catch (err: any) {
      console.error('Error fetching user activities:', err);
      // Don't fail the whole page load for activities
    }
  }, [supabase]);
  
  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // UPDATED: Use query parameter approach instead of dynamic route
        const response = await fetch(`/api/oslo/users?id=${userId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch user data');
        }
        
        const data = await response.json();
        
        // Set user data
        setUser({
          ...data.user,
          status: (data.user.status as 'active' | 'suspended' | 'deleted') || 'active' // Default to active if status not set
        });
        
        // Set subscription data
        setSubscription(data.subscription);
        
        // Fetch user activities directly from Supabase
        await fetchUserActivities(userId);
        
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId, fetchUserActivities]);
  
  // Handle user suspension
  const handleSuspendUser = async () => {
    if (!user) return;
    
    try {
      // UPDATED: Use query parameter approach
      const response = await fetch(`/api/oslo/users?id=${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'suspended' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to suspend user');
      }
      
      // Update local state
      setUser(prev => prev ? { ...prev, status: 'suspended' } : null);
      
    } catch (err: any) {
      console.error('Error suspending user:', err);
      setError(err.message || 'Failed to suspend user');
    }
  };
  
  // Handle user reactivation
  const handleReactivateUser = async () => {
    if (!user) return;
    
    try {
      // UPDATED: Use query parameter approach
      const response = await fetch(`/api/oslo/users?id=${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'active' }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reactivate user');
      }
      
      // Update local state
      setUser(prev => prev ? { ...prev, status: 'active' } : null);
      
    } catch (err: any) {
      console.error('Error reactivating user:', err);
      setError(err.message || 'Failed to reactivate user');
    }
  };
  
  // Function to get the icon for different activity types
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'cover_letter':
        return <FileText className="h-4 w-4 text-teal-500" />;
      case 'resume':
        return <FileSpreadsheet className="h-4 w-4 text-blue-500" />;
      case 'ats_scan':
        return <ScanSearch className="h-4 w-4 text-amber-500" />;
      case 'follow_up_email':
        return <MailCheck className="h-4 w-4 text-purple-500" />;
      case 'interview_session':
        return <MessagesSquare className="h-4 w-4 text-indigo-500" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format date with time for display
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner className="h-8 w-8 mr-3" />
        <p className="text-lg">Loading user data...</p>
      </div>
    );
  }
  
  if (error || !user) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error || 'User not found'}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" asChild>
            <Link href="/oslo/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-8 px-4 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center">
          <Button variant="outline" asChild className="mr-4">
            <Link href="/oslo/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">User Details</h1>
        </div>
        
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Actions
                <MoreVertical className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>User Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/oslo/users/${user.id}/edit`)}>
                <Edit className="h-4 w-4 mr-2 text-amber-500" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Mail className="h-4 w-4 mr-2 text-blue-500" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.status === 'active' ? (
                <DropdownMenuItem onClick={handleSuspendUser}>
                  <Ban className="h-4 w-4 mr-2 text-red-500" />
                  Suspend User
                </DropdownMenuItem>
              ) : user.status === 'suspended' ? (
                <DropdownMenuItem onClick={handleReactivateUser}>
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  Reactivate User
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem className="text-red-500">
                <Trash className="h-4 w-4 mr-2 text-red-500" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* User Header Card */}
      <Card className="mb-6">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0 flex items-start">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold">
                {user.first_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-2xl font-bold">
                    {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User'}
                    {user.is_admin && (
                      <Badge className="ml-2 bg-amber-500">Admin</Badge>
                    )}
                  </h2>
                  <p className="text-muted-foreground flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {user.email}
                  </p>
                </div>
                
                <div>
                  <Badge 
                    variant={
                      user.status === 'active' ? 'default' : 
                      user.status === 'suspended' ? 'outline' : 'destructive'
                    }
                    className="text-sm py-1.5"
                  >
                    {user.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-muted-foreground mr-1">Joined:</span>
                  <span>{formatDate(user.created_at)}</span>
                </div>
                
                {user.location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-muted-foreground mr-1">Location:</span>
                    <span>{user.location}</span>
                  </div>
                )}
                
                {user.job_title && (
                  <div className="flex items-center text-sm">
                    <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="text-muted-foreground mr-1">Job Title:</span>
                    <span>{user.job_title}</span>
                  </div>
                )}
                
                <div className="flex items-center text-sm">
                  <CreditCard className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-muted-foreground mr-1">Subscription:</span>
                  <span>
                    {subscription ? (
                      <Badge 
                        variant={
                          subscription.plan_id === 'pro' ? 'default' :
                          subscription.plan_id === 'business' ? 'outline' : 'secondary'
                        }
                        className={
                          subscription.plan_id === 'pro' ? 'bg-teal-500' :
                          subscription.plan_id === 'business' ? 'border-purple-500 text-purple-500' : ''
                        }
                      >
                        {subscription.plan_id.toUpperCase()}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">FREE</Badge>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>
        
        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Detailed profile information for this user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">First Name</p>
                    <p>{user.first_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Name</p>
                    <p>{user.last_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Location</p>
                    <p>{user.location || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-medium mb-4">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Job Title</p>
                    <p>{user.job_title || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Industry</p>
                    <p>{user.industry || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Experience Level</p>
                    <p>{user.experience_level || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Job Search Status</p>
                    <p>{user.job_search_status || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              
              {user.professional_summary && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-medium mb-2">Professional Summary</h3>
                    <p className="text-sm">{user.professional_summary}</p>
                  </div>
                </>
              )}
              
              {user.desired_industries && user.desired_industries.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-medium mb-2">Desired Industries</h3>
                    <div className="flex flex-wrap gap-2">
                      {user.desired_industries.map((industry, index) => (
                        <Badge key={index} variant="outline">{industry}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="justify-end">
              <Button variant="outline" asChild>
                <Link href={`/oslo/users/${user.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
            </CardFooter>
          </Card>
          
          {/* Account Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Account settings and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account Status</p>
                  <Badge 
                    variant={
                      user.status === 'active' ? 'default' : 
                      user.status === 'suspended' ? 'outline' : 'destructive'
                    }
                  >
                    {user.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                  <Badge variant={user.is_admin ? 'default' : 'outline'}>
                    {user.is_admin ? 'Administrator' : 'Regular User'}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Joined</p>
                  <p className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                    {formatDate(user.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="flex items-center">
                    <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                    {user.updated_at ? formatDate(user.updated_at) : 'Never updated'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Onboarding Completed</p>
                  <p className="flex items-center">
                    {user.onboarding_completed ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                        Yes
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                        No
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stripe Customer ID</p>
                  <p className="text-sm font-mono">{user.stripe_customer_id || 'Not linked'}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <div>
                {user.status === 'active' ? (
                  <Button variant="destructive" onClick={handleSuspendUser}>
                    <Ban className="h-4 w-4 mr-2" />
                    Suspend User
                  </Button>
                ) : user.status === 'suspended' ? (
                  <Button variant="outline" onClick={handleReactivateUser}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Reactivate User
                  </Button>
                ) : null}
              </div>
              <Button variant="outline" asChild>
                <Link href={`/oslo/users/${user.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Account
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Recent actions and activities by this user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <div 
                      key={`${activity.id}-${index}`} 
                      className="py-3 border-b last:border-0 flex gap-3"
                    >
                      <div className="mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div>
                        <p className="text-sm">{activity.title}</p>
                        <div className="flex flex-col xs:flex-row xs:items-center gap-x-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDateTime(activity.date)}
                          </span>
                          {activity.details && (
                            <>
                              <span className="hidden xs:inline">•</span>
                              <span>{activity.details}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-muted-foreground">
                    No recent activities found for this user
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                User&apos;s subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b">
                    <div>
                      <Badge 
                        variant={
                          subscription.plan_id === 'pro' ? 'default' :
                          subscription.plan_id === 'business' ? 'outline' : 'secondary'
                        }
                        className={`text-base px-3 py-1.5 ${
                          subscription.plan_id === 'pro' ? 'bg-teal-500' :
                          subscription.plan_id === 'business' ? 'border-purple-500 text-purple-500' : ''
                        }`}
                      >
                        {subscription.plan_id.toUpperCase()} PLAN
                      </Badge>
                    </div>
                    <div className="sm:ml-auto">
                      <Badge 
                        variant={subscription.status === 'active' ? 'default' : 'secondary'}
                      >
                        {subscription.status.toUpperCase()}
                      </Badge>
                      {subscription.cancel_at_period_end && (
                        <Badge variant="outline" className="ml-2 border-amber-400 text-amber-600">
                          CANCELS AT PERIOD END
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Current Period</p>
                      <p className="flex items-center">
                        {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Billing Interval</p>
                      <p className="capitalize">{subscription.interval}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Subscription ID</p>
                      <p className="text-sm font-mono">{subscription.stripe_subscription_id}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Customer ID</p>
                      <p className="text-sm font-mono">{subscription.stripe_customer_id}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Subscription Timeline</p>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-teal-500 h-full"
                        style={{
                          width: `${Math.max(0, Math.min(100, calculateProgress(subscription.current_period_start, subscription.current_period_end)))}%`
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{formatDate(subscription.current_period_start)}</span>
                      <span>{formatDate(subscription.current_period_end)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6">
                  <div className="text-center">
                    <CreditCard className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                    <h3 className="text-lg font-medium mb-1">No Active Subscription</h3>
                    <p className="text-muted-foreground mb-4">
                      This user is currently on the free plan
                    </p>
                    <Button variant="outline">
                      Upgrade User
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to calculate progress percentage between two dates
function calculateProgress(startDateStr: string, endDateStr: string): number {
  const startDate = new Date(startDateStr).getTime();
  const endDate = new Date(endDateStr).getTime();
  const currentDate = new Date().getTime();

  // If dates are invalid, return 0
  if (isNaN(startDate) || isNaN(endDate)) return 0;

  // Calculate percentage
  const total = endDate - startDate;
  const elapsed = currentDate - startDate;

  // Ensure the result is between 0 and 100
  return Math.max(0, Math.min(100, (elapsed / total) * 100));
}