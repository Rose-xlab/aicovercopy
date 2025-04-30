"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import UserProfileSection from "@/components/UserProfileSection";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard

            </Button>
          </Link>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Profile Settings</h1>
          <UserProfileSection />
        </div>
      </div>
    </main>
  );
}