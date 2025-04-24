// Updated EnhancedProfilePage.tsx with integrated billing tab
"use client";

import { useState, useEffect } from "react";
import UserProfileSection from "@/components/UserProfileSection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User,
  Key,
  Settings,
  LogOut,
  CreditCard,
  Receipt,
  Clock,
  AlertTriangle,
  FileDown,
  Shield,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import SubscriptionStatus from '@/components/SubscriptionStatus';
import BillingPortalButton from '@/components/BillingPortalButton';
import { SubscriptionStatus as SubscriptionStatusType } from '@/types/subscription';

export default function EnhancedProfilePage() {
  const { user, updatePassword, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Settings state
  const [preferredLanguage, setPreferredLanguage] = useState("english");
  const [theme, setTheme] = useState("system");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newFeatures, setNewFeatures] = useState(true);
  const [defaultTone, setDefaultTone] = useState("professional");
  const [autoSave, setAutoSave] = useState(true);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  // Billing state
  const [subscription, setSubscription] = useState<SubscriptionStatusType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  
  // Fetch the user's subscription and usage data
  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/subscription');
        
        if (!response.ok) {
          throw new Error('Failed to fetch subscription status');
        }
        
        const data = await response.json();
        setSubscription(data);
        
        // Fetch invoices
        const invoicesResponse = await fetch('/api/user/invoices');
        if (invoicesResponse.ok) {
          const invoicesData = await invoicesResponse.json();
          setInvoices(invoicesData.invoices || []);
        }
        
        // Fetch usage data
        const usageResponse = await fetch('/api/user/usage');
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setUsageStats(usageData);
        }
      } catch (error: any) {
        console.error('Error fetching subscription data:', error);
        setError(error.message || 'Failed to load subscription information');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user && !authLoading) {
      fetchSubscriptionData();
    }
  }, [user, authLoading]);

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const { error } = await updatePassword(newPassword);
      if (error) throw error;
      setPasswordSuccess("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordError(err.message || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSaveSettings = () => {
    setIsSettingsSaving(true);
    setTimeout(() => {
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully."
      });
      setIsSettingsSaving(false);
    }, 800);
  };

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSignOutLoading(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Profile & Settings</h1>
            <p className="text-gray-600">Manage your account information and preferences</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Badge variant="outline" className="pl-2 pr-2 py-1">
              <span className="font-normal text-gray-600 mr-1">Account:</span>
              <span className="text-teal-700">{user?.email}</span>
            </Badge>
            <Button
              className="w-full sm:w-auto text-teal-700 border-teal-600 hover:bg-teal-100"
              onClick={handleSignOut}
              disabled={signOutLoading}
            >
              {signOutLoading ? <LoadingSpinner /> : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="mb-6 flex flex-wrap text-gray-700">
          <TabsTrigger value="personal" className="flex items-center"> <User className="w-4 h-4 mr-2" /> Personal</TabsTrigger>
          <TabsTrigger value="security" className="flex items-center"> <Key className="w-4 h-4 mr-2" /> Security </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center"> <CreditCard className="w-4 h-4 mr-2" /> Billing </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center"> <Settings className="w-4 h-4 mr-2" /> General</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <UserProfileSection />
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800">Security Settings</CardTitle>
              <CardDescription className="text-gray-600">Manage your account security and password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4 text-gray-800">Account Information</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-gray-600">Email Address</Label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-1">
                      <Input value={user?.email || ''} disabled className="bg-muted text-gray-700" />
                      <Button variant="outline" disabled className="text-gray-600 border-gray-300">Change Email</Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email change functionality coming soon</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4 text-gray-800">Update Password</h3>
                {passwordError && (
                  <div className="bg-red-100 text-red-600 p-3 rounded-md mb-4">{passwordError}</div>
                )}
                {passwordSuccess && (
                  <div className="bg-green-100 text-green-700 p-3 rounded-md mb-4">{passwordSuccess}</div>
                )}
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div>
                    <Label htmlFor="current-password" className="text-gray-600">Current Password</Label>
                    <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="new-password" className="text-gray-600">New Password</Label>
                    <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="confirm-password" className="text-gray-600">Confirm New Password</Label>
                    <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" disabled={isUpdatingPassword} className="text-white bg-teal-600 hover:bg-teal-700">
                    {isUpdatingPassword ? <LoadingSpinner /> : "Update Password"}
                  </Button>
                </form>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4 text-red-600">Danger Zone</h3>
                <p className="text-gray-600 mb-4">Permanently delete your account and all of your data</p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Delete Account</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-600 hover:bg-red-700">Delete Account</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab Content */}
        <TabsContent value="billing">
          <div className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {subscription && (
              <SubscriptionStatus 
                subscription={subscription} 
                usageStats={usageStats} 
              />
            )}
            
            {/* Payment Methods */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <CreditCard className="h-5 w-5 mr-2 text-teal-600" />
                  Payment Method
                </CardTitle>
                <CardDescription>
                  Manage your payment method and billing details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscription && subscription.tier !== 'FREE' ? (
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center">
                        <div className="h-8 w-12 bg-gradient-to-br from-gray-700 to-gray-900 rounded-md mr-3 flex items-center justify-center text-white text-xs font-bold">
                          CARD
                        </div>
                        <div>
                          <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                          <p className="text-xs text-gray-500">Expires 12/2025</p>
                        </div>
                      </div>
                      
                      <BillingPortalButton 
                        label="Update Payment Method" 
                        returnUrl={`${window.location.origin}/dashboard/profile`}
                        size="sm"
                        variant="outline"
                      />
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Your payment method will be charged automatically at the beginning of each billing period.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      You are currently on the Free plan. Upgrade to add a payment method.
                    </p>
                    <Button asChild className="bg-teal-600 hover:bg-teal-700">
                      <Link href="/pricing">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Upgrade Now
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Billing Actions */}
            {subscription && subscription.tier !== 'FREE' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Billing Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <BillingPortalButton 
                      label="Manage Subscription"
                      showIcon={true}
                      className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                      returnUrl={`${window.location.origin}/dashboard/profile`}
                    />
                    
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href="/pricing">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Change Plan
                      </Link>
                    </Button>
                  </div>
                  
                  {subscription.cancelAtPeriodEnd && (
                    <div className="flex items-start p-3 bg-green-50 border border-green-200 rounded-md">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Your subscription is scheduled to cancel</p>
                        <p className="text-xs text-muted-foreground">
                          You will lose access to premium features on {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'the end of your billing period'}. 
                          You can reactivate your subscription from the Stripe Customer Portal.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Security & Privacy */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-teal-600" />
                  Security & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-3 text-muted-foreground">
                  <p>
                    We use Stripe for secure payment processing. Your payment information is never stored on our servers.
                  </p>
                  <p>
                    All transactions are encrypted and processed securely according to PCI DSS standards.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Receipt className="h-5 w-5 mr-2 text-teal-600" />
                  Billing History
                </CardTitle>
                <CardDescription>
                  View and download your past invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length > 0 ? (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-2 text-sm font-medium">Date</th>
                            <th className="text-left py-3 px-2 text-sm font-medium">Description</th>
                            <th className="text-right py-3 px-2 text-sm font-medium">Amount</th>
                            <th className="text-right py-3 px-2 text-sm font-medium">Status</th>
                            <th className="text-right py-3 px-2 text-sm font-medium">Invoice</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b">
                              <td className="py-3 px-2 text-sm">
                                {formatDate(invoice.created)}
                              </td>
                              <td className="py-3 px-2 text-sm">
                                {invoice.description || `${invoice.plan} - ${invoice.interval}`}
                              </td>
                              <td className="py-3 px-2 text-sm text-right">
                                ${(invoice.amount / 100).toFixed(2)}
                              </td>
                              <td className="py-3 px-2 text-sm text-right">
                                <Badge variant={invoice.status === 'paid' ? 'success' : 'outline'}>
                                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                </Badge>
                              </td>
                              <td className="py-3 px-2 text-sm text-right">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                                  <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
                                    <FileDown className="h-4 w-4" />
                                    <span className="sr-only">Download</span>
                                  </a>
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">No invoices yet</p>
                    {subscription && subscription.tier === 'FREE' && (
                      <Button asChild className="mt-2 bg-teal-600 hover:bg-teal-700">
                        <Link href="/pricing">
                          <Sparkles className="mr-2 h-4 w-4" />
                          Upgrade to Pro
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800">General Settings</CardTitle>
              <CardDescription className="text-gray-600">Manage all your application preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-gray-600">Language</Label>
                  <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                    <SelectTrigger className="w-full max-w-xs text-gray-700 border-gray-300">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-gray-600">Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger className="w-full max-w-xs text-gray-700 border-gray-300">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-600">Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications about your account and cover letters</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-600">Product Updates</Label>
                    <p className="text-sm text-gray-500">Get notified about new features and improvements</p>
                  </div>
                  <Switch checked={newFeatures} onCheckedChange={setNewFeatures} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-gray-600">Analytics</Label>
                    <p className="text-sm text-gray-500">Allow usage data collection to improve our service</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={isSettingsSaving} className="text-white bg-teal-600 hover:bg-teal-700">
                {isSettingsSaving ? <LoadingSpinner /> : "Save Settings"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}