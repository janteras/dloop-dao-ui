import { useAppConfig } from '@/config/app-config';
import { useState, useEffect } from 'react';
import { monitorDataConsistency } from './migration-monitoring';

/**
 * Types of data that can be validated for consistency
 */
export enum DataType {
  PROPOSAL = 'proposal',
  TOKEN_BALANCE = 'token_balance',
  CONTRACT_READ = 'contract_read',
  TRANSACTION = 'transaction',
  WALLET_STATE = 'wallet_state',
}

/**
 * Structure for recording consistency check results
 */
interface ConsistencyCheck {
  id: string;
  component: string;
  dataType: DataType;
  isConsistent: boolean;
  ethersData: any;
  wagmiData: any;
  timestamp: number;
  details?: string;
}

// Extend app config with consistency check tracking
useAppConfig.setState((state) => ({
  ...state,
  consistencyChecks: [] as ConsistencyCheck[],
  
  // Record a new consistency check
  recordConsistencyCheck: (
    component: string,
    dataType: DataType,
    ethersData: any,
    wagmiData: any,
    details?: string
  ) => {
    const isConsistent = deepEqual(ethersData, wagmiData);
    
    useAppConfig.setState((state) => {
      const newCheck: ConsistencyCheck = {
        id: `check-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        component,
        dataType,
        isConsistent,
        ethersData,
        wagmiData,
        timestamp: Date.now(),
        details,
      };
      
      // Also report to the monitoring system if inconsistent
      if (!isConsistent) {
        // Import directly to avoid circular dependency
        const { reportIssue } = useAppConfig.getState();
        if (reportIssue) {
          reportIssue({
            component,
            description: `Data inconsistency detected in ${dataType}: ${details || ''}`,
            implementation: 'both',
            severity: 'warning',
          });
        }
      }
      
      return {
        ...state,
        consistencyChecks: [...(state.consistencyChecks || []), newCheck],
      };
    });
    
    return isConsistent;
  },
  
  // Get consistency checks by component and type
  getConsistencyChecks: (component?: string, dataType?: DataType) => {
    const { consistencyChecks = [] } = useAppConfig.getState();
    
    return consistencyChecks.filter(check => 
      (!component || check.component === component) &&
      (!dataType || check.dataType === dataType)
    );
  },
  
  // Get consistency rate for a component or data type
  getConsistencyRate: (component?: string, dataType?: DataType) => {
    const checks = useAppConfig.getState().getConsistencyChecks(component, dataType);
    
    if (checks.length === 0) return 100; // Default to 100% if no checks
    
    const consistentChecks = checks.filter(check => check.isConsistent);
    return Math.round((consistentChecks.length / checks.length) * 100);
  },
  
  // Clear all consistency checks
  clearConsistencyChecks: () => {
    useAppConfig.setState(state => ({
      ...state,
      consistencyChecks: [],
    }));
  },
}));

/**
 * Deep equality comparison for objects and arrays
 */
function deepEqual(a: any, b: any): boolean {
  // Handle primitive types
  if (a === b) return true;
  
  // Handle null/undefined
  if (a == null || b == null) return a === b;
  
  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }
  
  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  // Handle BigInt
  if (typeof a === 'bigint' && typeof b === 'bigint') {
    return a === b;
  }
  
  // Handle BigInt in string representation
  if (
    (typeof a === 'string' && a.startsWith('0x') && typeof b === 'bigint') ||
    (typeof b === 'string' && b.startsWith('0x') && typeof a === 'bigint')
  ) {
    try {
      const aBigInt = typeof a === 'bigint' ? a : BigInt(a);
      const bBigInt = typeof b === 'bigint' ? b : BigInt(b);
      return aBigInt === bBigInt;
    } catch (e) {
      return false;
    }
  }
  
  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    
    return true;
  }
  
  // Default to strict equality
  return a === b;
}

/**
 * Hook for comparing data between Ethers and Wagmi implementations
 * 
 * @param component Component name
 * @param dataType Type of data being compared
 * @param ethersDataFn Function to get data using Ethers implementation
 * @param wagmiDataFn Function to get data using Wagmi implementation
 * @param dependencies Additional dependencies to trigger comparison
 */
export function useDataConsistencyCheck<T>(
  component: string,
  dataType: DataType,
  ethersDataFn: () => Promise<T>,
  wagmiDataFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [ethersData, setEthersData] = useState<T | null>(null);
  const [wagmiData, setWagmiData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConsistent, setIsConsistent] = useState<boolean | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const recordConsistencyCheck = useAppConfig(state => state.recordConsistencyCheck);
  
  // Function to run the comparison
  const runComparison = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch data from both implementations in parallel
      const [ethersResult, wagmiResult] = await Promise.all([
        ethersDataFn(),
        wagmiDataFn(),
      ]);
      
      setEthersData(ethersResult);
      setWagmiData(wagmiResult);
      
      // Record the consistency check
      const consistent = recordConsistencyCheck(
        component,
        dataType,
        ethersResult,
        wagmiResult
      );
      
      setIsConsistent(consistent);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Run comparison when dependencies change
  useEffect(() => {
    runComparison();
  }, dependencies);
  
  return {
    ethersData,
    wagmiData,
    isLoading,
    isConsistent,
    error,
    runComparison,
  };
}

/**
 * Utility to compare contract read results between implementations
 * 
 * @param component Component name
 * @param contractAddress Contract address
 * @param functionName Contract function name
 * @param args Function arguments
 * @param ethersProvider Ethers provider
 * @param ethersAbi Ethers ABI
 */
export async function compareContractRead(
  component: string,
  contractAddress: string,
  functionName: string,
  args: any[],
  ethersProvider: any,
  ethersAbi: any
) {
  const { recordConsistencyCheck } = useAppConfig.getState();
  
  try {
    // Get data using Ethers
    const ethersContract = new ethersProvider.Contract(
      contractAddress,
      ethersAbi,
      ethersProvider
    );
    const ethersResult = await ethersContract[functionName](...args);
    
    // Get data using Wagmi
    const { readContract } = await import('wagmi');
    const wagmiResult = await readContract({
      address: contractAddress as `0x${string}`,
      abi: ethersAbi,
      functionName,
      args,
    });
    
    // Record the consistency check
    return recordConsistencyCheck(
      component,
      DataType.CONTRACT_READ,
      ethersResult,
      wagmiResult,
      `${functionName}(${args.join(', ')})`
    );
  } catch (error) {
    console.error(`Error comparing contract read for ${functionName}:`, error);
    return false;
  }
}
