/**
 * Consolidated Asset DAO Components
 * 
 * This file exports the unified components that replace the duplicate implementations.
 * It serves as a central export point for the consolidated components.
 */

// Export unified proposal card
export { UnifiedProposalCard } from './UnifiedProposalCard';

// Re-export types from enhanced service
export { 
  ProposalType, 
  ProposalState, 
  type ProposalDetails 
} from '@/services/enhanced-assetDaoService';

// Simple migration guide for existing components
// Note: This comment is for documentation purposes only

/**
 * Migration Guide:
 * 
 * 1. For components using the old ProposalCard from components/assetdao/ProposalCard.tsx:
 *    Replace:
 *    ```
 *    import ProposalCard from '@/components/assetdao/ProposalCard';
 *    ```
 *    With:
 *    ```
 *    import { UnifiedProposalCard } from '@/components/features/asset-dao/consolidated';
 *    ```
 * 
 * 2. For components using the newer proposal-card.tsx from components/features/asset-dao:
 *    Replace:
 *    ```
 *    import { ProposalCard } from '@/components/features/asset-dao/proposal-card';
 *    ```
 *    With:
 *    ```
 *    import { UnifiedProposalCard } from '@/components/features/asset-dao/consolidated';
 *    ```
 * 
 * 3. Update component usage:
 *    The UnifiedProposalCard maintains compatibility with both previous implementations
 *    but has some enhanced props:
 *    
 *    - listView?: boolean - Optional prop to switch between card and list view
 *    
 *    Example:
 *    ```
 *    <UnifiedProposalCard 
 *      proposal={proposal}
 *      onRefresh={handleRefresh}
 *      listView={false} // Optional: true for list view, false for card view (default)
 *    />
 *    ```
 */
