"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { CoverLetter } from "@/types/cover-letter"; // Import the official type

// Improved prop types
interface RecentCoverLettersTabProps {
  user: { id: string; [key: string]: any } | null;
  onTabChange: (tab: string) => void;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

const RecentCoverLettersTab = ({
  user,
  onTabChange,
}: RecentCoverLettersTabProps) => {
  const [allLetters, setAllLetters] = useState<CoverLetter[]>([]);
  const [recentLetters, setRecentLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const cacheRef = useRef<{
    data: CoverLetter[];
    timestamp: number;
    userId: string | null;
  }>({
    data: [],
    timestamp: 0,
    userId: null,
  });

  // Helper function to process raw API data into the strict CoverLetter type
  const processFetchedLetters = (letters: any[]): CoverLetter[] => {
    return letters
      .filter(letter => letter && typeof letter === 'object')
      .map(letter => ({
        ...letter,
        // Ensure created_at is a Date object or null, as required by the type
        created_at: letter.created_at ? new Date(letter.created_at) : null,
      }));
  };
  
  const loadRecentLetters = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setRecentLetters([]);
      setAllLetters([]);
      setLoading(false);
      return;
    }

    const now = Date.now();
    const cacheValid =
      !forceRefresh &&
      cacheRef.current.userId === user.id &&
      cacheRef.current.timestamp > now - CACHE_DURATION &&
      cacheRef.current.data.length > 0;

    if (cacheValid) {
      setAllLetters(cacheRef.current.data);
      setRecentLetters(cacheRef.current.data.slice(0, 5));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/cover-letters/fetch?limit=5`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Failed to fetch cover letters (Status: ${response.status})`
        );
      }

      const data = await response.json();
      let lettersFromApi: any[] = [];

      if (Array.isArray(data)) {
        lettersFromApi = data;
      } else if (data && Array.isArray(data.coverLetters)) {
        lettersFromApi = data.coverLetters;
      } else if (data && Array.isArray(data.data)) {
        lettersFromApi = data.data;
      } else {
        console.warn("Unexpected API response structure:", data);
      }
      
      const validLetters = processFetchedLetters(lettersFromApi);

      cacheRef.current = {
        data: validLetters,
        timestamp: now,
        userId: user.id,
      };

      setAllLetters(validLetters);
      setRecentLetters(validLetters);
    } catch (error) {
      console.error("Error loading recent cover letters:", error);
      setError(error instanceof Error ? error.message : "Failed to load cover letters");
      setRecentLetters([]);
      setAllLetters([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const loadAllLetters = useCallback(async () => {
    if (!user || allLetters.length > 5) return;

    try {
      setLoadingMore(true);
      const response = await fetch(`/api/cover-letters/fetch`);

      if (!response.ok) {
        throw new Error("Failed to fetch all cover letters");
      }

      const data = await response.json();
      let lettersFromApi: any[] = [];

      if (Array.isArray(data)) {
        lettersFromApi = data;
      } else if (data && Array.isArray(data.coverLetters)) {
        lettersFromApi = data.coverLetters;
      } else if (data && Array.isArray(data.data)) {
        lettersFromApi = data.data;
      }

      const validLetters = processFetchedLetters(lettersFromApi);

      cacheRef.current = {
        data: validLetters,
        timestamp: Date.now(),
        userId: user.id,
      };

      setAllLetters(validLetters);
    } catch (error) {
      console.error("Error loading all cover letters:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [user, allLetters.length]);

  useEffect(() => {
    if (user?.id) {
      if (cacheRef.current.userId !== user.id) {
        loadRecentLetters();
      } else if (allLetters.length === 0) {
        loadRecentLetters();
      } else {
        setLoading(false);
      }
    } else {
      setAllLetters([]);
      setRecentLetters([]);
      setLoading(false);
    }
  }, [user?.id, allLetters.length, loadRecentLetters]);

  const handleShowAll = async () => {
    if (!showAll && allLetters.length <= 5) {
      await loadAllLetters();
    }
    setShowAll(!showAll);
  };

  const currentLetters = showAll ? allLetters : recentLetters;

  const SkeletonLoader = () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="py-4 flex flex-col sm:flex-row justify-between gap-4 animate-pulse">
          <div className="flex items-start flex-1">
            <div className="bg-gray-200 p-2 rounded mr-3 mt-1 w-8 h-8"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="flex gap-2 ml-9 sm:ml-0">
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
            <div className="h-8 w-16 bg-gray-200 rounded"></div>
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (loading) {
      return <SkeletonLoader />;
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
            onClick={() => loadRecentLetters(true)}
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
          {(allLetters.length > 5 || (!showAll && recentLetters.length >= 5)) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowAll}
              disabled={loadingMore}
              className="text-primary hover:text-primary/80"
            >
              {loadingMore ? (
                <>Loading...</>
              ) : showAll ? (
                'Show Recent Only'
              ) : (
                `Show All ${allLetters.length > 5 ? `(${allLetters.length})` : ''}`
              )}
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
        {loadingMore && (
          <div className="py-4">
            <SkeletonLoader />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Cover Letters
            </CardTitle>
            <CardDescription>
              Quick access to your recently created cover letters
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => loadRecentLetters(true)}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {renderContent()}
      </CardContent>
      <CardFooter className="flex justify-center pt-4 border-t">
        {!showAll && allLetters.length > 5 && (
          <Button
            variant="link"
            size="sm"
            onClick={handleShowAll}
            disabled={loadingMore}
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