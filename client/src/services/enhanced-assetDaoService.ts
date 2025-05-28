/**
 * Enhanced AssetDAO Service with proper ABI handling
 * 
 * Fixes critical issues:
 * 1. Proper destructuring of getProposal() 12-field tuple
 * 2. Consistent data mapping between contract and UI
 * 3. Error handling for contract method failures
 */

import { ethers } from 'ethers';
import { getContract } from '@/lib/contracts';
import { mapContractTypeToUI } from '@/lib/proposalTypeMapping';

// Contract ABI structure based on assetdao.abi.v1.json
export interface ContractProposalData {
  id: bigint | number;
  proposalType: number;
  assetAddress: string;
  amount: bigint | number;
  description: string;
  proposer: string;
  createdAt: bigint | number;
  votingEnds: bigint | number;
  yesVotes: bigint | number;
  noVotes: bigint | number;
  status: number;
  executed: boolean;
}

export interface ProposalDetails {
  id: number;
  type: 'invest' | 'divest';
  token: string;
  amount: string;
  description: string;
  proposer: string;
  createdAt: Date;
  votingEnds: Date;
  forVotes: bigint | number;
  againstVotes: bigint | number;
  state: number;
  executed: boolean;
  canceled: boolean;
  readyToExecute?: boolean;
}

export enum ProposalState {
  Pending = 0,
  Active = 1,
  Defeated = 2,
  Succeeded = 3,
  Queued = 4,
  Executed = 5,
  Expired = 6
}

export enum ProposalType {
  Invest = 0,
  Divest = 1
}

import { CONTRACT_ADDRESSES } from '@/config/contracts';

export class EnhancedAssetDAOService {
  private static contractAddress = CONTRACT_ADDRESSES.AssetDAO;

