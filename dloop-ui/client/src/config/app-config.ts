import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Web3Implementation } from '@/types/web3-types';

/**
 * Feature flag keys for granular migration control
 */
export enum MigrationFeatureFlag {
  WALLET_CONNECTION = 'useWagmiWallet',
  TOKEN_HANDLING = 'useWagmiTokens',
  CONTRACT_INTERACTIONS = 'useWagmiContracts',
  PROPOSAL_SYSTEM = 'useWagmiProposals',
  VOTING_SYSTEM = 'useWagmiVoting',
  ASSET_DAO = 'useWagmiAssetDao',
  PROTOCOL_DAO = 'useWagmiProtocolDao',
  EVENT_SUBSCRIPTIONS = 'useWagmiEvents',
  REAL_TIME_UPDATES = 'useWagmiRealTime'
}

/**
 * Structure for migration telemetry data
 */
export interface MigrationMetric {
  component: string;
  implementation: Web3Implementation;
  timestamp: number;
  responseTime?: number;
  errorRate?: number;
  status: 'not-started' | 'in-progress' | 'completed';
}

/**
 * User segment for feature flag targeting
 */
export interface UserSegment {
  id: string;
  name: string;
  addresses: string[];
  description: string;
  rolloutPercentage: number;
}

/**
 * Application configuration store
 * Used to manage global application settings including the Wagmi migration toggle
 */
interface AppConfigState {
  // Controls whether to use Wagmi implementation or original Ethers implementation
  useWagmi: boolean;
  // Function to change the Wagmi implementation flag
  setUseWagmi: (value: boolean) => void;
  
  // Track which components have been migrated to Wagmi
  migratedComponents: string[];
  // Function to mark a component as migrated
  markComponentMigrated: (componentName: string) => void;
  
  // Feature flags for granular migration control
  featureFlags: Record<string, boolean>;
  // Function to set a specific feature flag
  setFeatureFlag: (flag: string, value: boolean) => void;
  
  // User segments for targeted rollout
  userSegments: UserSegment[];
  // Function to add or update a user segment
  updateUserSegment: (segment: UserSegment) => void;
  // Function to remove a user segment
  removeUserSegment: (segmentId: string) => void;
  
  // Migration metrics and telemetry
  migrationMetrics: MigrationMetric[];
  // Function to record a new metric
  recordMetric: (metric: MigrationMetric) => void;
  // Function to get metrics for a specific component
  getMetricsForComponent: (component: string) => MigrationMetric[];
  // Function to clear old metrics (keep last N)
  pruneMetrics: (keepCount?: number) => void;
  
  // Migration issue tracking
  migrationIssues: Array<any>; // Using any for backward compatibility
  // Function to get active issues
  getActiveIssues: () => any[];
  // Function to resolve an issue
  resolveIssue: (id: string) => void;
  // Function to clear resolved issues
  clearResolvedIssues: () => void;
}

// Initial feature flags - all disabled by default
const initialFeatureFlags = Object.values(MigrationFeatureFlag).reduce(
  (flags, flag) => ({ ...flags, [flag]: false }),
  {}
);

// Initial user segments
const initialUserSegments: UserSegment[] = [
  {
    id: 'admin',
    name: 'Administrators',
    description: 'Development and administration team',
    addresses: ['0x3639D1F746A977775522221f53D0B1eA5749b8b9'],
    rolloutPercentage: 100 // Always on for admins
  },
  {
    id: 'beta-testers',
    name: 'Beta Testers',
    description: 'Users who opted in for beta testing',
    addresses: [],
    rolloutPercentage: 50 // 50% rollout for beta testers
  },
  {
    id: 'general-users',
    name: 'General Users',
    description: 'All other users',
    addresses: [],
    rolloutPercentage: 10 // 10% rollout for general users
  }
];

export const useAppConfig = create<AppConfigState>()(
  persist(
    (set, get) => ({
      // Global Wagmi toggle
      useWagmi: false, // Default to Ethers implementation
      setUseWagmi: (value) => set({ useWagmi: value }),
      
      // Component migration tracking
      migratedComponents: [],
      markComponentMigrated: (componentName) => 
        set((state) => ({
          migratedComponents: state.migratedComponents.includes(componentName) 
            ? state.migratedComponents 
            : [...state.migratedComponents, componentName]
        })),
        
      // Feature flags for granular control
      featureFlags: initialFeatureFlags,
      setFeatureFlag: (flag, value) => 
        set((state) => ({
          featureFlags: { ...state.featureFlags, [flag]: value }
        })),
      
      // User segment management
      userSegments: initialUserSegments,
      updateUserSegment: (segment) =>
        set((state) => ({
          userSegments: [
            ...state.userSegments.filter(s => s.id !== segment.id),
            segment
          ]
        })),
      removeUserSegment: (segmentId) =>
        set((state) => ({
          userSegments: state.userSegments.filter(s => s.id !== segmentId)
        })),
      
      // Metrics collection
      migrationMetrics: [],
      recordMetric: (metric) =>
        set((state) => ({
          migrationMetrics: [...state.migrationMetrics, metric]
        })),
      getMetricsForComponent: (component) => {
        return get().migrationMetrics.filter(m => m.component === component);
      },
      pruneMetrics: (keepCount = 1000) =>
        set((state) => ({
          migrationMetrics: state.migrationMetrics.slice(-keepCount)
        })),
      
      // Issues management
      migrationIssues: [],
      getActiveIssues: () => {
        return get().migrationIssues.filter((issue: any) => !issue.resolved);
      },
      resolveIssue: (id) =>
        set((state) => ({
          migrationIssues: state.migrationIssues.map((issue: any) =>
            issue.id === id ? { ...issue, resolved: true } : issue
          )
        })),
      clearResolvedIssues: () =>
        set((state) => ({
          migrationIssues: state.migrationIssues.filter((issue: any) => !issue.resolved)
        }))
    }),
    {
      name: 'dloop-app-config', // localStorage key
      partialize: (state) => ({
        // Only persist these fields to localStorage
        useWagmi: state.useWagmi,
        migratedComponents: state.migratedComponents,
        featureFlags: state.featureFlags,
        userSegments: state.userSegments,
        // Don't persist metrics and issues - these can get large
      }),
    }
  )
);
