/**
 * Dynamic Import Module for AssetDAO Components
 * 
 * This module provides dynamically imported components with code splitting
 * to optimize bundle size and loading performance.
 */

import { lazy } from 'react';

// Dynamically import the AssetDAO components with React.lazy
export const DynamicAssetDAO = lazy(() => 
  import('./DynamicAssetDAO').then(module => ({
    default: module.DynamicAssetDAO
  }))
);

// Dynamically import the ProposalCard component
export const DynamicProposalCard = lazy(() => 
  import('./DynamicProposalCard').then(module => ({
    default: module.DynamicProposalCard
  }))
);

// Dynamically import the CreateProposalModal component
export const DynamicCreateProposalModal = lazy(() => 
  import('./DynamicCreateProposalModal').then(module => ({
    default: module.DynamicCreateProposalModal
  }))
);

// Re-export the dynamic components with preload capabilities
export { preloadAssetDAOComponents } from './preload';
