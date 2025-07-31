"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  RefreshCw, 
  Save,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Settings,
  FileText,
  Mail,
  Users,
  Shield,
  Activity,
  BellRing
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/components/ui/use-toast";

interface SettingItem {
  key: string;
  value: any;
  description: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

interface SettingsMap {
  [category: string]: {
    [key: string]: SettingItem;
  };
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState<SettingsMap>({});
  const [formState, setFormState] = useState<SettingsMap>({});
  
  const supabase = createBrowserClient();
  const { toast } = useToast();
  
  // Fetch settings from the API
  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: settingsData, error: settingsError } = await supabase
        .from('admin_settings')
        .select('*')
        .order('category', { ascending: true })
        .order('key', { ascending: true });
      
      if (settingsError) throw settingsError;
      
      // Transform into the expected format
      const transformedSettings: SettingsMap = {};
      
      settingsData?.forEach(setting => {
        if (!transformedSettings[setting.category]) {
          transformedSettings[setting.category] = {};
        }
        
        transformedSettings[setting.category][setting.key] = {
          value: setting.value,
          description: setting.description,
          updatedAt: setting.updated_at,
          updatedBy: setting.updated_by,
          key: setting.key
        };
      });
      
      // Handle missing categories with default values
      const requiredCategories = ["general", "billing", "email", "security", "notifications"];
      requiredCategories.forEach(category => {
        if (!transformedSettings[category]) {
          transformedSettings[category] = {};
        }
      });
      
      // Set default values if not present
      if (!transformedSettings.general.app_name) {
        transformedSettings.general.app_name = {
          value: "JobCraft",
          description: "Application name displayed across the platform",
          updatedAt: new Date().toISOString(),
          updatedBy: null,
          key: "app_name"
        };
      }
      
      if (!transformedSettings.general.support_email) {
        transformedSettings.general.support_email = {
          value: "support@jobcraft.com",
          description: "Support email address for user inquiries",
          updatedAt: new Date().toISOString(),
          updatedBy: null,
          key: "support_email"
        };
      }

      if (!transformedSettings.billing.trial_days) {
        transformedSettings.billing.trial_days = {
          value: 14,
          description: "Number of days for free trial",
          updatedAt: new Date().toISOString(),
          updatedBy: null,
          key: "trial_days"
        };
      }

      if (!transformedSettings.security.require_email_verification) {
        transformedSettings.security.require_email_verification = {
          value: true,
          description: "Require email verification for new accounts",
          updatedAt: new Date().toISOString(),
          updatedBy: null,
          key: "require_email_verification"
        };
      }
      
