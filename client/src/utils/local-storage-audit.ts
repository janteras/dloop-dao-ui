
/**
 * Local Storage Audit Utility
 * 
 * Identifies and analyzes local storage usage that might
 * affect AssetDAO data consistency.
 */

export interface LocalStorageItem {
  key: string;
  value: any;
  size: number;
  type: 'feature-flag' | 'wallet-state' | 'proposal-cache' | 'vote-cache' | 'other';
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface LocalStorageAuditReport {
  timestamp: number;
  totalItems: number;
  totalSize: number;
  items: LocalStorageItem[];
  riskItems: LocalStorageItem[];
  recommendations: string[];
}

/**
 * Performs a comprehensive audit of local storage
 */
export function auditLocalStorage(): LocalStorageAuditReport {
  const items: LocalStorageItem[] = [];
  const riskItems: LocalStorageItem[] = [];
  let totalSize = 0;

  // Iterate through all local storage items
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    const value = localStorage.getItem(key);
    if (!value) continue;

    let parsedValue: any;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      parsedValue = value;
    }

    const size = new Blob([value]).size;
    totalSize += size;

    const item: LocalStorageItem = {
      key,
      value: parsedValue,
      size,
      type: categorizeStorageItem(key, parsedValue),
      impact: assessImpact(key, parsedValue),
      recommendation: getRecommendation(key, parsedValue)
    };

    items.push(item);

    // Flag high-risk items
    if (item.impact === 'high' || isProposalRelated(key, parsedValue)) {
      riskItems.push(item);
    }
  }

  const recommendations = generateOverallRecommendations(items, riskItems);

  return {
    timestamp: Date.now(),
    totalItems: items.length,
    totalSize,
    items,
    riskItems,
    recommendations
  };
}

function categorizeStorageItem(key: string, value: any): LocalStorageItem['type'] {
  const keyLower = key.toLowerCase();
  
  if (keyLower.includes('feature') || keyLower.includes('flag')) {
    return 'feature-flag';
  }
  
  if (keyLower.includes('wallet') || keyLower.includes('connect') || keyLower.includes('account')) {
    return 'wallet-state';
  }
  
  if (keyLower.includes('proposal') || keyLower.includes('assetdao')) {
    return 'proposal-cache';
  }
  
  if (keyLower.includes('vote') || keyLower.includes('voting')) {
    return 'vote-cache';
  }
  
  return 'other';
}

function assessImpact(key: string, value: any): LocalStorageItem['impact'] {
  const keyLower = key.toLowerCase();
  
  // High impact items that could affect data consistency
  if (
    keyLower.includes('proposal') ||
    keyLower.includes('vote') ||
    keyLower.includes('cache') ||
    (typeof value === 'object' && value?.proposals) ||
    (typeof value === 'object' && value?.votes)
  ) {
    return 'high';
  }
  
  // Medium impact items like feature flags
  if (keyLower.includes('feature') || keyLower.includes('flag')) {
    return 'medium';
  }
  
  return 'low';
}

function getRecommendation(key: string, value: any): string {
  const keyLower = key.toLowerCase();
  
  if (keyLower.includes('proposal') && typeof value === 'object') {
    return 'Clear cached proposal data to ensure fresh data from blockchain';
  }
  
  if (keyLower.includes('vote') && typeof value === 'object') {
    return 'Clear cached vote data to prevent stale voting information';
  }
  
  if (keyLower.includes('feature') || keyLower.includes('flag')) {
    return 'Review feature flag settings for correct implementation selection';
  }
  
  if (keyLower.includes('wallet')) {
    return 'Wallet state is normal - no action needed';
  }
  
  return 'Monitor for unexpected data accumulation';
}

function isProposalRelated(key: string, value: any): boolean {
  const keyLower = key.toLowerCase();
  
  if (keyLower.includes('proposal') || keyLower.includes('vote') || keyLower.includes('assetdao')) {
    return true;
  }
  
  if (typeof value === 'object' && value !== null) {
    const stringValue = JSON.stringify(value).toLowerCase();
    return stringValue.includes('proposal') || stringValue.includes('vote') || stringValue.includes('assetdao');
  }
  
  return false;
}

function generateOverallRecommendations(
  items: LocalStorageItem[],
  riskItems: LocalStorageItem[]
): string[] {
  const recommendations: string[] = [];
  
  if (riskItems.length > 0) {
    recommendations.push(`Found ${riskItems.length} high-risk local storage items that may affect data consistency`);
  }
  
  const proposalCacheItems = items.filter(item => item.type === 'proposal-cache');
  if (proposalCacheItems.length > 0) {
    recommendations.push('Clear proposal cache to ensure fresh data from blockchain');
  }
  
  const voteCacheItems = items.filter(item => item.type === 'vote-cache');
  if (voteCacheItems.length > 0) {
    recommendations.push('Clear vote cache to prevent stale voting information');
  }
  
  const featureFlagItems = items.filter(item => item.type === 'feature-flag');
  if (featureFlagItems.length > 0) {
    recommendations.push('Review feature flag configuration for correct implementation selection');
  }
  
  const largeItems = items.filter(item => item.size > 50000); // > 50KB
  if (largeItems.length > 0) {
    recommendations.push('Consider cleaning up large local storage items to improve performance');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Local storage appears clean - no immediate issues detected');
  }
  
  return recommendations;
}

/**
 * Clears all AssetDAO-related cached data
 */
export function clearAssetDAOCache(): {
  clearedItems: string[];
  errors: string[];
} {
  const clearedItems: string[] = [];
  const errors: string[] = [];
  
  // Get all keys first to avoid modifying while iterating
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  
  keys.forEach(key => {
    try {
      const keyLower = key.toLowerCase();
      if (
        keyLower.includes('proposal') ||
        keyLower.includes('vote') ||
        keyLower.includes('assetdao') ||
        keyLower.includes('dao-cache') ||
        keyLower.includes('contract-cache')
      ) {
        localStorage.removeItem(key);
        clearedItems.push(key);
      }
    } catch (error: any) {
      errors.push(`Failed to remove ${key}: ${error.message}`);
    }
  });
  
  return { clearedItems, errors };
}

/**
 * Export local storage data for debugging
 */
export function exportLocalStorageData(): {
  timestamp: number;
  data: Record<string, any>;
  size: number;
} {
  const data: Record<string, any> = {};
  let totalSize = 0;
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    const value = localStorage.getItem(key);
    if (!value) continue;
    
    try {
      data[key] = JSON.parse(value);
    } catch {
      data[key] = value;
    }
    
    totalSize += new Blob([value]).size;
  }
  
  return {
    timestamp: Date.now(),
    data,
    size: totalSize
  };
}