  /**
   * Get all proposals with proper ABI handling
   */
  static async getAllProposals(
    provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner
  ): Promise<ProposalDetails[]> {
    try {
      console.log('🔍 Enhanced AssetDAO Service: Fetching all proposals...');

      const contract = getContract('AssetDAO', provider);

      // Get proposal count first
      const proposalCount = await contract.getProposalCount();
      console.log(`📊 Total proposals: ${proposalCount.toString()}`);

      // Handle both BigNumber and regular number returns
      const proposalCountNumber = typeof proposalCount === 'number' ? proposalCount : parseInt(proposalCount.toString());

      if (proposalCountNumber === 0) {
        console.log('No proposals found');
        return [];
      }

      const proposals: ProposalDetails[] = [];

      // Fetch proposals in batches to avoid RPC limits
      const batchSize = 5;
      const sharedContract = getContract('AssetDAO', provider);

      for (let i = 1; i <= proposalCountNumber; i += batchSize) {
        const batch = [];
        for (let j = i; j < Math.min(i + batchSize, proposalCountNumber + 1); j++) {
          batch.push(this.getProposalById(provider, j, sharedContract));
        }

        const batchResults = await Promise.allSettled(batch);
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            proposals.push(result.value);
          } else {
            console.warn(`Failed to fetch proposal ${i + index}:`, result.status === 'rejected' ? result.reason : 'Unknown error');
          }
        });
      }

      console.log(`✅ Successfully fetched ${proposals.length} proposals`);
      return proposals.sort((a, b) => b.id - a.id); // Sort by newest first

    } catch (error) {
      console.error('❌ Error fetching proposals:', error);
      throw new Error(`Failed to fetch proposals: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a single proposal by ID with proper tuple destructuring
   */
  static async getProposalById(
    provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner,
    proposalId: number,
    contract?: any
  ): Promise<ProposalDetails | null> {
    try {
      console.log(`🔍 Fetching proposal ${proposalId}...`);

      const contractInstance = contract || getContract('AssetDAO', provider);

      // Call getProposal with proper error handling
      const proposalData = await contractInstance.getProposal(proposalId);

      // Properly destructure the 12-field tuple based on ABI
      const [
        id,              // uint256 id
        proposalType,    // enum ProposalType
        assetAddress,    // address assetAddress  
        amount,          // uint256 amount
        description,     // string description
        proposer,        // address proposer
        createdAt,       // uint256 createdAt
        votingEnds,      // uint256 votingEnds
        yesVotes,        // uint256 yesVotes
        noVotes,         // uint256 noVotes
        status,          // enum ProposalState
        executed         // bool executed
      ] = proposalData;

      console.log(`📊 Proposal ${proposalId} data:`, {
        id: id.toString(),
        type: proposalType,
        amount: ethers.formatEther(amount),
        forVotes: ethers.formatEther(yesVotes),
        againstVotes: ethers.formatEther(noVotes),
        status: status,
        executed
      });

      // Calculate if proposal is ready to execute
      const forVotesFormatted = parseFloat(ethers.formatEther(yesVotes));
      const againstVotesFormatted = parseFloat(ethers.formatEther(noVotes));
      const totalVotes = forVotesFormatted + againstVotesFormatted;
      const meetsQuorum = totalVotes >= 100000; // 100,000 DLOOP quorum
      const hasMajority = forVotesFormatted > againstVotesFormatted;
      const hasDeadlinePassed = new Date() > new Date((typeof votingEnds === 'number' ? votingEnds : parseInt(votingEnds.toString())) * 1000);
      
      // Map to UI-friendly format using the enhanced mapping function
      const proposal: ProposalDetails = {
        id: typeof id === 'number' ? id : parseInt(id.toString()),
        type: mapContractTypeToUI(proposalType, {
          title: description,
          description: description
        }) as 'invest' | 'divest',
        token: this.getTokenSymbolFromAddress(assetAddress),
        amount: ethers.formatEther(amount),
        description: description || `Proposal ${id.toString()}`,
        proposer,
        createdAt: new Date((typeof createdAt === 'number' ? createdAt : parseInt(createdAt.toString())) * 1000),
        votingEnds: new Date((typeof votingEnds === 'number' ? votingEnds : parseInt(votingEnds.toString())) * 1000),
        forVotes: yesVotes,
        againstVotes: noVotes,
        state: status,
        executed,
        canceled: status === ProposalState.Defeated || status === ProposalState.Expired,
        readyToExecute: !executed && meetsQuorum && hasMajority && hasDeadlinePassed
      };

      return proposal;

    } catch (error) {
      console.error(`❌ Error fetching proposal ${proposalId}:`, error);
      return null;
    }
  }

  /**
   * Vote on a proposal
   */
  static async voteOnProposal(
    signer: ethers.JsonRpcSigner,
    proposalId: number,
    support: boolean
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      console.log(`🗳️ Voting on proposal ${proposalId}, support: ${support}`);

      const contract = getContract('AssetDAO', signer);

      // Check if user has already voted
      const userAddress = await signer.getAddress();
      const hasVoted = await contract.hasVoted(proposalId, userAddress);

      if (hasVoted) {
        throw new Error('You have already voted on this proposal');
      }

      // Cast vote
      const tx = await contract.vote(proposalId, support);
      console.log(`📝 Vote transaction hash: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Vote confirmed in block ${receipt.blockNumber}`);

      return tx;

    } catch (error) {
      console.error(`❌ Error voting on proposal ${proposalId}:`, error);
      throw error;
    }
  }

  /**
   * Check if user has voted on a proposal
   */
  static async hasUserVoted(
    provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner,
    proposalId: number,
    userAddress: string
  ): Promise<boolean> {
    try {
      const contract = getContract('AssetDAO', provider);
      return await contract.hasVoted(proposalId, userAddress);
    } catch (error) {
      console.error(`Error checking vote status for proposal ${proposalId}:`, error);
      return false;
    }
  }

  /**
   * Create a new proposal
   */
  static async createProposal(
    signer: ethers.JsonRpcSigner,
    proposalType: ProposalType,
    assetAddress: string,
    amount: string,
    description: string
  ): Promise<ethers.ContractTransactionResponse> {
    try {
      console.log('🆕 Creating new proposal...', { proposalType, assetAddress, amount, description });

      const contract = getContract('AssetDAO', signer);

      // Parse amount to Wei
      const amountWei = ethers.parseEther(amount);

      // Create proposal
      const tx = await contract.createProposal(
        proposalType,
        assetAddress,
        amountWei,
        description
      );

      console.log(`📝 Proposal creation transaction hash: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log(`✅ Proposal created in block ${receipt.blockNumber}`);

      return tx;

    } catch (error) {
      console.error('❌ Error creating proposal:', error);
      throw error;
    }
  }

  /**
   * Get token symbol from address
   */
  private static getTokenSymbolFromAddress(address: string): string {
    const tokenMap: Record<string, string> = {
      '0x05B366778566e93abfB8e4A9B794e4ad006446b4': 'DLOOP',
      '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238': 'USDC', 
      '0xCA063A2AB07491eE991dCecb456D1265f842b568': 'WBTC'
    };

    return tokenMap[address] || 'UNKNOWN';
  }

  /**
   * Check voting status for a user on a specific proposal
   */
  static async checkVotingStatus(
    provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner,
    proposalId: number,
    userAddress: string
  ): Promise<{ hasVoted: boolean; support?: boolean }> {
    try {
      const contract = getContract('AssetDAO', provider);
      const hasVoted = await contract.hasVoted(proposalId, userAddress);

      // If user has voted, try to get their vote support
      if (hasVoted) {
        try {
          // Try to get vote support from events
          const filter = contract.filters.VoteCast(proposalId, userAddress);
          const events = await contract.queryFilter(filter);
          if (events.length > 0) {
            const support = events[events.length - 1].args?.support;
            return { hasVoted, support };
          }
        } catch (e) {
          console.warn('Could not fetch vote support:', e);
        }
      }

      return { hasVoted, support: undefined };
    } catch (error) {
      console.error('Error checking voting status:', error);
      return { hasVoted: false, support: undefined };
    }
  }

  /**
   * Get governance parameters from contract
   */
  static async getGovernanceParameters(
    provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner
  ): Promise<{
    executionDelay: number;
    timelockPeriod: number;
    votingPeriod: number;
    quorum: number;
  } | null> {
    try {
      const contract = getContract('AssetDAO', provider);

      const [executionDelay, timelockPeriod, votingPeriod, quorum] = await Promise.all([
        contract.executionDelay(),
        contract.timelockPeriod(),
        contract.votingPeriod(),
        contract.quorum()
      ]);

      return {
        executionDelay: Number(executionDelay),
        timelockPeriod: Number(timelockPeriod),
        votingPeriod: Number(votingPeriod),
        quorum: Number(quorum)
      };
    } catch (error) {
      console.error('Error fetching governance parameters:', error);
      return null;
    }
  }

  /**
   * Contract diagnostics to debug method failures
   */
  static async runContractDiagnostics(
    provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner
  ): Promise<{
    contractAccessible: boolean;
    proposalCountWorking: boolean;
    getProposalWorking: boolean;
    errors: string[];
  }> {
    const diagnostics = {
      contractAccessible: false,
      proposalCountWorking: false,
      getProposalWorking: false,
      errors: [] as string[]
    };

    try {
      console.log('🔍 Running AssetDAO contract diagnostics...');

      const contract = getContract('AssetDAO', provider);
      diagnostics.contractAccessible = true;

      // Test getProposalCount
      try {
        const count = await contract.getProposalCount();
        console.log(`✅ Proposal count: ${count.toString()}`);
        diagnostics.proposalCountWorking = true;

        // Handle both BigNumber and regular number returns
        const countNumber = typeof count === 'number' ? count : parseInt(count.toString());

        // Test getProposal if proposals exist
        if (countNumber > 0) {
          try {
            const proposal = await contract.getProposal(1);
            console.log('✅ getProposal working');
            diagnostics.getProposalWorking = true;
          } catch (error) {
            console.error('❌ getProposal failed:', error);
            diagnostics.errors.push(`getProposal failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

      } catch (error) {
        console.error('❌ getProposalCount failed:', error);
        diagnostics.errors.push(`getProposalCount failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    } catch (error) {
      console.error('❌ Contract not accessible:', error);
      diagnostics.errors.push(`Contract not accessible: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return diagnostics;
  }

  static async fetchProposalDetails(id: number): Promise<ProposalDetails | null> {
    try {
      const contract = getContract('AssetDAO');
      if (!contract) {
        throw new Error('AssetDAO contract not available');
      }

      console.log(`🔍 Fetching proposal ${id} from contract...`);

      // Get proposal data from contract - this returns a 12-field tuple
      const proposalData = await contract.getProposal(id);

      if (!proposalData || proposalData.length < 12) {
        console.warn(`⚠️ Invalid proposal data structure for proposal ${id}`);
        return null;
      }

      // Destructure the 12-field tuple according to the ABI
      const [
        proposalId,
        proposalType,
        assetAddress,
        amount,
        description,
        proposer,
        createdAt,
        votingEnds,
        yesVotes,
        noVotes,
        status,
        executed
      ] = proposalData;

      // Debug logging for proposal type mapping
      const rawProposalType = Number(proposalType);
      console.log(`🔍 Proposal ${id} raw type from contract: ${rawProposalType}`);

      // Map the contract data to our interface
      const details: ProposalDetails = {
        id: Number(proposalId),
        type: this.mapProposalType(rawProposalType, { title: '', description: description }),
        token: assetAddress,
        amount: amount.toString(),
        description: description,
        proposer: proposer,
        createdAt: new Date(Number(createdAt) * 1000),
        votingEnds: new Date(Number(votingEnds) * 1000),
        forVotes: yesVotes,
        againstVotes: noVotes,
        state: Number(status),
        executed: Boolean(executed),
        canceled: false // This would need to be determined from events or additional contract calls
      };

      console.log(`✅ Successfully fetched proposal ${id}:`, details);
      console.log(`🔍 Final mapped type for proposal ${id}: ${details.type} (from contract type ${rawProposalType})`);

      return details;

    } catch (error) {
      console.error(`❌ Error fetching proposal ${id}:`, error);
      return null;
    }
  }

  private static mapProposalType(contractType: number, proposal?: { title?: string; description?: string }): 'invest' | 'divest' {
    // Import the enhanced mapping function
    const { mapContractTypeToUI } = require('@/lib/proposalTypeMapping');

    // Use the enhanced mapping logic that includes content analysis
    return mapContractTypeToUI(contractType, proposal);
  }
}

export default EnhancedAssetDAOService;