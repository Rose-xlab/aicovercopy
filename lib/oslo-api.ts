"use client";

import { createBrowserClient } from './supabase';
import { 
  AdminUser, ManagedUser, UserResponse, UsersResponse, 
  SubscriptionResponse, SubscriptionsResponse, DashboardStats,
  UserActivity, ActivityEvent
} from '@/types/admin';

/**
 * Oslo Admin API client for making requests to the admin API endpoints
 */
class OsloAdminApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/oslo';
  }

  /**
   * Generic method to make API requests
   */
  private async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API request failed');
      }

      return await response.json() as T;
    } catch (error: any) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // -------------------- User Management --------------------

  /**
   * Get users with filtering, search, and pagination
   */
  async getUsers(
    page: number = 1, 
    limit: number = 10,
    search?: string,
    status?: string,
    subscription?: string
  ): Promise<UsersResponse> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) queryParams.append('search', search);
    if (status) queryParams.append('status', status);
    if (subscription) queryParams.append('subscription', subscription);

    return this.request<UsersResponse>(`/users?${queryParams.toString()}`);
  }

  /**
   * Get a single user by ID
   */
  async getUser(userId: string): Promise<UserResponse> {
    return this.request<UserResponse>(`/users/${userId}`);
  }

  /**
   * Create a new user
   */
  async createUser(userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: 'user' | 'admin';
  }): Promise<{ user: ManagedUser }> {
    return this.request<{ user: ManagedUser }>('/users', 'POST', userData);
  }

  /**
   * Update a user
   */
  async updateUser(
    userId: string, 
    updates: Partial<ManagedUser>
  ): Promise<{ user: ManagedUser }> {
    return this.request<{ user: ManagedUser }>(`/users/${userId}`, 'PATCH', updates);
  }

  /**
   * Delete a user
   */
  async deleteUser(userId: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/users/${userId}`, 'DELETE');
  }

  /**
   * Get user activity by ID
   */
  async getUserActivity(userId: string): Promise<{ activities: UserActivity[] }> {
    return this.request<{ activities: UserActivity[] }>(`/users/${userId}/activity`);
  }

  // -------------------- Subscription Management --------------------

  /**
   * Get subscriptions with filtering, search, and pagination
   */
  async getSubscriptions(
    page: number = 1, 
    limit: number = 10,
    search?: string,
    status?: string,
    plan?: string,
    interval?: string
  ): Promise<SubscriptionsResponse> {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (search) queryParams.append('search', search);
    if (status) queryParams.append('status', status);
    if (plan) queryParams.append('plan', plan);
    if (interval) queryParams.append('interval', interval);

    return this.request<SubscriptionsResponse>(`/subscriptions?${queryParams.toString()}`);
  }

  /**
   * Get a single subscription by ID
   */
  async getSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
    return this.request<SubscriptionResponse>(`/subscriptions/${subscriptionId}`);
  }

  /**
   * Update a subscription
   */
  async updateSubscription(
    subscriptionId: string, 
    updates: {
      status?: string;
      cancelAtPeriodEnd?: boolean;
      updateStripe?: boolean;
      extendPeriod?: boolean;
      extendDays?: number;
    }
  ): Promise<{ subscription: any }> {
    return this.request<{ subscription: any }>(`/subscriptions/${subscriptionId}`, 'PATCH', updates);
  }

  // -------------------- Dashboard & Analytics --------------------

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<{ stats: DashboardStats }> {
    return this.request<{ stats: DashboardStats }>('/dashboard/stats');
  }

  /**
   * Get real-time activity
   */
  async getRealtimeActivity(limit: number = 10): Promise<{ activities: ActivityEvent[] }> {
    return this.request<{ activities: ActivityEvent[] }>(`/dashboard/activity?limit=${limit}`);
  }

  // -------------------- Authentication --------------------

  /**
   * Admin login
   */
  async login(email: string, password: string): Promise<{ 
    user: AdminUser; 
    session: any;
  }> {
    return this.request<{ user: AdminUser; session: any }>('/auth/login', 'POST', {
      email,
      password
    });
  }

  /**
   * Admin logout
   */
  async logout(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/auth/logout', 'POST');
  }

  // -------------------- Settings Management --------------------

  /**
   * Get admin settings
   */
  async getSettings(category?: string): Promise<{ settings: any }> {
    const queryParams = category ? `?category=${category}` : '';
    return this.request<{ settings: any }>(`/settings${queryParams}`);
  }

  /**
   * Update admin settings
   */
  async updateSettings(
    category: string,
    key: string,
    value: any
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>('/settings', 'POST', {
      category,
      key,
      value
    });
  }
}

// Create and export a singleton instance
const osloApi = new OsloAdminApiClient();
export default osloApi;