//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\UserProfileSection.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProfile, type Profile } from "@/lib/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Filename: components/UserProfileSection.tsx
interface UserProfileSectionProps {
  className?: string;
}

export default function UserProfileSection({ className }: UserProfileSectionProps) {
  const { profile, loading, updateProfile } = useProfile();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Profile>>({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    professional_summary: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when profile data is loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        professional_summary: profile.professional_summary || "",
      });
    }
  }, [profile]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await updateProfile(formData);
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Profile updated!",
        description: "Your profile information has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex justify-center items-center min-h-[300px]">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <h2 className="text-2xl font-semibold mb-6">Your Profile</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input 
              id="full_name" 
              value={formData.full_name || ""} 
              onChange={handleChange}
              placeholder="John Doe" 
              className="mt-1" 
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={formData.email || ""} 
              onChange={handleChange}
              placeholder="john@example.com" 
              className="mt-1" 
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone" 
              value={formData.phone || ""} 
              onChange={handleChange}
              placeholder="+47 123 45 678" 
              className="mt-1" 
            />
          </div>
          
          <div>
            <Label htmlFor="location">Location</Label>
            <Input 
              id="location" 
              value={formData.location || ""} 
              onChange={handleChange}
              placeholder="Oslo, Norway" 
              className="mt-1" 
            />
          </div>
        </div>

        

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoadingSpinner /> : "Save Profile"}
          </Button>
        </div>
      </form>
    </Card>
  );
}