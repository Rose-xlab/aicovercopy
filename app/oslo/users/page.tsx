"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  RefreshCw, 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical,
  User,
  CreditCard,
  CalendarDays,
  Check,
  Ban,
  Edit,
  AlertTriangle,
  Mail,
  Eye
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { UserTable } from "@/components/oslo/UserTable";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Define user type based on the db schema - fixed to match database
interface User {
  id: string;
  email: string | null;
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
  status: 'active' | 'suspended' | 'deleted' | null;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  interval: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [userSubscriptions, setUserSubscriptions] = useState<Record<string, Subscription>>({});
  
  const router = useRouter();
  const supabase = createBrowserClient();
  
  // Apply filters to users
  const applyFilters = useCallback(() => {
    let filtered = [...users];
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        (user.email?.toLowerCase().includes(lowerSearch)) || 
        (user.full_name?.toLowerCase().includes(lowerSearch)) ||
        (`${user.first_name || ''} ${user.last_name || ''}`.toLowerCase().includes(lowerSearch))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }
    
    // Apply subscription filter
    if (subscriptionFilter !== 'all') {
      if (subscriptionFilter === 'free') {
        filtered = filtered.filter(user => !userSubscriptions[user.id]);
      } else {
        filtered = filtered.filter(user => 
          userSubscriptions[user.id] && userSubscriptions[user.id].plan_id === subscriptionFilter
        );
      }
    }
    
    // Update pagination
    const totalFilteredPages = Math.ceil(filtered.length / itemsPerPage);
    setTotalPages(totalFilteredPages || 1);
    
    // Adjust current page if needed
    if (currentPage > totalFilteredPages) {
      setCurrentPage(1);
    }
    
    setFilteredUsers(filtered);
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, subscriptionFilter, userSubscriptions, users]);
  
  // Fetch user data from Supabase
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch users
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (userError) throw userError;
      
      // Fetch subscriptions to map to users
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active');
      
      if (subscriptionError) throw subscriptionError;
      
      // Create a mapping of user_id to subscription
      const subscriptionMap: Record<string, Subscription> = {};
      subscriptionData?.forEach(subscription => {
        subscriptionMap[subscription.user_id] = subscription;
      });
      
      setUserSubscriptions(subscriptionMap);
      
      // Ensure all required User fields are present
      const processedUsers: User[] = (userData || []).map(user => ({
        ...user,
        id: user.id,
        email: user.email,
        full_name: user.full_name || null,
        first_name: user.first_name || null,
        last_name: user.last_name || null,
        job_title: user.job_title || null,
        location: user.location || null,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.updated_at || null,
        onboarding_completed: user.onboarding_completed || null,
        stripe_customer_id: user.stripe_customer_id || null,
        is_admin: user.is_admin || null,
        status: (user.status as 'active' | 'suspended' | 'deleted') || 'active'
      }));
      
      setUsers(processedUsers);
      
      // Don't apply filters here - we'll do it in the useEffect
      
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // Effect to apply filters when filter states change
  useEffect(() => {
    if (!isLoading) {
      applyFilters();
    }
  }, [applyFilters, isLoading]);
  
  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchUsers();
    setIsRefreshing(false);
  };
  
  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  // Handle user view
  const handleViewUser = (userId: string) => {
    router.push(`/oslo/users/${userId}`);
  };
  
  // Handle user edit
  const handleEditUser = (userId: string) => {
    router.push(`/oslo/users/${userId}/edit`);
  };
  
  // Handle user suspension
  const handleSuspendUser = async (userId: string) => {
    try {
      // UPDATED: Use the new query parameter approach
      const response = await fetch(`/api/oslo/users?id=${userId}`, {
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
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: 'suspended' } : user
        )
      );
      
    } catch (err: any) {
      console.error('Error suspending user:', err);
      setError(err.message || 'Failed to suspend user');
    }
  };
  
  // Handle user reactivation
  const handleReactivateUser = async (userId: string) => {
    try {
      // UPDATED: Use the new query parameter approach
      const response = await fetch(`/api/oslo/users?id=${userId}`, {
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
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: 'active' } : user
        )
      );
      
    } catch (err: any) {
      console.error('Error reactivating user:', err);
      setError(err.message || 'Failed to reactivate user');
    }
  };
  
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner className="h-8 w-8 mr-3" />
        <p className="text-lg">Loading users...</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            View and manage all users of your application
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            variant="outline"
            className="h-9"
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
          
          <Button className="h-9">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        
        <div className="flex gap-2">
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
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={subscriptionFilter}
            onValueChange={setSubscriptionFilter}
          >
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue placeholder="Subscription" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
              <SelectItem value="business">Business</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* User Table */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Users</CardTitle>
            <CardDescription>
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'} found
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-sm">User</th>
                  <th className="text-left p-3 font-medium text-sm">Status</th>
                  <th className="text-left p-3 font-medium text-sm">Subscription</th>
                  <th className="text-left p-3 font-medium text-sm">Joined</th>
                  <th className="text-right p-3 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center mr-3 text-muted-foreground">
                            {user.first_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User'}
                            </p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge 
                          variant={
                            user.status === 'active' ? 'default' : 
                            user.status === 'suspended' ? 'outline' : 'destructive'
                          }
                        >
                          {user.status || 'unknown'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {userSubscriptions[user.id] ? (
                          <Badge 
                            variant={
                              userSubscriptions[user.id].plan_id === 'pro' ? 'default' :
                              userSubscriptions[user.id].plan_id === 'business' ? 'outline' : 'secondary'
                            }
                            className={
                              userSubscriptions[user.id].plan_id === 'pro' ? 'bg-teal-500' :
                              userSubscriptions[user.id].plan_id === 'business' ? 'border-purple-500 text-purple-500' : ''
                            }
                          >
                            {userSubscriptions[user.id].plan_id.toUpperCase()}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">FREE</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <CalendarDays className="h-3 w-3 mr-1" />
                          {new Date(user.created_at).toLocaleDateString()}
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
                              <DropdownMenuItem onClick={() => handleViewUser(user.id)}>
                                <Eye className="h-4 w-4 mr-2 text-blue-500" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditUser(user.id)}>
                                <Edit className="h-4 w-4 mr-2 text-amber-500" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {user.status === 'active' ? (
                                <DropdownMenuItem onClick={() => handleSuspendUser(user.id)}>
                                  <Ban className="h-4 w-4 mr-2 text-red-500" />
                                  Suspend User
                                </DropdownMenuItem>
                              ) : user.status === 'suspended' ? (
                                <DropdownMenuItem onClick={() => handleReactivateUser(user.id)}>
                                  <Check className="h-4 w-4 mr-2 text-green-500" />
                                  Reactivate User
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem>
                                <Mail className="h-4 w-4 mr-2 text-indigo-500" />
                                Send Email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      No users found matching your filters
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