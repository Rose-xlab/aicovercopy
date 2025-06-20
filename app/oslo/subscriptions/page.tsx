"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { 
  RefreshCw, 
  Filter, 
  Search, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  MoreVertical, 
  User, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Ban, 
  AlertTriangle,
  DollarSign,
  CreditCard,
  CalendarDays,
  CalendarClock
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import Link from "next/link";

// Define subscription type based on db schema
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

// User type for displaying user info with subscription
interface User {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
}

interface SubscriptionWithUser extends Subscription {
  user: User | null;
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithUser[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<SubscriptionWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [intervalFilter, setIntervalFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    canceled: 0,
    pro: 0,
    business: 0,
    monthly: 0,
    annually: 0,
    quarterlyRevenue: 0,
    annualRevenue: 0,
    cancelNextPeriod: 0
  });
  
  const router = useRouter();
  const supabase = createBrowserClient();
  
  // Fetch subscription data from Supabase
  const fetchSubscriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch subscriptions with user details using a join
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          user:user_id (
            id,
            email,
            full_name,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (subscriptionError) throw subscriptionError;
      
      // Process the joined data, handling potential errors in the user join
      const processedSubscriptions: SubscriptionWithUser[] = (subscriptionData || []).map(sub => ({
        ...sub,
        user: sub.user && typeof sub.user === 'object' ? sub.user as User : null
      }));
      
      setSubscriptions(processedSubscriptions);
      
      // Apply initial filtering
      applyFilters(processedSubscriptions, searchTerm, statusFilter, planFilter, intervalFilter);
      
      // Calculate stats
      calculateStats(processedSubscriptions);
      
    } catch (err: any) {
      console.error('Error fetching subscriptions:', err);
      setError(err.message || 'Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, searchTerm, statusFilter, planFilter, intervalFilter]);
  
  // Fetch subscriptions on component mount
  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);
  
  // Calculate subscription statistics
  const calculateStats = (subs: SubscriptionWithUser[]) => {
    const statsData = {
      total: subs.length,
      active: subs.filter(sub => sub.status === 'active').length,
      canceled: subs.filter(sub => sub.status === 'canceled').length,
      pro: subs.filter(sub => sub.plan_id === 'pro').length,
      business: subs.filter(sub => sub.plan_id === 'business').length,
      monthly: subs.filter(sub => sub.interval === 'monthly').length,
      annually: subs.filter(sub => sub.interval === 'annually').length,
      cancelNextPeriod: subs.filter(sub => sub.cancel_at_period_end).length,
      quarterlyRevenue: 0,
      annualRevenue: 0
    };
    
    // Calculate estimated revenue (simplified)
    const proPriceMonthly = 9.99;
    const businessPriceMonthly = 19.99;
    
    subs.forEach(sub => {
      if (sub.status === 'active') {
        const monthlyPrice = sub.plan_id === 'pro' ? proPriceMonthly : 
                             sub.plan_id === 'business' ? businessPriceMonthly : 0;
                             
        const monthMultiplier = sub.interval === 'monthly' ? 1 : 
                               sub.interval === 'quarterly' ? 3 : 
                               sub.interval === 'annually' ? 12 : 1;
                               
        // Add to quarterly revenue (3 months)
        statsData.quarterlyRevenue += monthlyPrice * Math.min(3, monthMultiplier);
        
        // Add to annual revenue (12 months)
        statsData.annualRevenue += monthlyPrice * Math.min(12, monthMultiplier);
      }
    });
    
    // Round revenue to 2 decimal places
    statsData.quarterlyRevenue = Math.round(statsData.quarterlyRevenue * 100) / 100;
    statsData.annualRevenue = Math.round(statsData.annualRevenue * 100) / 100;
    
    setStats(statsData);
  };
  
  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSubscriptions();
    setIsRefreshing(false);
  };
  
