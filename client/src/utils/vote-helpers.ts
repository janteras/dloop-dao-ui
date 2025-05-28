/**
 * Vote Helper Utilities
 * 
 * Enhanced utilities for handling vote counts and statistics
 * with proper contract data validation and error handling
 */

import { ethers } from 'ethers';

/**
 * Extract vote counts from proposal data with enhanced validation
 */
export function extractVoteCounts(proposal: any): { forVotes: number; againstVotes: number } {
  console.log('🔍 Extracting vote counts from proposal:', {
    id: proposal.id,
    availableFields: Object.keys(proposal),
    forVotesRaw: proposal.forVotes,
    againstVotesRaw: proposal.againstVotes
  });

  // Handle different possible vote count field names and formats
  let forVotes = 0;
  let againstVotes = 0;

  // Try multiple field name variations
  const forVotesPossibleFields = [
    'forVotes', 'for_votes', 'votesFor', 'votes_for', 
    'yesVotes', 'yes_votes', 'supportVotes'
  ];

  const againstVotesPossibleFields = [
    'againstVotes', 'against_votes', 'votesAgainst', 'votes_against',
    'noVotes', 'no_votes', 'opposeVotes'
  ];

  // Extract for votes
  for (const field of forVotesPossibleFields) {
    if (proposal[field] !== undefined && proposal[field] !== null) {
      forVotes = parseVoteValue(proposal[field]);
      console.log(`✅ Found forVotes in field '${field}':`, forVotes);
      break;
    }
  }

  // Extract against votes  
  for (const field of againstVotesPossibleFields) {
    if (proposal[field] !== undefined && proposal[field] !== null) {
      againstVotes = parseVoteValue(proposal[field]);
      console.log(`✅ Found againstVotes in field '${field}':`, againstVotes);
      break;
    }
  }

  const result = { forVotes, againstVotes };
  console.log('📊 Final extracted vote counts:', result);

  return result;
}

/**
 * Parse vote value from various formats (BigNumber, string, number)
 */
function parseVoteValue(value: any): number {
  try {
    // Handle undefined/null
    if (value === undefined || value === null) {
      return 0;
    }

    // Handle already parsed numbers
    if (typeof value === 'number') {
      return value;
    }

    // Handle string representations
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }

    // Handle bigint (Ethers v6 native type)
    if (typeof value === 'bigint') {
      const formatted = ethers.formatEther(value);
      return parseFloat(formatted);
    }

    // Handle objects
    if (value && typeof value === 'object') {
      // Handle objects with toString method
      if (typeof value.toString === 'function') {
        try {
          const stringValue = value.toString();
          const formatted = ethers.formatEther(stringValue);
          return parseFloat(formatted);
        } catch (e) {
          console.warn('Error converting object to string:', e);
          return 0;
        }
      }
    }

    // Fallback: try to format whatever we got
    try {
      const formatted = ethers.formatEther(value);
      return parseFloat(formatted);
    } catch (e) {
      console.warn('Fallback formatting failed:', e);
      return 0;
    }

  } catch (error) {
    console.error('Error parsing vote value:', error, value);
    return 0;
  }
}

/**
 * Calculate voting statistics with enhanced validation
 */
export function calculateVotingStats(forVotes: number, againstVotes: number) {
  // Validate inputs
  if (isNaN(forVotes) || isNaN(againstVotes)) {
    console.warn('Invalid vote numbers provided:', { forVotes, againstVotes });
    return {
      totalVotes: 0,
      forPercentage: 0,
      againstPercentage: 0,
      hasVotes: false,
      meetsQuorum: false,
      quorumProgress: 0
    };
  }

  const totalVotes = forVotes + againstVotes;
  const forPercentage = totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (againstVotes / totalVotes) * 100 : 0;

  // Quorum settings (100,000 DLOOP tokens as per AssetDAO_Quorum_And_Voting.md)
  const QUORUM_THRESHOLD = 100000;
  const meetsQuorum = totalVotes >= QUORUM_THRESHOLD;
  const quorumProgress = Math.min((totalVotes / QUORUM_THRESHOLD) * 100, 100);

  const stats = {
    totalVotes,
    forPercentage: Math.round(forPercentage * 100) / 100, // Round to 2 decimal places
    againstPercentage: Math.round(againstPercentage * 100) / 100,
    hasVotes: totalVotes > 0,
    meetsQuorum,
    quorumProgress: Math.round(quorumProgress * 100) / 100
  };

  console.log('📈 Calculated voting stats:', stats);
  return stats;
}

