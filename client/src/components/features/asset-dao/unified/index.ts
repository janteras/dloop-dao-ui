/**
 * Unified AssetDAO Components
 * 
 * This file exports all unified AssetDAO components to simplify imports
 * and maintain a clean module structure.
 */

export { default as UnifiedAssetDAO } from './UnifiedAssetDAO';
export { default as UnifiedProposalCard } from './UnifiedProposalCard';
export { default as UnifiedCreateProposalModal } from './UnifiedCreateProposalModal';

// Also export types for better TypeScript integration
export type { UnifiedAssetDAOProps } from './UnifiedAssetDAO';
export type { UnifiedProposalCardProps } from './UnifiedProposalCard';
export type { UnifiedCreateProposalModalProps } from './UnifiedCreateProposalModal';
