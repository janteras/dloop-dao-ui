/**
 * Component Preloading Utilities
 * 
 * These utilities allow for intelligent preloading of components
 * to improve perceived performance while maintaining code splitting benefits.
 */

/**
 * Preload all AssetDAO components
 * 
 * This function can be called when the user navigates to the AssetDAO page
 * or when we detect they're likely to use the AssetDAO functionality.
 */
export function preloadAssetDAOComponents() {
  // Start loading all components in parallel
  const promises = [
    import('./DynamicAssetDAO'),
    import('./DynamicProposalCard'),
    import('./DynamicCreateProposalModal')
  ];
  
  // Return promise that resolves when all components are loaded
  return Promise.all(promises);
}

/**
 * Preload just the core AssetDAO component
 * 
 * This is useful for initial page load when we want to show the
 * main UI as quickly as possible but defer loading other components.
 */
export function preloadCoreAssetDAO() {
  return import('./DynamicAssetDAO');
}

/**
 * Preload the ProposalCard component
 * 
 * Call this when we know proposals will be displayed soon.
 */
export function preloadProposalCard() {
  return import('./DynamicProposalCard');
}

/**
 * Preload the CreateProposalModal component
 * 
 * Call this when the user hovers over the "Create Proposal" button
 * to have the modal ready by the time they click.
 */
export function preloadCreateProposalModal() {
  return import('./DynamicCreateProposalModal');
}
