/**
 * Enhanced AssetDAO Service
 * 
 * Provides a unified interface for interacting with the AssetDAO smart contract
 * with standardized error handling, consistent typing, and proper ethers.js usage.
 */

import { ethers, BigNumberish } from 'ethers';
import { getContract } from '@/lib/contracts';
import { 
  safeContractCall, 
  safeContractTransaction, 
  formatBigNumber, 
  parseAmount
} from '@/lib/ethers-utils';
import { 
  ErrorHandler, 
  ErrorCategory, 
  captureError 
} from '@/lib/error-handler';
import { NotificationService } from './notification-service';
import { TokenSymbolResolver } from './tokenSymbolService';

// Define proposal types
export enum ProposalType {
  Investment = 0,
  Divestment = 1,
  ParameterChange = 2,
  Other = 3
}

// Define proposal states
export enum ProposalState {
  Pending = 0,
  Active = 1,
  Defeated = 2,
  Succeeded = 3,
  Queued = 4,
  Executed = 5,
  Expired = 6,
  Canceled = 7
}

// Proposal interface matching contract structure
export interface ProposalDetails {
  id: number;
  proposer: string;
  description: string;
  proposalType: ProposalType;
  token: string;
  amount: number;
  createdAt: Date;
  votingEnds: Date;
  forVotes: number;
  againstVotes: number;
  executed: boolean;
  canceled: boolean;
  state: ProposalState;
}

// Helper function to safely convert contract data to app types
const mapProposalFromContract = (proposal: any): ProposalDetails => {
  const numericState = Number(proposal.state || 0);
  
  return {
    id: Number(proposal.id || 0),
    proposer: proposal.proposer || ethers.ZeroAddress,
    description: proposal.description || '',
    proposalType: Number(proposal.proposalType || 0),
    token: proposal.token || ethers.ZeroAddress,
    amount: parseFloat(formatBigNumber(proposal.amount, 18, 6)),
    createdAt: new Date((Number(proposal.createdAt || 0) * 1000)),
    votingEnds: new Date((Number(proposal.votingEnds || 0) * 1000)),
    forVotes: parseFloat(formatBigNumber(proposal.forVotes, 18, 6)),
    againstVotes: parseFloat(formatBigNumber(proposal.againstVotes, 18, 6)),
    executed: !!proposal.executed,
    canceled: !!proposal.canceled,
    state: numericState
  };
};

/**
 * Enhanced service with standardized patterns for AssetDAO interactions
 */
