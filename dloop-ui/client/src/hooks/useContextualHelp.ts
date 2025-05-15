import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';

// Define contextual help content for each route
const contextualHelpContent: Record<string, string> = {
  '/': 'From the Dashboard you can view protocol statistics and recent proposals. Swipe left to see more metrics and tap on any proposal to view details.',
  
  '/asset-dao': 'The Asset DAO allows you to create and vote on asset allocation proposals. Tap on any proposal to view details or use the "Create Proposal" button to submit a new one.',
  
  '/leaderboard': 'The Leaderboard shows top participants ranked by voting power. Filter by humans or AI nodes, and tap on a card to see more details or delegate tokens.',
  
  '/ai-nodes': 'AI Nodes provide governance recommendations based on data analysis. View their performance metrics and delegate your tokens to nodes you trust.',
  
  '/protocol-dao': 'The Protocol DAO governs core functionality like fees and parameter settings. View active proposals and vote on protocol-level changes.',
  
  '/delegations': 'Manage your token delegations here. You can delegate voting power to other users or AI nodes, and change or revoke delegations at any time.',
  
  '/proposals': 'View all proposals across both Asset and Protocol DAOs. Filter by type or status and tap any proposal to see details.',
};

/**
 * Custom hook that provides contextual help based on the current route
 * @returns An object with the current contextual help text and functions to show/hide the help
 */
export function useContextualHelp() {
  const [location] = useLocation();
  const [helpText, setHelpText] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);

  // Update help text when location changes
  useEffect(() => {
    // Get the base path (first segment)
    const basePath = '/' + (location.split('/')[1] || '');
    
    // Find matching help content
    const contextHelp = contextualHelpContent[basePath] || 
      'Navigate through different sections using the bottom navigation. Tap the help button anytime to see specific guidance for each page.';
    
    setHelpText(contextHelp);
    
    // Hide help when changing pages, but use setTimeout to avoid the update loop
    if (showHelp) {
      const timer = setTimeout(() => {
        setShowHelp(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [location, showHelp]);

  const toggleHelp = () => {
    setShowHelp(prev => !prev);
  };

  return {
    helpText,
    showHelp,
    toggleHelp,
    showHelpPanel: () => setShowHelp(true),
    hideHelpPanel: () => setShowHelp(false),
  };
}