import { useAppConfig } from '@/config/app-config';

// Define the structure for migration issues
export interface MigrationIssue {
  id: string;
  component: string;
  description: string;
  timestamp: number;
  implementation: 'ethers' | 'wagmi' | 'both';
  severity: 'info' | 'warning' | 'error' | 'critical';
  resolved: boolean;
}

// Extend the app config store to include migration monitoring
interface MigrationMonitoringState {
  issues: MigrationIssue[];
  reportIssue: (issue: Omit<MigrationIssue, 'id' | 'timestamp' | 'resolved'>) => void;
  resolveIssue: (id: string) => void;
  getIssuesByComponent: (component: string) => MigrationIssue[];
  getActiveIssues: () => MigrationIssue[];
  clearResolvedIssues: () => void;
}

// Initialize the monitoring state in the app config
useAppConfig.setState((state) => ({
  ...state,
  migrationIssues: [] as MigrationIssue[],
  reportIssue: (issue) => {
    useAppConfig.setState((state) => {
      const newIssue: MigrationIssue = {
        ...issue,
        id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        resolved: false,
      };
      
      // Log to console for debugging and external monitoring tools
      console.info(
        `[Migration Monitor] ${issue.severity.toUpperCase()}: ${issue.component} - ${issue.description}`
      );
      
      return {
        ...state,
        migrationIssues: [...(state.migrationIssues || []), newIssue],
      };
    });
  },
  resolveIssue: (id) => {
    useAppConfig.setState((state) => {
      const updatedIssues = (state.migrationIssues || []).map((issue) =>
        issue.id === id ? { ...issue, resolved: true } : issue
      );
      
      return {
        ...state,
        migrationIssues: updatedIssues,
      };
    });
  },
  getIssuesByComponent: (component) => {
    return (useAppConfig.getState().migrationIssues || []).filter(
      (issue) => issue.component === component
    );
  },
  getActiveIssues: () => {
    return (useAppConfig.getState().migrationIssues || []).filter(
      (issue) => !issue.resolved
    );
  },
  clearResolvedIssues: () => {
    useAppConfig.setState((state) => ({
      ...state,
      migrationIssues: (state.migrationIssues || []).filter(
        (issue) => !issue.resolved
      ),
    }));
  },
}));

/**
 * Custom hook to monitor contract interactions and report errors
 * 
 * @param component Component name for tracking
 * @param implementation Current implementation being used
 */
export function useMonitorContractInteractions(
  component: string,
  implementation: 'ethers' | 'wagmi'
) {
  const reportIssue = useAppConfig((state) => state.reportIssue);
  
  // Wrapper for contract calls that monitors and reports issues
  const monitorCall = async <T>(
    fn: () => Promise<T>,
    operation: string,
    fallback?: T
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      // Report the issue to the monitoring system
      reportIssue({
        component,
        description: `${operation} failed: ${error.message}`,
        implementation,
        severity: fallback ? 'warning' : 'error',
      });
      
      // Rethrow or return fallback
      if (fallback !== undefined) {
        return fallback;
      }
      throw error;
    }
  };
  
  return { monitorCall };
}

/**
 * Helper to monitor data consistency between implementations
 * 
 * @param ethersData Data from ethers implementation
 * @param wagmiData Data from wagmi implementation
 * @param component Component name for tracking
 * @param dataType Description of the data being compared
 */
export function monitorDataConsistency<T>(
  ethersData: T,
  wagmiData: T,
  component: string,
  dataType: string
) {
  const reportIssue = useAppConfig((state) => state.reportIssue);
  
  // Skip monitoring if data types don't match
  if (typeof ethersData !== typeof wagmiData) {
    reportIssue({
      component,
      description: `Data type mismatch for ${dataType}: Ethers (${typeof ethersData}) vs Wagmi (${typeof wagmiData})`,
      implementation: 'both',
      severity: 'warning',
    });
    return;
  }

  // Handle arrays
  if (Array.isArray(ethersData) && Array.isArray(wagmiData)) {
    if (ethersData.length !== wagmiData.length) {
      reportIssue({
        component,
        description: `Array length mismatch for ${dataType}: Ethers (${ethersData.length}) vs Wagmi (${wagmiData.length})`,
        implementation: 'both',
        severity: 'warning',
      });
    }
    return;
  }

  // Handle objects
  if (typeof ethersData === 'object' && ethersData !== null && typeof wagmiData === 'object' && wagmiData !== null) {
    const ethersKeys = Object.keys(ethersData);
    const wagmiKeys = Object.keys(wagmiData);
    
    if (ethersKeys.length !== wagmiKeys.length) {
      reportIssue({
        component,
        description: `Object structure mismatch for ${dataType}: Different number of properties`,
        implementation: 'both',
        severity: 'warning',
      });
    }
    return;
  }
}

/**
 * Monitor migration health for components that have been migrated
 * 
 * @param component Component name for tracking
 * @param implementation Current implementation being used
 * @param metricData Optional performance and error metrics
 */
export function monitorMigrationHealth(
  component: string, 
  implementation: 'ethers' | 'wagmi' | 'hybrid',
  metricData?: {
    responseTime?: number;
    errorCount?: number;
    totalCalls?: number;
    migrationStatus?: 'not-started' | 'in-progress' | 'completed';
  }
) {
  // Log component usage for telemetry
  console.debug(`[Migration Health] Component: ${component}, Implementation: ${implementation}`);
  
  // Mark component as migrated if using wagmi
  if (implementation === 'wagmi') {
    const config = useAppConfig.getState();
    if (typeof config.markComponentMigrated === 'function') {
      config.markComponentMigrated(component);
    }
  }
  
  // Track performance metrics if provided
  if (metricData) {
    // Store metrics for dashboard visualization
    const now = new Date();
    const metrics = {
      component,
      implementation,
      timestamp: now.getTime(),
      responseTime: metricData.responseTime,
      errorRate: metricData.errorCount && metricData.totalCalls ? 
        (metricData.errorCount / metricData.totalCalls) * 100 : undefined,
      status: metricData.migrationStatus || 
        (implementation === 'wagmi' ? 'completed' : 
         implementation === 'hybrid' ? 'in-progress' : 'not-started')
    };
    
    // Store metrics in app state or send to analytics
    const currentMetrics = localStorage.getItem('migration_metrics');
    const metricsArray = currentMetrics ? JSON.parse(currentMetrics) : [];
    metricsArray.push(metrics);
    localStorage.setItem('migration_metrics', JSON.stringify(metricsArray.slice(-100))); // Keep last 100 metrics
  }
}