export const EnhancedAssetDAOService = {
  /**
   * Get detailed information about a specific proposal
   * @param provider The ethers provider or signer
   * @param proposalId The ID of the proposal to fetch
   * @returns Detailed proposal information
   */
  async getProposalDetails(
    provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner, 
    proposalId: number
  ): Promise<ProposalDetails> {
    try {
      const assetDAO = getContract('AssetDAO', provider);
      
      // Use safe contract call pattern with error handling
      const proposal = await safeContractCall(
        assetDAO.getProposal, 
        [proposalId],
        'Error fetching proposal details'
      );
      
      // Map contract data to typed interface
      return mapProposalFromContract(proposal);
    } catch (error) {
      // Use centralized error handling
      const appError = captureError(
        error, 
        ErrorCategory.CONTRACT, 
        `Failed to fetch proposal #${proposalId}`
      );
      
      // Rethrow with improved context
      throw new Error(appError.message, { cause: error });
    }
  },
  
  /**
   * Create a new investment proposal
   * @param signer The ethers signer
   * @param tokenAddress The address of the token to invest
   * @param amount The amount to invest
   * @param description The proposal description
   * @returns Transaction receipt
   */
  async createInvestmentProposal(
    signer: ethers.JsonRpcSigner, 
    tokenAddress: string, 
    amount: BigNumberish, 
    description: string
  ): Promise<ethers.TransactionReceipt> {
    try {
      const assetDAO = getContract('AssetDAO', signer);
      
      // Validate token before submitting
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error('Invalid token address format');
      }
      
      // Notify user of pending transaction
      NotificationService.info('Preparing investment proposal transaction...');
      
      // Use standardized transaction handling with callbacks
      return await safeContractTransaction(
        assetDAO.propose,
        [ProposalType.Investment, tokenAddress, amount, description],
        {
          errorPrefix: 'Investment Proposal Error',
          onSubmitted: (tx) => {
            NotificationService.transaction(
              tx.hash, 
              'sepolia', 
              { title: 'Investment Proposal' }
            );
          },
          onConfirmed: () => {
            NotificationService.success('Investment proposal created successfully!');
            
            // Register token in symbol resolver for future use
            try {
              const erc20 = new ethers.Contract(
                tokenAddress,
                [
                  'function symbol() view returns (string)',
                  'function decimals() view returns (uint8)'
                ],
                signer
              );
              
              erc20.symbol().then((symbol: string) => {
                TokenSymbolResolver.registerToken(tokenAddress, {
                  symbol,
                  name: symbol,
                  decimals: 18 // Default, will be updated if decimals() call succeeds
                });
                
                erc20.decimals().then((decimals: number) => {
                  TokenSymbolResolver.updateToken(tokenAddress, { decimals });
                }).catch(() => {});
              }).catch(() => {});
            } catch (e) {
              // Silently fail token registration
            }
          }
        }
      );
    } catch (error) {
      captureError(error, ErrorCategory.CONTRACT);
      throw error;
    }
  },
  
  /**
   * Create a new divestment proposal
   * @param signer The ethers signer
   * @param tokenAddress The address of the token to divest
   * @param amount The amount to divest
   * @param description The proposal description
   * @returns Transaction receipt
   */
  async createDivestmentProposal(
    signer: ethers.JsonRpcSigner, 
    tokenAddress: string, 
    amount: BigNumberish, 
    description: string
  ): Promise<ethers.TransactionReceipt> {
    try {
      const assetDAO = getContract('AssetDAO', signer);
      
      // Validate input
      if (!ethers.isAddress(tokenAddress)) {
        throw new Error('Invalid token address format');
      }
      
      // Notify user
      NotificationService.info('Preparing divestment proposal transaction...');
      
      return await safeContractTransaction(
        assetDAO.propose,
        [ProposalType.Divestment, tokenAddress, amount, description],
        {
          errorPrefix: 'Divestment Proposal Error',
          onSubmitted: (tx) => {
            NotificationService.transaction(
              tx.hash, 
              'sepolia', 
              { title: 'Divestment Proposal' }
            );
          },
          onConfirmed: () => {
            NotificationService.success('Divestment proposal created successfully!');
          }
        }
      );
    } catch (error) {
      captureError(error, ErrorCategory.CONTRACT);
      throw error;
    }
  },
  
  /**
   * Create a parameter change proposal
   * @param signer The ethers signer
   * @param parameterAddress The address of the contract containing the parameter
   * @param value The new parameter value
   * @param description The proposal description
   * @returns Transaction receipt
   */
  async createParameterChangeProposal(
    signer: ethers.JsonRpcSigner, 
    parameterAddress: string, 
    value: BigNumberish, 
    description: string
  ): Promise<ethers.TransactionReceipt> {
    try {
      const assetDAO = getContract('AssetDAO', signer);
      
      // Validate input
      if (!ethers.isAddress(parameterAddress)) {
        throw new Error('Invalid parameter address format');
      }
      
      // Notify user
      NotificationService.info('Preparing parameter change proposal transaction...');
      
      return await safeContractTransaction(
        assetDAO.propose,
        [ProposalType.ParameterChange, parameterAddress, value, description],
        {
          errorPrefix: 'Parameter Change Proposal Error',
          onSubmitted: (tx) => {
            NotificationService.transaction(
              tx.hash, 
              'sepolia', 
              { title: 'Parameter Change Proposal' }
            );
          },
          onConfirmed: () => {
            NotificationService.success('Parameter change proposal created successfully!');
          }
        }
      );
    } catch (error) {
      captureError(error, ErrorCategory.CONTRACT);
      throw error;
    }
  },
  
  /**
   * Vote on a proposal with standardized error handling
   * @param signer The ethers signer
   * @param proposalId The ID of the proposal to vote on
   * @param support Whether to support the proposal
   * @returns Transaction receipt
   */
  async voteOnProposal(
    signer: ethers.JsonRpcSigner, 
    proposalId: number, 
    support: boolean
  ): Promise<ethers.TransactionReceipt> {
    try {
      const assetDAO = getContract('AssetDAO', signer);
      const voteType = support ? 'For' : 'Against';
      
      // Notify user
      NotificationService.info(`Preparing to vote ${voteType} proposal #${proposalId}...`);
      
      // Try standard vote function first
      try {
        return await safeContractTransaction(
          assetDAO.vote,
          [proposalId, support],
          {
            errorPrefix: 'Voting Error',
            onSubmitted: (tx) => {
              NotificationService.transaction(
                tx.hash, 
                'sepolia', 
                { title: `Vote ${voteType}` }
              );
            },
            onConfirmed: () => {
              NotificationService.success(`Successfully voted ${voteType} proposal #${proposalId}`);
            }
          }
        );
      } catch (error: any) {
        // If the standard vote function fails with a "function not found" error,
        // try the alternative castVote function
        if (error.message && (
            error.message.includes('has no method') || 
            error.message.includes('not a function') ||
            error.message.includes('unknown function')
          )) {
          console.log('vote() function not found, trying castVote()...');
          
          return await safeContractTransaction(
            assetDAO.castVote,
            [proposalId, support],
            {
              errorPrefix: 'Voting Error',
              onSubmitted: (tx) => {
                NotificationService.transaction(
                  tx.hash, 
                  'sepolia', 
                  { title: `Vote ${voteType}` }
                );
              },
              onConfirmed: () => {
                NotificationService.success(`Successfully voted ${voteType} proposal #${proposalId}`);
              }
            }
          );
        }
        
        // If it's not a method missing error, rethrow
        throw error;
      }
    } catch (error) {
      captureError(error, ErrorCategory.CONTRACT);
      throw error;
    }
  },
  
  /**
   * Check if a user has voted on a proposal
   * @param provider The ethers provider
   * @param proposalId The ID of the proposal
   * @param voterAddress The address of the voter
   * @returns Voting information
   */
  async checkVotingStatus(
    provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner, 
    proposalId: number, 
    voterAddress: string
  ): Promise<{ hasVoted: boolean; support?: boolean; votes?: number }> {
    try {
      const assetDAO = getContract('AssetDAO', provider);
      
      // Try both methods for checking votes
      try {
        // First try standard receipt function
        const receipt = await safeContractCall(
          assetDAO.getReceipt,
          [proposalId, voterAddress],
          'Error checking vote receipt'
        );
        
        return {
          hasVoted: receipt.hasVoted,
          support: receipt.support,
          votes: parseFloat(formatBigNumber(receipt.votes, 18, 6))
        };
      } catch (error: any) {
        // If getReceipt doesn't exist, try alternative method
        if (error.message && (
            error.message.includes('has no method') || 
            error.message.includes('not a function') ||
            error.message.includes('unknown function')
          )) {
          
          // This is a common alternative pattern
          const hasVoted = await safeContractCall(
            assetDAO.hasVoted,
            [proposalId, voterAddress],
            'Error checking voting status'
          );
          
          return { hasVoted };
        }
        
        // If it's not a method missing error, rethrow
        throw error;
      }
    } catch (error) {
      captureError(error, ErrorCategory.CONTRACT);
      
      // Return a default if can't check
      return { hasVoted: false };
    }
  },
  
  /**
   * Execute a proposal
   * @param signer The ethers signer
   * @param proposalId The ID of the proposal to execute
   * @returns Transaction receipt
   */
  async executeProposal(
    signer: ethers.JsonRpcSigner, 
    proposalId: number
  ): Promise<ethers.TransactionReceipt> {
    try {
      const assetDAO = getContract('AssetDAO', signer);
      
      // Notify user
      NotificationService.info(`Preparing to execute proposal #${proposalId}...`);
      
      return await safeContractTransaction(
        assetDAO.executeProposal,
        [proposalId],
        {
          errorPrefix: 'Execution Error',
          onSubmitted: (tx) => {
            NotificationService.transaction(
              tx.hash, 
              'sepolia', 
              { title: 'Execute Proposal' }
            );
          },
          onConfirmed: () => {
            NotificationService.success(`Successfully executed proposal #${proposalId}`);
          }
        }
      );
    } catch (error) {
      captureError(error, ErrorCategory.CONTRACT);
      throw error;
    }
  },
  
  /**
   * Cancel a proposal
   * @param signer The ethers signer
   * @param proposalId The ID of the proposal to cancel
   * @returns Transaction receipt
   */
  async cancelProposal(
    signer: ethers.JsonRpcSigner, 
    proposalId: number
  ): Promise<ethers.TransactionReceipt> {
    try {
      const assetDAO = getContract('AssetDAO', signer);
      
      // Notify user
      NotificationService.info(`Preparing to cancel proposal #${proposalId}...`);
      
      return await safeContractTransaction(
        assetDAO.cancelProposal,
        [proposalId],
        {
          errorPrefix: 'Cancellation Error',
          onSubmitted: (tx) => {
            NotificationService.transaction(
              tx.hash, 
              'sepolia', 
              { title: 'Cancel Proposal' }
            );
          },
          onConfirmed: () => {
            NotificationService.success(`Successfully canceled proposal #${proposalId}`);
          }
        }
      );
    } catch (error) {
      captureError(error, ErrorCategory.CONTRACT);
      throw error;
    }
  },
  
  /**
   * Get all proposals with pagination support
   * @param provider The ethers provider
   * @param options Pagination options
   * @returns Array of proposals
   */
  async getAllProposals(
    provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner,
    options: { limit?: number; offset?: number } = {}
  ): Promise<ProposalDetails[]> {
    try {
      const { limit = 50, offset = 0 } = options;
      const assetDAO = getContract('AssetDAO', provider);
      
      // Get proposal count
      const proposalCount = await safeContractCall(
        assetDAO.getProposalCount,
        [],
        'Error fetching proposal count'
      );
      
      const count = Number(proposalCount);
      
      // Calculate range to fetch
      const startId = Math.max(0, count - offset - limit);
      const endId = Math.max(0, count - offset);
      
      // Build array of promises for parallel fetching
      const proposalPromises = [];
      for (let i = startId; i < endId; i++) {
        proposalPromises.push(this.getProposalDetails(provider, i));
      }
      
      // Fetch all proposals in parallel
      return await Promise.all(proposalPromises);
    } catch (error) {
      captureError(error, ErrorCategory.CONTRACT, 'Failed to fetch proposals');
      return [];
    }
  }
};
