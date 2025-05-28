
/**
 * AssetDAO Component Data Source Audit
 * 
 * Traces exactly how each component gets its data and identifies potential issues
 */

export interface ComponentDataAudit {
  component: string;
  dataSource: 'contract' | 'api' | 'localStorage' | 'mock' | 'mixed';
  concerns: string[];
  localStorageKeys: string[];
}

export const COMPONENT_AUDIT_RESULTS: ComponentDataAudit[] = [
  {
    component: 'components/assetdao/AssetDAO.tsx',
    dataSource: 'mixed',
    concerns: [
      'Uses useProposals hook which may mix data sources',
      'Filteration logic happens in UI, not contract query',
      'Proposal status mapping needs verification'
    ],
    localStorageKeys: []
  },
  
  {
    component: 'components/features/asset-dao/consolidated/UnifiedProposalCard.tsx',
    dataSource: 'contract',
    concerns: [
      'Proposal vote counts must come directly from contract',
      'Status determination should match contract enum',
      'Voting eligibility check needs hasVoted() validation'
    ],
    localStorageKeys: []
  },
  
  {
    component: 'hooks/useProposals.ts',
    dataSource: 'mixed',
    concerns: [
      'May use API endpoints instead of direct contract calls',
      'Vote counting logic needs contract verification',
      'Real-time updates dependency unclear'
    ],
    localStorageKeys: []
  },
  
  {
    component: 'services/enhanced-assetDaoService.ts', 
    dataSource: 'contract',
    concerns: [
      'Multiple provider fallbacks could cause inconsistency',
      'Error handling may mask contract state issues',
      'Event parsing needs ABI alignment verification'
    ],
    localStorageKeys: []
  }
];

/**
 * Critical voting flow validation checks
 */
export const VOTING_FLOW_VALIDATIONS = [
  {
    check: 'Proposal Data Source',
    description: 'Verify proposals come from getProposal() contract calls',
    validation: 'proposals.every(p => p.source === "contract")',
    critical: true
  },
  
  {
    check: 'Vote Count Accuracy', 
    description: 'Ensure vote counts match contract yesVotes/noVotes',
    validation: 'contractVotes.yesVotes === displayedYesVotes',
    critical: true
  },
  
  {
    check: 'Voting Status Check',
    description: 'Verify hasVoted() before allowing vote submission',
    validation: 'await contract.hasVoted(proposalId, userAddress)',
    critical: true
  },
  
  {
    check: 'Proposal State Consistency',
    description: 'Status enum values must match contract ProposalState',
    validation: 'uiStatus === contractProposalState',
    critical: true
  },
  
  {
    check: 'No Local Storage Voting',
    description: 'Vote data must not be stored in localStorage',
    validation: '!localStorage.getItem("votes")',
    critical: true
  }
] as const;
