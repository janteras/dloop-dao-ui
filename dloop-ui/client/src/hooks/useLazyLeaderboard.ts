import { useState, useEffect, useCallback, useRef } from 'react';
import { useLeaderboard } from './useLeaderboard';

// Temporary type definition - normally would import from shared type
interface Participant {
  address: string;
  name?: string;
  type: 'Human' | 'AI Node';
  votingPower: number;
  accuracy: number;
  performance: number;
  proposalsCreated: number;
  proposalsVoted: number;
  delegatedTo?: string;
  delegatedToName?: string;
  isCurrentUser?: boolean;
}

interface LazyLeaderboardOptions {
  /**
   * Number of items to load initially
   */
  initialCount?: number;
  
  /**
   * Number of items to load for each batch
   */
  batchSize?: number;
  
  /**
   * Enable sorting by key
   */
  sortBy?: keyof Participant;
  
  /**
   * Sort order
   */
  sortOrder?: 'asc' | 'desc';
  
  /**
   * Filter by participant type
   */
  filter?: 'all' | 'Human' | 'AI Node';
}

/**
 * A custom hook that lazily loads leaderboard participants 
 * for improved performance on mobile devices
 */
export const useLazyLeaderboard = ({
  initialCount = 3,
  batchSize = 5,
  sortBy = 'votingPower',
  sortOrder = 'desc',
  filter = 'all'
}: LazyLeaderboardOptions = {}) => {
  // Get all participants data from the main hook
  const { 
    participants: allParticipants,
    delegations,
    isLoading,
    error,
    refetch,
    delegateTokens,
    undelegateTokens,
    isDelegating
  } = useLeaderboard();
  
  // Track the number of visible items
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  
  // Apply filtering
  const filteredParticipants = filter === 'all' 
    ? allParticipants 
    : allParticipants.filter((p: Participant) => p.type === filter);
  
  // Apply sorting
  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    if (sortOrder === 'asc') {
      return (a[sortBy as keyof Participant] as number) - (b[sortBy as keyof Participant] as number);
    } else {
      return (b[sortBy as keyof Participant] as number) - (a[sortBy as keyof Participant] as number);
    }
  });
  
  // Get only the visible participants
  const visibleParticipants = sortedParticipants.slice(0, visibleCount);
  
  // Load more participants
  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    // Simulate a loading delay for smoother UI feedback
    setTimeout(() => {
      setVisibleCount(prevCount => {
        const newCount = prevCount + batchSize;
        // Check if we've loaded all participants
        if (newCount >= sortedParticipants.length) {
          setHasMore(false);
          return sortedParticipants.length;
        }
        return newCount;
      });
      setIsLoadingMore(false);
    }, 300);
  }, [isLoading, isLoadingMore, sortedParticipants.length, batchSize]);
  
  // Reset visible count when filter or sort changes
  useEffect(() => {
    setVisibleCount(initialCount);
    setHasMore(true);
  }, [filter, sortBy, sortOrder, initialCount]);
  
  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    const currentLoaderRef = loaderRef.current;
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }
    
    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [loadMore, hasMore]);
  
  return {
    // Lazy-loaded participants
    participants: visibleParticipants,
    // Total count for reference
    totalCount: sortedParticipants.length,
    // Loading states
    isLoading,
    isLoadingMore,
    // For infinite scrolling
    hasMore,
    loaderRef,
    loadMore,
    // Original delegations data
    delegations,
    // Error handling
    error,
    // Functions
    refetch,
    delegateTokens,
    undelegateTokens,
    isDelegating
  };
};