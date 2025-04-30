import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design that detects if a media query matches
 * 
 * @param query The media query to check against
 * @returns Boolean indicating if the media query matches
 * 
 * Example usage:
 * const isMobile = useMediaQuery('(max-width: 640px)');
 * const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
 * const isDesktop = useMediaQuery('(min-width: 1025px)');
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with a default value by checking the query against the window
  const getMatches = (): boolean => {
    // Ensure window is available (client-side only)
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  // State to hold the current match status
  const [matches, setMatches] = useState<boolean>(getMatches());

  // Effect to add listener and update state when matches change
  useEffect(() => {
    // Verify window is available for SSR
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    // Define a callback to handle changes
    const handleChange = (): void => {
      setMatches(mediaQuery.matches);
    };

    // Initial check
    handleChange();

    // Add event listener using the standard API
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    // Clean up
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

// Export common media query hooks for convenience
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 640px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}

export default useMediaQuery;