  // Apply filters to subscriptions
  const applyFilters = useCallback(
    (
      subs: SubscriptionWithUser[], 
      search: string, 
      status: string, 
      plan: string,
      interval: string
    ) => {
      let filtered = [...subs];
      
      // Apply search filter
      if (search) {
        const lowerSearch = search.toLowerCase();
        filtered = filtered.filter(sub => 
          (sub.user?.email?.toLowerCase().includes(lowerSearch)) || 
          (sub.user?.full_name?.toLowerCase().includes(lowerSearch)) ||
          (sub.stripe_subscription_id.toLowerCase().includes(lowerSearch))
        );
      }
      
      // Apply status filter
      if (status !== 'all') {
        if (status === 'expiring_soon') {
          // Filter for subscriptions expiring in the next 7 days
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
          
          filtered = filtered.filter(sub => {
            const endDate = new Date(sub.current_period_end);
            return endDate <= sevenDaysFromNow && sub.status === 'active';
          });
        } else {
          filtered = filtered.filter(sub => sub.status === status);
        }
      }
      
      // Apply plan filter
      if (plan !== 'all') {
        filtered = filtered.filter(sub => sub.plan_id === plan);
      }
      
      // Apply interval filter
      if (interval !== 'all') {
        filtered = filtered.filter(sub => sub.interval === interval);
      }
      
      // Update pagination
      const totalFilteredPages = Math.ceil(filtered.length / itemsPerPage);
      setTotalPages(totalFilteredPages || 1);
      
      // Adjust current page if needed
      if (currentPage > totalFilteredPages) {
        setCurrentPage(1);
      }
      
      setFilteredSubscriptions(filtered);
    },
    [currentPage, itemsPerPage]
  );
  
  // Effect to apply filters when filter states change
  useEffect(() => {
    applyFilters(subscriptions, searchTerm, statusFilter, planFilter, intervalFilter);
  }, [searchTerm, statusFilter, planFilter, intervalFilter, subscriptions, applyFilters]);
  
  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubscriptions = filteredSubscriptions.slice(startIndex, endIndex);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // View user details
  const handleViewUser = (userId: string) => {
    router.push(`/oslo/users/${userId}`);
  };
  
