import { useAppConfig } from './app-config';

/**
 * Feature flag definitions with metadata
 */
export const FEATURE_FLAGS = {
  // Wallet-related features
  useWagmiWallet: {
    key: 'useWagmiWallet',
    category: 'Wallet',
    label: 'Wallet Connection',
    description: 'User wallet connection, balances, and network detection',
    default: false,
    dependencies: [],
  },
  
  // Token-related features
  useWagmiTokens: {
    key: 'useWagmiTokens',
    category: 'Tokens',
    label: 'Token Handling',
    description: 'Token balances, transfers, and metadata',
    default: false,
    dependencies: ['useWagmiWallet'],
  },
  
  // Contract interaction features
  useWagmiContracts: {
    key: 'useWagmiContracts',
    category: 'Contracts',
    label: 'Contract Interactions',
    description: 'Smart contract read and write operations',
    default: false,
    dependencies: ['useWagmiWallet'],
  },
  
  // Proposal system features
  useWagmiProposals: {
    key: 'useWagmiProposals',
    category: 'Governance',
    label: 'Proposal System',
    description: 'Creating, viewing, and managing proposals',
    default: false,
    dependencies: ['useWagmiContracts'],
  },
  
  // Voting features
  useWagmiVoting: {
    key: 'useWagmiVoting',
    category: 'Governance',
    label: 'Voting System',
    description: 'Voting on proposals and delegation',
    default: false,
    dependencies: ['useWagmiContracts', 'useWagmiProposals'],
  },
  
  // Asset DAO feature set
  useWagmiAssetDAO: {
    key: 'useWagmiAssetDAO',
    category: 'DAO',
    label: 'Asset DAO Components',
    description: 'Asset DAO user interface and functionality',
    default: false,
    dependencies: ['useWagmiVoting', 'useWagmiProposals', 'useWagmiTokens'],
  },
  
  // Protocol DAO feature set
  useWagmiProtocolDAO: {
    key: 'useWagmiProtocolDAO',
    category: 'DAO',
    label: 'Protocol DAO Components',
    description: 'Protocol DAO user interface and functionality',
    default: false,
    dependencies: ['useWagmiVoting', 'useWagmiProposals'],
  },
  
  // Enhanced UX features
  useEnhancedUX: {
    key: 'useEnhancedUX',
    category: 'UI',
    label: 'Enhanced UX',
    description: 'Improved loading states and error handling',
    default: true,
    dependencies: [],
  },
};

/**
 * Initialize the feature flags in the app config
 * This adds the necessary states and functions to manage feature flags
 */
export function initializeFeatureFlags() {
  // Get the current state
  const currentState = useAppConfig.getState();
  
  // Initialize feature flags if not already present
  if (!currentState.featureFlags) {
    // Create default feature flag values
    const defaultFlags = Object.values(FEATURE_FLAGS).reduce((acc, flag) => {
      acc[flag.key] = flag.default;
      return acc;
    }, {} as Record<string, boolean>);
    
    // Update the app config with feature flags and management functions
    useAppConfig.setState({
      ...currentState,
      featureFlags: defaultFlags,
      
      // Function to set a specific feature flag
      setFeatureFlag: (key: string, value: boolean) => {
        useAppConfig.setState((state) => {
          // Get the flag definition
          const flagDef = Object.values(FEATURE_FLAGS).find(f => f.key === key);
          
          // If toggling on, also enable dependencies
          const updatedFlags = { ...state.featureFlags };
          updatedFlags[key] = value;
          
          if (value && flagDef?.dependencies) {
            // Enable all dependencies
            flagDef.dependencies.forEach(depKey => {
              updatedFlags[depKey] = true;
            });
          }
          
          // If toggling off, also disable dependent features
          if (!value) {
            // Find all flags that depend on this one
            Object.values(FEATURE_FLAGS).forEach(flag => {
              if (flag.dependencies.includes(key)) {
                updatedFlags[flag.key] = false;
              }
            });
          }
          
          return {
            ...state,
            featureFlags: updatedFlags,
          };
        });
      },
      
      // Function to toggle all feature flags at once
      setAllFeatureFlags: (value: boolean) => {
        useAppConfig.setState((state) => {
          const allFlags = Object.values(FEATURE_FLAGS).reduce((acc, flag) => {
            acc[flag.key] = value;
            return acc;
          }, {} as Record<string, boolean>);
          
          return {
            ...state,
            featureFlags: allFlags,
          };
        });
      },
      
      // Function to get all flags for a specific category
      getFeatureFlagsByCategory: (category: string) => {
        const { featureFlags } = useAppConfig.getState();
        
        return Object.values(FEATURE_FLAGS)
          .filter(flag => flag.category === category)
          .map(flag => ({
            ...flag,
            enabled: featureFlags?.[flag.key] || false,
          }));
      },
    });
    
    console.info('[Migration] Feature flags initialized');
  }
}

/**
 * Custom hook to use a specific feature flag
 * 
 * @param key Feature flag key
 * @returns Boolean indicating if the feature is enabled
 */
export function useFeatureFlag(key: string): boolean {
  return useAppConfig((state) => state.featureFlags?.[key] || false);
}

/**
 * Run the initialization when this module is imported
 */
initializeFeatureFlags();
