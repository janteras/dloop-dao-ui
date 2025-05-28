/**
 * Unit tests for the migration audit utility
 * 
 * Verifies that the audit correctly identifies components 
 * that need migration and tracks migration progress
 */

import { MigrationAudit } from '../migration-audit';
import * as appConfig from '@/config/app-config';
import fs from 'fs';
import path from 'path';

// Mock fs and path modules
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
    stat: jest.fn(),
  }
}));

// Mock app config
jest.mock('@/config/app-config', () => ({
  useAppConfig: jest.fn().mockReturnValue({
    featureFlags: {
      enableWagmiForAssetDao: true
    }
  })
}));

describe('Migration Audit Utility', () => {
  // Setup mocks
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock file system
    const mockStat = (file: string) => ({
      isDirectory: () => file.indexOf('.') === -1, // If no extension, treat as directory
      isFile: () => file.indexOf('.') !== -1,
    });
    
    (fs.promises.stat as jest.Mock).mockImplementation((file: string) => Promise.resolve(mockStat(file)));
    
    // Mock directory structure
    (fs.promises.readdir as jest.Mock).mockImplementation((dir: string) => {
      if (dir === '/src') {
        return Promise.resolve(['components', 'hooks', 'services', 'utils', 'config.ts']);
      }
      if (dir === '/src/components') {
        return Promise.resolve(['features', 'common', 'App.tsx']);
      }
      if (dir === '/src/components/features') {
        return Promise.resolve(['asset-dao', 'token-vault']);
      }
      if (dir === '/src/components/features/asset-dao') {
        return Promise.resolve(['ProposalList.tsx', 'ProposalDetail.tsx', 'unified']);
      }
      if (dir === '/src/components/features/asset-dao/unified') {
        return Promise.resolve(['UnifiedProposalList.tsx', 'UnifiedProposalDetail.tsx']);
      }
      if (dir === '/src/hooks') {
        return Promise.resolve(['useAssetDaoContract.ts', 'useEthers.ts', 'unified']);
      }
      if (dir === '/src/hooks/unified') {
        return Promise.resolve(['useUnifiedAssetDaoContract.ts', 'index.ts']);
      }
      if (dir === '/src/services') {
        return Promise.resolve(['ethers-service.ts', 'wagmi']);
      }
      if (dir === '/src/services/wagmi') {
        return Promise.resolve(['assetDaoContractService.ts']);
      }
      return Promise.resolve([]);
    });
    
    // Mock file contents
    (fs.promises.readFile as jest.Mock).mockImplementation((file: string) => {
      if (file.includes('useAssetDaoContract.ts')) {
        return Promise.resolve(`
          import { ethers } from 'ethers';
          import { Contract } from 'ethers';
          
          export function useAssetDaoContract() {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            return new ethers.Contract(address, abi, provider);
          }
        `);
      }
      if (file.includes('useEthers.ts')) {
        return Promise.resolve(`
          import { ethers } from 'ethers';
          
          export function useEthers() {
            return ethers;
          }
        `);
      }
      if (file.includes('ethers-service.ts')) {
        return Promise.resolve(`
          import { ethers } from 'ethers';
          
          export class EthersService {
            provider = ethers.getDefaultProvider();
            utils = ethers.utils;
          }
        `);
      }
      if (file.includes('ProposalList.tsx')) {
        return Promise.resolve(`
          import { useAssetDaoContract } from '@/hooks/useAssetDaoContract';
          import { ethers } from 'ethers';
          
          export function ProposalList() {
            const formatValue = (value) => ethers.utils.formatEther(value);
            return <div>Proposals</div>;
          }
        `);
      }
      if (file.includes('UnifiedProposalList.tsx')) {
        return Promise.resolve(`
          import { useUnifiedAssetDaoContract } from '@/hooks/unified/useUnifiedAssetDaoContract';
          
          export function UnifiedProposalList() {
            const { getProposals, implementation } = useUnifiedAssetDaoContract();
            return <div>Unified Proposals ({implementation})</div>;
          }
        `);
      }
      return Promise.resolve('');
    });
  });

  it('correctly identifies direct ethers usage', async () => {
    const audit = new MigrationAudit();
    const report = await audit.runMigrationAudit({
      includePaths: ['/src'],
      excludePaths: [],
    });
    
    // Should find ethers usage in files
    expect(report.results.length).toBeGreaterThan(0);
    
    // Should identify ethers imports
    const importsFound = report.results.filter(r => 
      r.message.includes('Direct import from ethers')
    );
    expect(importsFound.length).toBeGreaterThan(0);
    
    // Should identify Contract instantiations
    const contractsFound = report.results.filter(r => 
      r.message.includes('Direct Contract instantiation with ethers')
    );
    expect(contractsFound.length).toBeGreaterThan(0);
    
    // Should identify ethers utils usage
    const utilsFound = report.results.filter(r => 
      r.message.includes('Direct ethers utils usage')
    );
    expect(utilsFound.length).toBeGreaterThan(0);
  });

  it('respects exclude patterns', async () => {
    const audit = new MigrationAudit();
    const report = await audit.runMigrationAudit({
      includePaths: ['/src'],
      excludePaths: ['/src/hooks/useEthers.ts'], // Explicitly exclude this file
    });
    
    // Should not find issues in excluded files
    const excludedFileIssues = report.results.filter(r => 
      r.file.includes('useEthers.ts')
    );
    expect(excludedFileIssues.length).toBe(0);
    
    // Should still find issues in other files
    const otherIssues = report.results.filter(r => 
      !r.file.includes('useEthers.ts')
    );
    expect(otherIssues.length).toBeGreaterThan(0);
  });

  it('calculates migration completion percentage correctly', async () => {
    const audit = new MigrationAudit();
    const report = await audit.runMigrationAudit({
      includePaths: ['/src/components/features/asset-dao'],
    });
    
    // Check that summary includes migration completion percentage
    expect(report.summary.migrationCompletionPercentage).toBeDefined();
    
    // The calculation should consider migrated components
    // In our mock, we have UnifiedProposalList.tsx (migrated) and ProposalList.tsx (not migrated)
    // So we'd expect around 50% completion
    expect(report.summary.migrationCompletionPercentage).toBeGreaterThan(0);
    expect(report.summary.migrationCompletionPercentage).toBeLessThan(100);
  });

  it('provides appropriate migration suggestions', async () => {
    const audit = new MigrationAudit();
    const report = await audit.runMigrationAudit({
      includePaths: ['/src'],
    });
    
    // Should provide suggestions for ethers usage
    const issuesWithSuggestions = report.results.filter(r => 
      r.suggestion && r.suggestion.length > 0
    );
    expect(issuesWithSuggestions.length).toBeGreaterThan(0);
    
    // Check specific suggestion for Contract
    const contractIssue = report.results.find(r => 
      r.message.includes('Direct Contract instantiation with ethers')
    );
    expect(contractIssue?.suggestion).toContain('useUnifiedContract hook');
  });

  it('categorizes issues by severity correctly', async () => {
    const audit = new MigrationAudit();
    const report = await audit.runMigrationAudit({
      includePaths: ['/src'],
    });
    
    // Should have both warnings and errors
    expect(report.summary.warningCount).toBeGreaterThan(0);
    expect(report.summary.errorCount).toBeGreaterThan(0);
    
    // Total issues should equal sum of warnings and errors
    expect(report.summary.totalIssues).toBe(
      report.summary.warningCount + report.summary.errorCount
    );
  });

  it('checks feature flags when auditing', async () => {
    // Mock app config to show feature flag is off
    (appConfig.useAppConfig as jest.Mock).mockReturnValue({
      featureFlags: {
        enableWagmiForAssetDao: false
      }
    });
    
    const audit = new MigrationAudit();
    const report = await audit.runMigrationAudit({
      includePaths: ['/src/components/features/asset-dao'],
      updateAppConfig: true,
    });
    
    // Severity of issues should be adjusted based on feature flags
    // When feature flag is off, direct ethers usage in AssetDAO components should be warnings not errors
    const assetDaoIssues = report.results.filter(r => 
      r.file.includes('asset-dao') && !r.file.includes('unified')
    );
    
    // Issues should be marked as warnings instead of errors when feature flag is off
    const warningIssues = assetDaoIssues.filter(r => r.severity === 'warning');
    expect(warningIssues.length).toBeGreaterThan(0);
  });
});