      setSettings(transformedSettings);
      setFormState(JSON.parse(JSON.stringify(transformedSettings)));
      
    } catch (err: any) {
      console.error('Error fetching settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);
  
  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
  
  // Handle input change
  const handleInputChange = (category: string, key: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: {
          ...prev[category][key],
          value
        }
      }
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (category: string) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const categorySettings = formState[category];
      const originalSettings = settings[category];
      
      // Find changed settings
      const changedSettings = Object.keys(categorySettings).filter(key => {
        return JSON.stringify(categorySettings[key].value) !== JSON.stringify(originalSettings[key].value);
      });
      
      if (changedSettings.length === 0) {
        setSuccess('No changes to save');
        toast({
          title: "No changes",
          description: "No changes were detected in the settings",
        });
        setIsSaving(false);
        return;
      }
      
      // Get the current user's session once
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id ?? null;

      // Save each changed setting
      for (const key of changedSettings) {
        const { error } = await supabase
          .from('admin_settings')
          .upsert({
            category,
            key,
            value: categorySettings[key].value,
            description: categorySettings[key].description,
            updated_at: new Date().toISOString(),
            updated_by: userId
          }, { onConflict: 'category,key' });
        
        if (error) throw error;
      }
      
      // Update the settings state
      setSettings(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          ...changedSettings.reduce((acc, key) => ({
            ...acc,
            [key]: {
              ...formState[category][key],
              updatedAt: new Date().toISOString()
            }
          }), {})
        }
      }));
      
      setSuccess(`Successfully saved ${changedSettings.length} setting(s) in ${category} category`);
      toast({
        title: "Settings saved",
        description: `Successfully saved ${changedSettings.length} setting(s)`,
        variant: "default",
      });
      
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
      toast({
        title: "Error saving settings",
        description: err.message || 'Failed to save settings',
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setSuccess(null);
    await fetchSettings();
    setIsRefreshing(false);
    toast({
      title: "Settings refreshed",
      description: "Settings have been refreshed from the database",
    });
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Reset changes for a category
  const handleReset = (category: string) => {
    setFormState(prev => ({
      ...prev,
      [category]: JSON.parse(JSON.stringify(settings[category]))
    }));
    
    toast({
      title: "Changes reset",
      description: `Changes for ${category} category have been reset`,
    });
  };
  
  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner className="h-8 w-8 mr-3" />
        <p className="text-lg">Loading settings...</p>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure application-wide settings and preferences
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline"
          className="w-full sm:w-auto"
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
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <BellRing className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general application settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="app_name">Application Name</Label>
                  <Input 
                    id="app_name" 
                    value={formState.general?.app_name?.value || ''}
                    onChange={(e) => handleInputChange('general', 'app_name', e.target.value)}
                    placeholder="Application Name"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.general?.app_name?.description || 'Application name displayed across the platform'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input 
                    id="support_email" 
                    value={formState.general?.support_email?.value || ''}
                    onChange={(e) => handleInputChange('general', 'support_email', e.target.value)}
                    placeholder="support@example.com"
                    type="email"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.general?.support_email?.description || 'Support email address for user inquiries'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company_address">Company Address</Label>
                  <Textarea 
                    id="company_address" 
                    value={formState.general?.company_address?.value || ''}
                    onChange={(e) => handleInputChange('general', 'company_address', e.target.value)}
                    placeholder="123 Business St, City, State, Zip"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.general?.company_address?.description || 'Company address for legal documents'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="enable_maintenance_mode" className="block mb-2">Maintenance Mode</Label>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="enable_maintenance_mode" 
                      checked={!!formState.general?.enable_maintenance_mode?.value}
                      onCheckedChange={(checked) => handleInputChange('general', 'enable_maintenance_mode', checked)}
                    />
                    <Label htmlFor="enable_maintenance_mode" className="font-normal">
                      {formState.general?.enable_maintenance_mode?.value ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formState.general?.enable_maintenance_mode?.description || 'Enable maintenance mode to take the site offline for updates'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                  <Input 
                    id="google_analytics_id" 
                    value={formState.general?.google_analytics_id?.value || ''}
                    onChange={(e) => handleInputChange('general', 'google_analytics_id', e.target.value)}
                    placeholder="G-XXXXXXXXXX"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.general?.google_analytics_id?.description || 'Google Analytics measurement ID for tracking'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="default_language">Default Language</Label>
                  <Input 
                    id="default_language" 
                    value={formState.general?.default_language?.value || 'en'}
                    onChange={(e) => handleInputChange('general', 'default_language', e.target.value)}
                    placeholder="en"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.general?.default_language?.description || 'Default language for the application (e.g., en, fr, es)'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => handleReset('general')}
              >
                Reset Changes
              </Button>
              <Button 
                onClick={() => handleSubmit('general')}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Billing Settings */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing Settings</CardTitle>
              <CardDescription>
                Configure billing and subscription settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="trial_days">Trial Period (Days)</Label>
                  <Input 
                    id="trial_days" 
                    value={formState.billing?.trial_days?.value || 14}
                    onChange={(e) => handleInputChange('billing', 'trial_days', parseInt(e.target.value) || 0)}
                    type="number"
                    min="0"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.billing?.trial_days?.description || 'Number of days for free trial period'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pro_monthly_price">Pro Plan Monthly Price ($)</Label>
                  <Input 
                    id="pro_monthly_price" 
                    value={formState.billing?.pro_monthly_price?.value || 9.99}
                    onChange={(e) => handleInputChange('billing', 'pro_monthly_price', parseFloat(e.target.value) || 0)}
                    type="number"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.billing?.pro_monthly_price?.description || 'Monthly price for Pro subscription plan'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pro_annual_price">Pro Plan Annual Price ($)</Label>
                  <Input 
                    id="pro_annual_price" 
                    value={formState.billing?.pro_annual_price?.value || 99.99}
                    onChange={(e) => handleInputChange('billing', 'pro_annual_price', parseFloat(e.target.value) || 0)}
                    type="number"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.billing?.pro_annual_price?.description || 'Annual price for Pro subscription plan'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business_monthly_price">Business Plan Monthly Price ($)</Label>
                  <Input 
                    id="business_monthly_price" 
                    value={formState.billing?.business_monthly_price?.value || 19.99}
                    onChange={(e) => handleInputChange('billing', 'business_monthly_price', parseFloat(e.target.value) || 0)}
                    type="number"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.billing?.business_monthly_price?.description || 'Monthly price for Business subscription plan'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="business_annual_price">Business Plan Annual Price ($)</Label>
                  <Input 
                    id="business_annual_price" 
                    value={formState.billing?.business_annual_price?.value || 199.99}
                    onChange={(e) => handleInputChange('billing', 'business_annual_price', parseFloat(e.target.value) || 0)}
                    type="number"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.billing?.business_annual_price?.description || 'Annual price for Business subscription plan'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="enable_coupons" className="block mb-2">Enable Coupons</Label>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="enable_coupons" 
                      checked={!!formState.billing?.enable_coupons?.value}
                      onCheckedChange={(checked) => handleInputChange('billing', 'enable_coupons', checked)}
                    />
                    <Label htmlFor="enable_coupons" className="font-normal">
                      {formState.billing?.enable_coupons?.value ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formState.billing?.enable_coupons?.description || 'Enable coupon codes for discounts'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => handleReset('billing')}
              >
                Reset Changes
              </Button>
              <Button 
                onClick={() => handleSubmit('billing')}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Email Settings */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure email templates and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email_from_address">From Email Address</Label>
                  <Input 
                    id="email_from_address" 
                    value={formState.email?.email_from_address?.value || 'no-reply@jobcraft.com'}
                    onChange={(e) => handleInputChange('email', 'email_from_address', e.target.value)}
                    placeholder="no-reply@example.com"
                    type="email"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.email?.email_from_address?.description || 'Default sender email address for system emails'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email_from_name">From Name</Label>
                  <Input 
                    id="email_from_name" 
                    value={formState.email?.email_from_name?.value || 'JobCraft Team'}
                    onChange={(e) => handleInputChange('email', 'email_from_name', e.target.value)}
                    placeholder="Company Name"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.email?.email_from_name?.description || 'Sender name displayed in emails'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Host</Label>
                  <Input 
                    id="smtp_host" 
                    value={formState.email?.smtp_host?.value || ''}
                    onChange={(e) => handleInputChange('email', 'smtp_host', e.target.value)}
                    placeholder="smtp.example.com"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.email?.smtp_host?.description || 'SMTP server hostname for sending emails'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">SMTP Port</Label>
                  <Input 
                    id="smtp_port" 
                    value={formState.email?.smtp_port?.value || 587}
                    onChange={(e) => handleInputChange('email', 'smtp_port', parseInt(e.target.value) || 587)}
                    placeholder="587"
                    type="number"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.email?.smtp_port?.description || 'SMTP server port (usually 587 for TLS or 465 for SSL)'}
                  </p>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email_footer_text">Email Footer Text</Label>
                  <Textarea 
                    id="email_footer_text" 
                    value={formState.email?.email_footer_text?.value || ''}
                    onChange={(e) => handleInputChange('email', 'email_footer_text', e.target.value)}
                    placeholder="© 2025 JobCraft. All rights reserved."
                    className="min-h-24"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.email?.email_footer_text?.description || 'Text to appear in the footer of all system emails'}
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="enable_email_logging" className="block mb-2">Email Logging</Label>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="enable_email_logging" 
                      checked={!!formState.email?.enable_email_logging?.value}
                      onCheckedChange={(checked) => handleInputChange('email', 'enable_email_logging', checked)}
                    />
                    <Label htmlFor="enable_email_logging" className="font-normal">
                      {formState.email?.enable_email_logging?.value ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formState.email?.enable_email_logging?.description || 'Enable logging of all sent emails for debugging purposes'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => handleReset('email')}
              >
                Reset Changes
              </Button>
              <Button 
                onClick={() => handleSubmit('email')}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="require_email_verification" className="block mb-2">Email Verification</Label>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="require_email_verification" 
                      checked={!!formState.security?.require_email_verification?.value}
                      onCheckedChange={(checked) => handleInputChange('security', 'require_email_verification', checked)}
                    />
                    <Label htmlFor="require_email_verification" className="font-normal">
                      {formState.security?.require_email_verification?.value ? 'Required' : 'Optional'}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formState.security?.require_email_verification?.description || 'Require email verification for new accounts'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="enable_2fa" className="block mb-2">Two-Factor Authentication</Label>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="enable_2fa" 
                      checked={!!formState.security?.enable_2fa?.value}
                      onCheckedChange={(checked) => handleInputChange('security', 'enable_2fa', checked)}
                    />
                    <Label htmlFor="enable_2fa" className="font-normal">
                      {formState.security?.enable_2fa?.value ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formState.security?.enable_2fa?.description || 'Enable two-factor authentication for user accounts'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password_min_length">Minimum Password Length</Label>
                  <Input 
                    id="password_min_length" 
                    value={formState.security?.password_min_length?.value || 8}
                    onChange={(e) => handleInputChange('security', 'password_min_length', parseInt(e.target.value) || 8)}
                    type="number"
                    min="6"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.security?.password_min_length?.description || 'Minimum required length for user passwords'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Session Timeout (hours)</Label>
                  <Input 
                    id="session_timeout" 
                    value={formState.security?.session_timeout?.value || 24}
                    onChange={(e) => handleInputChange('security', 'session_timeout', parseInt(e.target.value) || 24)}
                    type="number"
                    min="1"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.security?.session_timeout?.description || 'User session timeout in hours (0 for no timeout)'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
                  <Input 
                    id="max_login_attempts" 
                    value={formState.security?.max_login_attempts?.value || 5}
                    onChange={(e) => handleInputChange('security', 'max_login_attempts', parseInt(e.target.value) || 5)}
                    type="number"
                    min="1"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.security?.max_login_attempts?.description || 'Maximum number of failed login attempts before temporary lockout'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password_require_special" className="block mb-2">Require Special Characters</Label>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="password_require_special" 
                      checked={!!formState.security?.password_require_special?.value}
                      onCheckedChange={(checked) => handleInputChange('security', 'password_require_special', checked)}
                    />
                    <Label htmlFor="password_require_special" className="font-normal">
                      {formState.security?.password_require_special?.value ? 'Required' : 'Optional'}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formState.security?.password_require_special?.description || 'Require special characters in passwords'}
                  </p>
                </div>
              </div>

              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">API Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="enable_api_access" className="block mb-2">API Access</Label>
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="enable_api_access" 
                        checked={!!formState.security?.enable_api_access?.value}
                        onCheckedChange={(checked) => handleInputChange('security', 'enable_api_access', checked)}
                      />
                      <Label htmlFor="enable_api_access" className="font-normal">
                        {formState.security?.enable_api_access?.value ? 'Enabled' : 'Disabled'}
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formState.security?.enable_api_access?.description || 'Enable access to the application API'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="api_rate_limit">API Rate Limit (requests per hour)</Label>
                    <Input 
                      id="api_rate_limit" 
                      value={formState.security?.api_rate_limit?.value || 1000}
                      onChange={(e) => handleInputChange('security', 'api_rate_limit', parseInt(e.target.value) || 1000)}
                      type="number"
                      min="1"
                    />
                    <p className="text-sm text-muted-foreground">
                      {formState.security?.api_rate_limit?.description || 'Maximum number of API requests per hour per user'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => handleReset('security')}
              >
                Reset Changes
              </Button>
              <Button 
                onClick={() => handleSubmit('security')}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure system-wide notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="enable_email_notifications" className="block mb-2">Email Notifications</Label>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="enable_email_notifications" 
                      checked={!!formState.notifications?.enable_email_notifications?.value}
                      onCheckedChange={(checked) => handleInputChange('notifications', 'enable_email_notifications', checked)}
                    />
                    <Label htmlFor="enable_email_notifications" className="font-normal">
                      {formState.notifications?.enable_email_notifications?.value ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formState.notifications?.enable_email_notifications?.description || 'Enable system-wide email notifications'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="enable_browser_notifications" className="block mb-2">Browser Notifications</Label>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="enable_browser_notifications" 
                      checked={!!formState.notifications?.enable_browser_notifications?.value}
                      onCheckedChange={(checked) => handleInputChange('notifications', 'enable_browser_notifications', checked)}
                    />
                    <Label htmlFor="enable_browser_notifications" className="font-normal">
                      {formState.notifications?.enable_browser_notifications?.value ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formState.notifications?.enable_browser_notifications?.description || 'Enable browser push notifications'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notify_on_new_user" className="block mb-2">New User Notifications</Label>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="notify_on_new_user" 
                      checked={!!formState.notifications?.notify_on_new_user?.value}
                      onCheckedChange={(checked) => handleInputChange('notifications', 'notify_on_new_user', checked)}
                    />
                    <Label htmlFor="notify_on_new_user" className="font-normal">
                      {formState.notifications?.notify_on_new_user?.value ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formState.notifications?.notify_on_new_user?.description || 'Send notifications to admins when new users register'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notify_on_subscription" className="block mb-2">Subscription Notifications</Label>
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="notify_on_subscription" 
                      checked={!!formState.notifications?.notify_on_subscription?.value}
                      onCheckedChange={(checked) => handleInputChange('notifications', 'notify_on_subscription', checked)}
                    />
                    <Label htmlFor="notify_on_subscription" className="font-normal">
                      {formState.notifications?.notify_on_subscription?.value ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formState.notifications?.notify_on_subscription?.description || 'Send notifications to admins on subscription changes'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="admin_notification_emails">Admin Notification Emails</Label>
                  <Textarea 
                    id="admin_notification_emails" 
                    value={formState.notifications?.admin_notification_emails?.value || ''}
                    onChange={(e) => handleInputChange('notifications', 'admin_notification_emails', e.target.value)}
                    placeholder="admin@example.com, manager@example.com"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.notifications?.admin_notification_emails?.description || 'Comma-separated list of email addresses to receive admin notifications'}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="digest_frequency">Digest Email Frequency</Label>
                  <Input 
                    id="digest_frequency" 
                    value={formState.notifications?.digest_frequency?.value || 'daily'}
                    onChange={(e) => handleInputChange('notifications', 'digest_frequency', e.target.value)}
                    placeholder="daily"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formState.notifications?.digest_frequency?.description || 'Frequency of digest emails (daily, weekly, monthly)'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => handleReset('notifications')}
              >
                Reset Changes
              </Button>
              <Button 
                onClick={() => handleSubmit('notifications')}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}