/**
 * Check if proposal is passing (meets quorum and has majority)
 */
export function isProposalPassing(forVotes: number, againstVotes: number, quorumThreshold: number = 100000): boolean {
  const totalVotes = forVotes + againstVotes;

  // First check if quorum is met
  if (totalVotes < quorumThreshold) {
    return false; // Automatically fails if quorum not met
  }

  // If quorum is met, check simple majority
  return forVotes > againstVotes;
}

export function getProposalStatus(
  forVotes: number, 
  againstVotes: number, 
  hasDeadlinePassed: boolean,
  isExecuted: boolean = false,
  isCanceled: boolean = false,
  quorumThreshold: number = 100000
): 'active' | 'passed' | 'failed' | 'executed' | 'canceled' {

  if (isExecuted) return 'executed';
  if (isCanceled) return 'canceled';
  if (!hasDeadlinePassed) return 'active';

  const totalVotes = forVotes + againstVotes;
  const quorumMet = totalVotes >= quorumThreshold;
  const majoritySupport = forVotes > againstVotes;

  if (quorumMet && majoritySupport) return 'passed';
  return 'failed';
}

export function getFailureReason(
  forVotes: number, 
  againstVotes: number, 
  quorumThreshold: number = 100000
): 'quorum' | 'majority' | null {
  const totalVotes = forVotes + againstVotes;

  if (totalVotes < quorumThreshold) return 'quorum';
  if (forVotes <= againstVotes) return 'majority';
  return null;
}

/**
 * Check if quorum is met
 */
export function meetsQuorum(
  forVotes: number, 
  againstVotes: number, 
  quorumThreshold: number = 100000
): boolean {
  const totalVotes = forVotes + againstVotes;
  return totalVotes >= quorumThreshold;
}

/**
 * Get quorum progress percentage
 */
export function getQuorumProgress(
  forVotes: number, 
  againstVotes: number, 
  quorumThreshold: number = 100000
): number {
  const totalVotes = forVotes + againstVotes;
  return Math.min((totalVotes / quorumThreshold) * 100, 100);
}

/**
 * Validate proposal data structure
 */
export function validateProposalData(proposal: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!proposal.id) errors.push('Missing proposal ID');
  if (!proposal.type) warnings.push('Missing proposal type');
  if (!proposal.status) warnings.push('Missing proposal status');

  // Vote data validation
  const { forVotes, againstVotes } = extractVoteCounts(proposal);
  if (isNaN(forVotes)) errors.push('Invalid forVotes data');
  if (isNaN(againstVotes)) errors.push('Invalid againstVotes data');

  // Check for potential data inconsistencies
  if (proposal.executed && proposal.status !== 'executed') {
    warnings.push('Proposal marked as executed but status is not "executed"');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export const calculateVotePercentages = (forVotes: ethers.BigNumber, againstVotes: ethers.BigNumber) => {
  const total = forVotes.add(againstVotes);

  if (total.isZero()) {
    return { forPercentage: 0, againstPercentage: 0 };
  }

  const forPercentage = forVotes.mul(100).div(total).toNumber();
  const againstPercentage = againstVotes.mul(100).div(total).toNumber();

  return { forPercentage, againstPercentage };
};

export const validateVotingStatus = (
  proposal: any,
  userAddress: string | null,
  hasVoted: boolean
): {
  canVote: boolean;
  reason?: string;
} => {
  if (!userAddress) {
    return { canVote: false, reason: 'No wallet connected' };
  }

  if (hasVoted) {
    return { canVote: false, reason: 'Already voted on this proposal' };
  }

  if (proposal.executed) {
    return { canVote: false, reason: 'Proposal already executed' };
  }

  if (proposal.canceled) {
    return { canVote: false, reason: 'Proposal has been canceled' };
  }

  const now = new Date();
  const votingEnds = new Date(proposal.votingEnds);

  if (now > votingEnds) {
    return { canVote: false, reason: 'Voting period has ended' };
  }

  // Check if proposal is in active state (state 1)
  if (proposal.state !== 1) {
    return { canVote: false, reason: 'Proposal is not in active voting state' };
  }

  return { canVote: true };
};