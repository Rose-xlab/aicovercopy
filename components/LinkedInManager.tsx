"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Linkedin,
  CheckCircle2,
  RefreshCcw,
  Link as LinkIcon,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/hooks/useAuth";
import { createBrowserClient } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  syncLinkedInProfile, 
  fetchLinkedInProfile, 
  extractLinkedInUsername 
} from "@/services/LinkedinProfileService";
import { EnhancedLinkedInProfile } from "@/types/linkedintype";

export interface LinkedInProfile {
  id: string;
  user_id: string;
  profile_url: string;
  status: "connected" | "disconnected";
  last_synced: string;
  headline?: string;
  name?: string;
  company?: string;
  position?: string;
  location?: string;
  summary?: string;
  experience_json?: any[];
  education_json?: any[];
  skills_json?: any[];
}

export function LinkedInManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createBrowserClient();

  // States
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [linkedInStatus, setLinkedInStatus] = useState<
    "connected" | "disconnected"
  >("disconnected");
  const [profileData, setProfileData] =
    useState<EnhancedLinkedInProfile | null>(null);
  const [validationError, setValidationError] = useState("");

  // Load LinkedIn profile on mount
  useEffect(() => {
    if (user) {
      fetchLinkedInProfile();
    } else {
      // Fallback to localStorage for demo mode
      const savedProfile = localStorage.getItem("linkedInProfile");
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          setProfileData(profile);
          setLinkedInUrl(profile.profile_url || "");
          setLinkedInStatus(profile.status || "disconnected");
        } catch (e) {
          console.error("Error parsing saved LinkedIn data", e);
        }
      }
    }
  }, [user]);

  // Fetch LinkedIn profile from Supabase
  const fetchLinkedInProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("linkedin_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "No rows found" which is expected if no profile
        throw error;
      }

      if (data) {
        setProfileData(data);
        setLinkedInUrl(data.profile_url);
        setLinkedInStatus(data.status);
      }
    } catch (error) {
      console.error("Error fetching LinkedIn profile:", error);
      // Fallback to localStorage
      const savedProfile = localStorage.getItem("linkedInProfile");
      if (savedProfile) {
        try {
          const profile = JSON.parse(savedProfile);
          setProfileData(profile);
          setLinkedInUrl(profile.profile_url || "");
          setLinkedInStatus(profile.status || "disconnected");
        } catch (e) {
          console.error("Error parsing saved LinkedIn data", e);
        }
      }
    }
  };

  // Validate LinkedIn URL
  const validateLinkedInUrl = (url) => {
    setValidationError("");
    
    if (!url || url.trim() === "") {
      setValidationError("LinkedIn URL is required");
      return false;
    }
    
    if (!url.includes("linkedin.com/in/")) {
      setValidationError("Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)");
      return false;
    }
    
    const username = extractLinkedInUsername(url);
    if (!username) {
      setValidationError("Could not extract username from URL");
      return false;
    }
    
    return true;
  };

  // Check if profile exists
  const checkProfileExists = async (url) => {
    setIsValidating(true);
    
    try {
      const username = extractLinkedInUsername(url);
      
      if (!username) {
        setValidationError("Could not extract username from URL");
        return false;
      }
      
      // Try to do a lightweight check if the profile exists
      // In a real implementation, this could be a separate endpoint
      // that just checks if the profile is accessible
      
      toast({
        title: "Validating LinkedIn URL",
        description: "Checking if profile exists...",
      });
      
      // For this example, we'll use our fetchLinkedInProfile function
      // but in production, you might want a separate lightweight check
      await fetchLinkedInProfile(url);
      
      return true;
    } catch (error) {
      console.error("Error validating LinkedIn profile:", error);
      setValidationError("Could not validate LinkedIn profile. Please check the URL and try again.");
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  // Connect LinkedIn profile
  const handleConnectLinkedIn = async () => {
    // Clear any previous validation errors
    setValidationError("");
    
    // Validate LinkedIn URL
    if (!validateLinkedInUrl(linkedInUrl)) {
      return;
    }
    
    setIsConnecting(true);

    try {
      // First check if the profile exists
      const profileExists = await checkProfileExists(linkedInUrl);
      
      if (!profileExists) {
        toast({
          title: "Profile Not Found",
          description: "We couldn't verify this LinkedIn profile. Please check the URL and try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Now proceed with fetching and storing the profile data
      if (user) {
        // For logged-in users, fetch profile and save to Supabase
        const syncedProfile = await syncLinkedInProfile(supabase, user, linkedInUrl);
        setProfileData(syncedProfile);
      } else {
        // For demo mode, fetch profile and save to localStorage
        try {
          const profileData = await fetchLinkedInProfile(linkedInUrl);
          const timestamp = new Date().toISOString();
          
          const demoProfile = {
            id: Date.now().toString(),
            user_id: "demo-user",
            profile_url: linkedInUrl,
            status: "connected",
            last_synced: timestamp,
            name: profileData.name || "Demo User",
            headline: profileData.headline || "LinkedIn User",
            company: profileData.currentCompany || "",
            position: profileData.currentPosition || "",
            location: profileData.location || "",
            summary: profileData.summary || "",
            experience_json: profileData.experience || [],
            education_json: profileData.education || [],
            skills_json: profileData.skills || []
          };
          
          localStorage.setItem("linkedInProfile", JSON.stringify(demoProfile));
          setProfileData(demoProfile);
        } catch (error) {
          console.error("Error fetching LinkedIn profile data:", error);
          throw new Error("Failed to fetch LinkedIn profile data");
        }
      }

      setLinkedInStatus("connected");

      toast({
        title: "LinkedIn Connected",
        description: "Your LinkedIn profile has been successfully connected and data imported.",
      });
    } catch (error) {
      console.error("Error connecting LinkedIn:", error);
      toast({
        title: "Connection Failed",
        description:
          "There was an error connecting your LinkedIn profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect LinkedIn profile
  const handleDisconnectLinkedIn = async () => {
    try {
      if (user && profileData) {
        // For logged-in users, update Supabase
        const { error } = await supabase
          .from("linkedin_profiles")
          .update({
            status: "disconnected",
          })
          .eq("id", profileData.id)
          .eq("user_id", user.id);

        if (error) throw error;
      }

      // Update local state
      setLinkedInStatus("disconnected");
      setProfileData(null);

      // Clear localStorage
      localStorage.removeItem("linkedInProfile");

      toast({
        title: "LinkedIn Disconnected",
        description: "Your LinkedIn profile has been disconnected.",
      });
    } catch (error) {
      console.error("Error disconnecting LinkedIn:", error);
      toast({
        title: "Disconnection Failed",
        description:
          "There was an error disconnecting your LinkedIn profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Sync LinkedIn profile (enhanced)
  const handleSyncLinkedIn = async () => {
    if (!profileData) return;

    setIsSyncing(true);

    try {
      // Use the syncLinkedInProfile service
      const syncedProfile = await syncLinkedInProfile(supabase, user);

      setProfileData(syncedProfile);
      setLinkedInUrl(syncedProfile.profile_url);

      toast({
        title: "LinkedIn Synced",
        description: "Your LinkedIn profile has been refreshed with the latest data.",
      });
    } catch (error) {
      console.error("Error syncing LinkedIn:", error);
      toast({
        title: "Sync Failed",
        description:
          "There was an error syncing your LinkedIn profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Linkedin className="mr-2 h-5 w-5" />
          LinkedIn
        </CardTitle>
        <CardDescription>
          Connect your LinkedIn profile to enhance your cover letters
        </CardDescription>
      </CardHeader>
      <CardContent>
        {linkedInStatus === "disconnected" ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <Input
                placeholder="https://www.linkedin.com/in/yourprofile"
                value={linkedInUrl}
                onChange={(e) => {
                  setLinkedInUrl(e.target.value);
                  setValidationError("");
                }}
                disabled={isConnecting || isValidating}
                className={validationError ? "border-red-300" : ""}
              />
              
              {validationError && (
                <div className="text-sm text-red-500 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {validationError}
                </div>
              )}
              
              <Button
                onClick={handleConnectLinkedIn}
                className="w-full"
                disabled={isConnecting || isValidating}
              >
                {isConnecting || isValidating ? (
                  <>
                    <LoadingSpinner />{" "}
                    <span className="ml-2">
                      {isValidating ? "Validating..." : "Connecting..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Linkedin className="mr-2 h-4 w-4" /> Connect & Import Data
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-green-500/10 border-green-500/30">
              <div className="flex items-center">
                <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                <div className="flex-1">
                  <AlertDescription className="text-green-500 font-medium">
                    LinkedIn profile connected
                  </AlertDescription>
                  {profileData && (
                    <div className="mt-1">
                      <p className="text-sm text-muted-foreground">
                        {profileData.name || "User"} •{" "}
                        {profileData.headline || "Professional"}
                      </p>
                      {profileData.company && (
                        <p className="text-sm text-muted-foreground">
                          {profileData.position} at {profileData.company}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        Last synced:{" "}
                        {formatRelativeTime(profileData.last_synced)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Alert>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={handleSyncLinkedIn}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <LoadingSpinner /> <span className="ml-2">Syncing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCcw className="h-4 w-4 mr-2" /> Refresh Data
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(linkedInUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" /> View Profile
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDisconnectLinkedIn}
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}