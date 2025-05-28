
/**
 * AssetDAO Local Storage Investigation
 * 
 * Comprehensive audit of local storage usage in AssetDAO components
 */

export interface LocalStorageAuditResult {
  foundKeys: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  issues: string[];
  recommendations: string[];
}

export function auditAssetDAOLocalStorage(): LocalStorageAuditResult {
  console.log('🔍 Auditing AssetDAO local storage usage...');
  
  const allKeys = Object.keys(localStorage);
  const assetDaoKeys = allKeys.filter(key => {
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('asset') ||
           lowerKey.includes('proposal') ||
           lowerKey.includes('vote') ||
           lowerKey.includes('dao') ||
           lowerKey.includes('governance');
  });
  
  const issues: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  // Check for critical voting data in localStorage
  const criticalKeys = assetDaoKeys.filter(key => {
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('vote') || 
           lowerKey.includes('ballot') ||
           lowerKey.includes('voting');
  });
  
  if (criticalKeys.length > 0) {
    riskLevel = 'critical';
    issues.push(`Found ${criticalKeys.length} critical voting-related keys in localStorage`);
    issues.push('Voting state should NEVER be stored locally');
  }
  
  // Check for proposal data caching
  const proposalKeys = assetDaoKeys.filter(key => 
    key.toLowerCase().includes('proposal')
  );
  
  if (proposalKeys.length > 0) {
    if (riskLevel === 'low') riskLevel = 'medium';
    issues.push(`Found ${proposalKeys.length} proposal-related keys in localStorage`);
    issues.push('Proposal data should be fetched fresh from contract');
  }
  
  // Check for cached user data
  const userKeys = assetDaoKeys.filter(key => {
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('user') || 
           lowerKey.includes('account') ||
           lowerKey.includes('wallet');
  });
  
  if (userKeys.length > 0 && riskLevel === 'low') {
    riskLevel = 'medium';
    issues.push('User-related data found in localStorage - verify it\'s not voting state');
  }
  
  const recommendations = [
    'Remove any voting state from localStorage immediately',
    'Use contract calls for all proposal data',
    'Implement proper caching with TTL for non-critical data only',
    'Add localStorage cleanup on wallet disconnect',
    'Use sessionStorage for UI preferences only'
  ];
  
  return {
    foundKeys: assetDaoKeys,
    riskLevel,
    issues,
    recommendations
  };
}

/**
 * Scan component files for localStorage usage
 */
export async function scanComponentsForLocalStorageUsage(): Promise<{
  components: string[];
  usagePatterns: Array<{
    file: string;
    pattern: string;
    line: number;
  }>;
}> {
  const components = [
    'components/assetdao/AssetDAO.tsx',
    'components/features/asset-dao/consolidated/UnifiedProposalCard.tsx',
    'hooks/useProposals.ts',
    'services/enhanced-assetDaoService.ts'
  ];
  
  // This would need to be implemented with file system access
  // For now, return known patterns to look for
  const usagePatterns = [
    {
      file: 'any',
      pattern: 'localStorage.setItem',
      line: 0
    },
    {
      file: 'any', 
      pattern: 'localStorage.getItem',
      line: 0
    },
    {
      file: 'any',
      pattern: 'sessionStorage',
      line: 0
    }
  ];
  
  return {
    components,
    usagePatterns
  };
}
