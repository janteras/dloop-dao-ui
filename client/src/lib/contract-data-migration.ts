
/**
 * Contract Data Migration Utility
 * 
 * Handles migration from mock data to real contract data
 * Ensures local storage proposal IDs are preserved
 */

interface StoredProposalData {
  id: string;
  userVote?: boolean;
  lastInteraction?: string;
  bookmarked?: boolean;
}

/**
 * Migrates local storage data to remove mock data dependencies
 * while preserving user interaction data
 */
export function migrateLocalStorageData(): void {
  try {
    // Get all localStorage keys related to AssetDAO
    const assetDaoKeys = Object.keys(localStorage).filter(key => 
      key.includes('assetdao') || 
      key.includes('proposal') || 
      key.includes('vote')
    );

    console.log('Migrating AssetDAO local storage data...', { keysFound: assetDaoKeys.length });

    // Process each key
    assetDaoKeys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (!data) return;

        const parsedData = JSON.parse(data);
        
        // If this looks like mock data, remove debug flags but keep user data
        if (parsedData.__debug?.isMockData) {
          delete parsedData.__debug;
          localStorage.setItem(key, JSON.stringify(parsedData));
          console.log(`Cleaned mock data flags from ${key}`);
        }
        
        // Preserve proposal interaction data
        if (parsedData.userVote !== undefined || parsedData.bookmarked !== undefined) {
          console.log(`Preserved user interaction data for ${key}`);
        }
      } catch (error) {
        console.warn(`Failed to migrate localStorage key ${key}:`, error);
      }
    });

    // Set migration flag to avoid running again
    localStorage.setItem('assetdao_migration_completed', Date.now().toString());
    console.log('AssetDAO local storage migration completed');
  } catch (error) {
    console.error('Failed to migrate AssetDAO local storage data:', error);
  }
}

/**
 * Checks if migration has already been completed
 */
export function isMigrationCompleted(): boolean {
  return localStorage.getItem('assetdao_migration_completed') !== null;
}

/**
 * Forces a fresh start by clearing all AssetDAO related localStorage
 * (use with caution - this will remove user voting history)
 */
export function clearAssetDaoLocalStorage(): void {
  const assetDaoKeys = Object.keys(localStorage).filter(key => 
    key.includes('assetdao') || 
    key.includes('proposal') || 
    key.includes('vote')
  );

  assetDaoKeys.forEach(key => localStorage.removeItem(key));
  console.log('Cleared all AssetDAO local storage data');
}