  // View subscription details
  const handleViewSubscription = (subscriptionId: string) => {
    router.push(`/oslo/subscriptions/${subscriptionId}`);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Calculate days remaining until subscription ends
  const getDaysRemaining = (endDateStr: string) => {
    const endDate = new Date(endDateStr);
    const currentDate = new Date();
    
    // Set times to midnight to just compare days
    endDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    
    // Calculate difference in days
    const timeDiff = endDate.getTime() - currentDate.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async (subscription: SubscriptionWithUser) => {
    try {
      // Use query parameter approach for the API endpoint
      const response = await fetch(`/api/oslo/subscriptions?id=${subscription.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelAtPeriodEnd: true,
          updateStripe: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      // Refresh data after successful cancellation
      await fetchSubscriptions();
    } catch (err: any) {
      console.error('Error cancelling subscription:', err);
      setError(err.message || 'Failed to cancel subscription');
    }
  };

  // Handle subscription extension
  const handleExtendSubscription = async (subscription: SubscriptionWithUser) => {
    try {
      // Use query parameter approach for the API endpoint
      const response = await fetch(`/api/oslo/subscriptions?id=${subscription.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          extendPeriod: true,
          extendDays: 30, // Extend by 30 days
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extend subscription');
      }

      // Refresh data after successful extension
      await fetchSubscriptions();
    } catch (err: any) {
      console.error('Error extending subscription:', err);
      setError(err.message || 'Failed to extend subscription');
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner className="h-8 w-8 mr-3" />
        <p className="text-lg">Loading subscriptions...</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage and monitor user subscriptions
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline"
          className="h-9 w-full sm:w-auto"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </>
          )}
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Subscription Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active: {stats.active} | Canceled: {stats.canceled}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pro vs Business</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pro} / {stats.business}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pro: {stats.pro} | Business: {stats.business}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(stats.quarterlyRevenue / 3).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Quarterly: ${stats.quarterlyRevenue.toFixed(2)} | Annual: ${stats.annualRevenue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cancellations</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cancelNextPeriod}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.cancelNextPeriod} subscriptions will end at period end
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email or subscription ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
              <SelectItem value="past_due">Past Due</SelectItem>
              <SelectItem value="incomplete">Incomplete</SelectItem>
              <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={planFilter}
            onValueChange={setPlanFilter}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={intervalFilter}
            onValueChange={setIntervalFilter}
          >
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Intervals</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annually">Annually</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Subscription Table */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Subscriptions</CardTitle>
            <CardDescription>
              {filteredSubscriptions.length} {filteredSubscriptions.length === 1 ? 'subscription' : 'subscriptions'} found
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-sm">User</th>
                  <th className="text-left p-3 font-medium text-sm">Plan</th>
                  <th className="text-left p-3 font-medium text-sm">Status</th>
                  <th className="text-left p-3 font-medium text-sm">Period</th>
                  <th className="text-right p-3 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubscriptions.length > 0 ? (
                  paginatedSubscriptions.map((subscription) => (
                    <tr key={subscription.id} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center mr-3 text-muted-foreground">
                            {subscription.user?.first_name?.charAt(0) || subscription.user?.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium">
                              {subscription.user?.full_name || `${subscription.user?.first_name || ''} ${subscription.user?.last_name || ''}`.trim() || 'Unnamed User'}
                            </p>
                            <p className="text-sm text-muted-foreground">{subscription.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
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
                        <div className="text-xs text-muted-foreground mt-1">
                          {subscription.interval.charAt(0).toUpperCase() + subscription.interval.slice(1)}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant={
                            subscription.status === 'active' ? 'default' : 
                            subscription.status === 'canceled' ? 'destructive' : 
                            subscription.status === 'past_due' ? 'outline' : 'secondary'
                          }
                        >
                          {subscription.status.toUpperCase()}
                        </Badge>
                        {subscription.cancel_at_period_end && (
                          <div className="text-xs text-amber-600 mt-1 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Cancels at period end
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="text-sm">
                          <div className="flex items-center text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(subscription.current_period_end)}</span>
                          </div>
                          <div className="flex items-center text-xs mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>
                              {getDaysRemaining(subscription.current_period_end)} days left
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewSubscription(subscription.id)}>
                                <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
                                View Subscription
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewUser(subscription.user_id)}>
                                <User className="h-4 w-4 mr-2 text-amber-500" />
                                View User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleExtendSubscription(subscription)}>
                                <CalendarClock className="h-4 w-4 mr-2 text-indigo-500" />
                                Extend Period
                              </DropdownMenuItem>
                              {!subscription.cancel_at_period_end && (
                                <DropdownMenuItem onClick={() => handleCancelSubscription(subscription)}>
                                  <Ban className="h-4 w-4 mr-2 text-red-500" />
                                  Cancel Subscription
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      No subscriptions found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                // Create a simple pagination with ellipsis
                let pageNum = i + 1;
                
                // If we're near the end and total pages > 5
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = Math.min(totalPages - 4 + i, totalPages) + Math.max(0, currentPage - (totalPages - 2));
                }
                
                // Show ellipsis for large page counts
                if (totalPages > 5 && i === 0 && currentPage > 3) {
                  return (
                    <PaginationItem key="ellipsis-start">
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                // Show ellipsis for large page counts
                if (totalPages > 5 && i === 4 && currentPage < totalPages - 2) {
                  return (
                    <PaginationItem key="ellipsis-end">
                      <PaginationEllipsis />
                    </PaginationItem>
                  );
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => handlePageChange(pageNum)}
                      isActive={currentPage === pageNum}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}