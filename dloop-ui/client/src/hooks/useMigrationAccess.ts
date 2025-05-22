import { useEffect, useState } from 'react';
import { useAppConfig, UserSegment } from '@/config/app-config';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';

interface MigrationAccessResult {
  /**
   * Whether the user has access to the migration dashboard
   */
  hasDashboardAccess: boolean;
  
  /**
   * User segments that the current address belongs to
   */
  userSegments: UserSegment[];
  
  /**
   * Whether feature flags should be enabled for this user
   * based on segment targeting and rollout percentages
   */
  shouldEnableFeatureFlags: boolean;
  
  /**
   * Check if a specific feature flag should be enabled for this user
   */
  shouldEnableFeature: (featureFlag: string) => boolean;
}

/**
 * Hook to determine if the current user has access to migration features and dashboard
 * The migration dashboard is only accessible to admin users (0x3639D1F746A977775522221f53D0B1eA5749b8b9)
 */
export function useMigrationAccess(): MigrationAccessResult {
  const { address, isConnected } = useUnifiedWallet();
  const { userSegments, featureFlags } = useAppConfig();
  const [accessState, setAccessState] = useState<MigrationAccessResult>({
    hasDashboardAccess: false,
    userSegments: [],
    shouldEnableFeatureFlags: false,
    shouldEnableFeature: () => false
  });
  
  useEffect(() => {
    if (!isConnected || !address) {
      setAccessState({
        hasDashboardAccess: false,
        userSegments: [],
        shouldEnableFeatureFlags: false,
        shouldEnableFeature: () => false
      });
      return;
    }
    
    // Find which segments the user belongs to
    const matchingSegments = userSegments.filter(segment => 
      segment.addresses.some(addr => addr.toLowerCase() === address.toLowerCase())
    );
    
    // Admin check - only user with specific address has access to dashboard
    const isAdmin = address.toLowerCase() === '0x3639D1F746A977775522221f53D0B1eA5749b8b9'.toLowerCase();
    
    // Determine if feature flags should be enabled based on rollout percentages
    // Using a deterministic hash of the address for consistency
    const addressHash = hashCode(address);
    const shouldEnableFlags = matchingSegments.some(segment => {
      // Percentage check - use address hash to determine if user is in the rollout percentage
      const hashPercentile = Math.abs(addressHash % 100);
      return hashPercentile < segment.rolloutPercentage;
    });
    
    // Function to check if a specific feature should be enabled
    const checkFeatureFlag = (featureFlag: string) => {
      // If the flag doesn't exist, default to false
      if (!(featureFlag in featureFlags)) {
        return false;
      }
      
      // If it's explicitly enabled in the config, use that
      if (featureFlags[featureFlag] === true) {
        return true;
      }
      
      // Otherwise use the rollout percentage logic
      return shouldEnableFlags;
    };
    
    setAccessState({
      hasDashboardAccess: isAdmin,
      userSegments: matchingSegments,
      shouldEnableFeatureFlags: shouldEnableFlags || isAdmin, // Admins always get features
      shouldEnableFeature: checkFeatureFlag
    });
  }, [address, isConnected, userSegments, featureFlags]);
  
  return accessState;
}

/**
 * Simple hash function to convert a string to a number
 * Used for deterministic targeting based on address
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
