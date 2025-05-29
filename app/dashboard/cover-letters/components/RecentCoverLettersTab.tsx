"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import RecentCoverLetter from "./RecentCoverLetter";

interface CoverLetter {
  id: string;
  [key: string]: any;
}

interface RecentCoverLettersTabProps {
  user: any;
  onTabChange: (tab: string) => void;
}

const RecentCoverLettersTab = ({
  user,
  onTabChange,
}: RecentCoverLettersTabProps) => {
  const [allLetters, setAllLetters] = useState<CoverLetter[]>([]);
  const [recentLetters, setRecentLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Load recent cover letters
  const loadRecentLetters = async () => {
    if (!user) {
      setRecentLetters([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/cover-letters/fetch`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to fetch cover letters (Status: ${response.status})`
        );
      }

      const data = await response.json();
      console.log("Fetched cover letters:", data);

      // Handle different API response structures
      let letters: CoverLetter[] = [];
      
      if (Array.isArray(data)) {
        letters = data;
      } else if (data && Array.isArray(data.coverLetters)) {
        letters = data.coverLetters;
      } else if (data && Array.isArray(data.data)) {
        letters = data.data;
      } else {
        console.warn("Unexpected API response structure:", data);
        letters = [];
      }

      // Take only the first 5 letters and ensure they have required properties
      const validLetters = letters
        .filter(letter => letter && typeof letter === 'object');

      setAllLetters(validLetters);
      setRecentLetters(validLetters.slice(0, 5));
      
    } catch (error) {
      console.error("Error loading recent cover letters:", error);
      setError(error instanceof Error ? error.message : "Failed to load cover letters");
      setRecentLetters([]);
    } finally {
      setLoading(false);
    }
  };

  // Load recent letters on component mount
  useEffect(() => {
    loadRecentLetters();
  }, []); // Empty dependency array - only run on mount

  // Reload when user changes
  useEffect(() => {
    if (user) {
      loadRecentLetters();
    } else {
      setAllLetters([]);
      setRecentLetters([]);
      setLoading(false);
    }
  }, [user?.id]); // Only depend on user ID to avoid unnecessary re-renders

  // Get current letters to display based on showAll state
  const currentLetters = showAll ? allLetters : recentLetters;

  const renderContent = () => {
    if (loading) {
      return (
        <div className="py-8 text-center">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-muted-foreground mt-4">
            Loading your recent cover letters...
          </p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <p className="font-medium">Failed to load cover letters</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <Button
            variant="outline"
            onClick={loadRecentLetters}
            disabled={loading}
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (!currentLetters || currentLetters.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-60" />
          <h3 className="text-lg font-medium mb-2">No cover letters yet</h3>
          <p className="text-muted-foreground mb-4">
            You haven&apos;t created any cover letters recently.
          </p>
          <Button
            onClick={() => onTabChange("create")}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Create a New Cover Letter
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {currentLetters.length} {showAll ? 'of all your' : 'of your most recent'} cover letters
          </div>
          {allLetters.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-primary hover:text-primary/80"
            >
              {showAll ? 'Show Recent Only' : `Show All (${allLetters.length})`}
            </Button>
          )}
        </div>
        <div className="divide-y divide-border">
          {currentLetters.map((letter, index) => (
            <div key={letter.id || `letter-${index}`} className="py-3 first:pt-0 last:pb-0">
              <RecentCoverLetter coverLetter={letter} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recent Cover Letters
        </CardTitle>
        <CardDescription>
          Quick access to your recently created cover letters
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {renderContent()}
      </CardContent>
      <CardFooter className="flex justify-center pt-4 border-t">
        {!showAll && allLetters.length > 5 && (
          <Button 
            variant="link" 
            size="sm"
            onClick={() => setShowAll(true)}
          >
            View your full history ({allLetters.length} total)
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        )}
        {showAll && (
          <Button 
            variant="link" 
            size="sm"
            onClick={() => setShowAll(false)}
          >
            Show recent only
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default RecentCoverLettersTab;