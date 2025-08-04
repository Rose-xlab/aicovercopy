"use client";

import { useState } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
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
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function EnhancedProfilePage() {
  const { user, updatePassword, signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [preferredLanguage, setPreferredLanguage] = useState("norsk");
  const [theme, setTheme] = useState("system");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newFeatures, setNewFeatures] = useState(true);
  const [defaultTone, setDefaultTone] = useState("professional");
  const [autoSave, setAutoSave] = useState(true);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
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
          <TabsTrigger value="general" className="flex items-center"> <Settings className="w-4 h-4 mr-2" /> General</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <UserProfileSection />
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800">Security</CardTitle>
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

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-800">General</CardTitle>
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
