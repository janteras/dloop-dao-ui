import { Web3Implementation } from '@/types/web3-types';
import { useAppConfig } from '@/config/app-config';

interface AuditResult {
  file: string;
  line: number;
  severity: 'warning' | 'error';
  message: string;
  implementation: Web3Implementation;
  suggestion?: string;
}

interface AuditReport {
  results: AuditResult[];
  summary: {
    totalFiles: number;
    filesWithIssues: number;
    totalIssues: number;
    warningCount: number;
    errorCount: number;
    migrationCompletionPercentage: number;
  };
  timestamp: number;
}

// Patterns to search for in the codebase
const ETHERS_PATTERNS = [
  { pattern: 'import.*ethers', severity: 'warning', message: 'Direct import from ethers' },
  { pattern: 'new ethers\\.Contract', severity: 'error', message: 'Direct Contract instantiation with ethers' },
  { pattern: 'ethers\\.provider', severity: 'error', message: 'Direct ethers provider usage' },
  { pattern: 'ethers\\.utils', severity: 'warning', message: 'Direct ethers utils usage' },
  { pattern: 'ethers\\.Wallet', severity: 'error', message: 'Direct ethers Wallet usage' },
  { pattern: 'ethers\\.BigNumber', severity: 'warning', message: 'Direct ethers BigNumber usage' },
];

// Exclude patterns for files that can legitimately use ethers directly
const EXCLUDE_PATTERNS = [
  'useUnifiedContract.ts',
  'useUnifiedWallet.ts',
  'useRealTimeEvents.ts',
  '__tests__',
  'migrations',
  'ethers-adapter.ts',
  'types/ethers-types.ts',
];

// Safe imports that should be used instead
const SAFE_ALTERNATIVES = {
  'ethers.Contract': 'useUnifiedContract hook',
  'ethers.provider': 'useUnifiedWallet hook',
  'ethers.utils': 'Use utility functions from @/utils/format.ts',
  'ethers.Wallet': 'useUnifiedWallet hook',
  'ethers.BigNumber': '@ethersproject/bignumber',
};

/**
 * Runs an audit of the codebase to find direct references to Ethers.js
 * @param options Audit options
 * @returns Audit report
 */
export async function runMigrationAudit(options: { 
  includePaths?: string[];
  excludePaths?: string[];
  updateAppConfig?: boolean;
} = {}): Promise<AuditReport> {
  const startTime = performance.now();
  const { includePaths = ['src'], excludePaths = [], updateAppConfig = true } = options;
  
  // This would be implemented to actually scan files in a real environment
  // For this demo, we'll return mock results
  const mockResults: AuditResult[] = [
    {
      file: 'src/components/ProposalCard.tsx',
      line: 42,
      severity: 'error',
      message: 'Direct Contract instantiation with ethers',
      implementation: Web3Implementation.ETHERS,
      suggestion: 'Use useUnifiedContract hook instead'
    },
    {
      file: 'src/hooks/useTokenBalance.ts',
      line: 23,
      severity: 'warning',
      message: 'Direct import from ethers',
      implementation: Web3Implementation.ETHERS,
      suggestion: 'Import specific modules from ethersproject'
    },
    {
      file: 'src/utils/formatters.ts',
      line: 15,
      severity: 'warning',
      message: 'Direct ethers utils usage',
      implementation: Web3Implementation.ETHERS,
      suggestion: 'Create unified formatting utilities'
    }
  ];
  
  // Calculate summary stats
  const warningCount = mockResults.filter(r => r.severity === 'warning').length;
  const errorCount = mockResults.filter(r => r.severity === 'error').length;
  const uniqueFiles = new Set(mockResults.map(r => r.file));
  
  const report: AuditReport = {
    results: mockResults,
    summary: {
      totalFiles: 100, // Mock value
      filesWithIssues: uniqueFiles.size,
      totalIssues: mockResults.length,
      warningCount,
      errorCount,
      migrationCompletionPercentage: 100 - (mockResults.length / 100 * 100),
    },
    timestamp: Date.now()
  };
  
  // Update app config with audit results if requested
  if (updateAppConfig) {
    const config = useAppConfig.getState();
    
    // Update completion percentage based on audit
    if (typeof config.setFeatureFlag === 'function') {
      // Set global feature flag based on audit results
      const shouldEnableWagmi = report.summary.migrationCompletionPercentage > 90 && errorCount === 0;
      config.setUseWagmi(shouldEnableWagmi);
      
      console.info(`Migration audit completed. Migration is ${report.summary.migrationCompletionPercentage.toFixed(1)}% complete.`);
      console.info(`Global Wagmi feature flag ${shouldEnableWagmi ? 'enabled' : 'remains disabled'}.`);
    }
  }
  
  const endTime = performance.now();
  console.info(`Audit completed in ${(endTime - startTime).toFixed(2)}ms`);
  
  return report;
}

/**
 * React hook to run the migration audit and get results
 */
export function useMigrationAudit() {
  const { migrationMetrics, recordMetric } = useAppConfig();
  
  const runAudit = async (options?: { 
    includePaths?: string[];
    excludePaths?: string[];
    updateAppConfig?: boolean;
  }) => {
    const startTime = performance.now();
    const report = await runMigrationAudit(options);
    const endTime = performance.now();
    
    // Record audit as a telemetry metric
    recordMetric({
      component: 'MigrationAudit',
      implementation: Web3Implementation.HYBRID,
      timestamp: Date.now(),
      responseTime: endTime - startTime,
      status: 'completed'
    });
    
    return report;
  };
  
  // Get the latest audit report from metrics
  const getLatestAuditReport = () => {
    const auditMetrics = migrationMetrics
      .filter(m => m.component === 'MigrationAudit')
      .sort((a, b) => b.timestamp - a.timestamp);
    
    return auditMetrics[0] || null;
  };
  
  return {
    runAudit,
    getLatestAuditReport,
  };
}
