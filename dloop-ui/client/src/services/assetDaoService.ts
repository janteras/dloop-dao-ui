import { ethers, BigNumberish } from 'ethers';
import { getContract } from '@/lib/contracts';

// Define proposal types directly in this file since import is causing issues
export enum ProposalType {
  Investment = 0,
  Divestment = 1,
  ParameterChange = 2
}

/**
 * Enum for Proposal States
 */
export enum ProposalState {
  Pending = 0,
  Active = 1,
  Defeated = 2,
  Succeeded = 3,
  Queued = 4,
  Executed = 5,
  Expired = 6
}

// Helper function to get ERC20 contract instance
const getERC20Contract = (tokenAddress: string, signerOrProvider: ethers.JsonRpcProvider | ethers.JsonRpcSigner) => {
  const erc20Abi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function transfer(address to, uint amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)'
  ];
  
  return new ethers.Contract(tokenAddress, erc20Abi, signerOrProvider);
};

/**
 * Service for interacting with the AssetDAO smart contract
 */
export const AssetDAOService = {
  /**
   * Get detailed information about a specific proposal
   * @param provider The ethers provider or signer
   * @param proposalId The ID of the proposal to fetch
   * @returns Detailed proposal information
   */
  async getProposalDetails(
    provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner, 
    proposalId: number
  ) {
    try {
      const assetDAO = getContract('AssetDAO', provider);
      
      // Fetch proposal data (includes description field in the actual contract)
      const proposal = await assetDAO.getProposal(proposalId);
      
      // Extract the description from the proposal data
      const description = proposal.description || ''; // Use empty string as fallback
      
      // Safe conversion of numeric values - handling both BigNumber and regular number types
      const safeToNumber = (value: any) => {
        if (!value) return 0;
        // Check if it's a BigNumber (has toNumber method)
        if (typeof value.toNumber === 'function') {
          return value.toNumber();
        }
        // If it's already a number or string number
        return Number(value);
      };

      // Safe date conversion
      const safeToDate = (value: any) => {
        if (!value) return new Date();
        const timestamp = safeToNumber(value);
        return new Date(timestamp * 1000);
      };

      // Safe formatting of token amount
      const safeFormatEther = (value: any) => {
        if (!value) return '0';
        try {
          return ethers.formatEther(value);
        } catch (e) {
          console.warn('Error formatting ether value:', e);
          return String(value);
        }
      };
      
      return {
        id: safeToNumber(proposal.id),
        type: proposal.proposalType,
        token: proposal.token,
        amount: proposal.amount,
        proposer: proposal.proposer,
        createdAt: safeToDate(proposal.createdAt),
        votingEnds: safeToDate(proposal.votingEnds),
        forVotes: safeFormatEther(proposal.forVotes),
        againstVotes: safeFormatEther(proposal.againstVotes),
        state: proposal.state,
        description
      };
    } catch (error) {
      console.error('Error fetching proposal details:', error);
      // TypeScript fix - handle optional second parameter
      return Promise.reject(this.handleContractError(error));
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
  ) {
    try {
      const assetDAO = getContract('AssetDAO', signer);
      const signerAddress = await signer.getAddress();
      
      console.log(`Creating investment proposal for ${tokenAddress} with amount ${amount}`);
      console.log('Connected wallet address:', signerAddress);
      
      // Try different proposal creation approaches based on common DAO patterns
      let tx = null;
      
      // Helper function to create a proposal using different approaches
      const createProposal = async (): Promise<ethers.TransactionResponse> => {
        // Approach 1: First try the standard propose function (type, token, amount, description)
        try {
          // Ensure we're using the correct proposal type
          const proposalType = ProposalType.Investment; // Investment type (0)
          
          // First validate the token and amount without submitting
          try {
            const token = getERC20Contract(tokenAddress, signer);
            const tokenSymbol = await token.symbol();
            const tokenDecimals = await token.decimals();
            console.log(`Token: ${tokenSymbol} with ${tokenDecimals} decimals`);
          } catch (e) {
            console.error('Error validating token:', e);
            throw new Error('Invalid token address - not a valid ERC20 token');
          }
          
          // Log the proposal details for debugging
          console.log(`Proposal details: Type=${proposalType}, Token=${tokenAddress}, Amount=${amount}, Description=${description}`);
          
          try {
            // Try with default gas settings first
            const transaction = await assetDAO.propose(proposalType, tokenAddress, amount, description);
            console.log('Transaction sent:', transaction.hash);
            return transaction;
          } catch (error: any) {
            console.log('Standard propose failed, trying with explicit gas limit...');
            
            // If the standard approach fails, try with explicit gas limit
            const transaction = await assetDAO.propose(proposalType, tokenAddress, amount, description, {
              gasLimit: 800000 // Very high gas limit to prevent out-of-gas errors
            });
            console.log('Transaction with increased gas limit sent:', transaction.hash);
            return transaction;
          }
        } catch (standardError) {
          console.warn('Standard proposal approach failed:', standardError);
          
          // Approach 2: Try alternative function patterns that might be used in the contract
          console.log('Trying alternative proposal creation approach...');
          
          // Some DAO contracts use createProposal instead of propose
          if (typeof assetDAO.createProposal === 'function') {
            const transaction = await assetDAO.createProposal(tokenAddress, amount, description, {
              gasLimit: 800000
            });
            console.log('createProposal transaction sent:', transaction.hash);
            return transaction;
          }
          
          // Some DAOs use proposeInvestment for specific proposal types
          if (typeof assetDAO.proposeInvestment === 'function') {
            const transaction = await assetDAO.proposeInvestment(tokenAddress, amount, description, {
              gasLimit: 800000
            });
            console.log('proposeInvestment transaction sent:', transaction.hash);
            return transaction;
          }
          
          // Some DAOs use a different parameter order
          try {
            const transaction = await assetDAO.propose(tokenAddress, amount, description, 0, {
              gasLimit: 800000
            });
            console.log('Alternative order propose transaction sent:', transaction.hash);
            return transaction;
          } catch (e) {
            console.warn('Alternative parameter order failed:', e);
          }
          
          throw new Error('All proposal creation approaches failed');
        }
      };
      
      // Try all approaches to create the proposal
      try {
        tx = await createProposal();
      } catch (error) {
        console.error('All proposal approaches failed:', error);
        throw new Error('Unable to create proposal: Contract implementation may be incompatible');
      }
      
      // Wait for transaction confirmation
      console.log('Waiting for transaction confirmation...');
      if (!tx) {
        throw new Error('No transaction was created');
      }
      
      const receipt = await tx.wait();
      if (receipt) {
        console.log('Transaction confirmed in block:', receipt.blockNumber);
        return receipt;
      } else {
        throw new Error('Transaction failed to be mined');
      }
    } catch (error) {
      console.error('Error creating investment proposal:', error);
      
      // Enhanced error handling with more specific messages
      const err = error as any;
      
      // Check for specific error conditions
      if (err?.reason?.includes('threshold') || err?.message?.includes('threshold')) {
        throw new Error('You do not have enough voting power to create a proposal');
      } else if (err?.reason?.includes('delay') || err?.message?.includes('cooldown')) {
        throw new Error('Proposal cooldown period not passed. Please wait before creating another proposal');
      } else if (err?.message?.includes('user rejected')) {
        throw new Error('Transaction rejected by user');
      } else if (err?.message?.includes('gas')) {
        throw new Error('Transaction failed due to gas estimation. The contract may not support this proposal type.');
      } else if (err?.message?.includes('reverted')) {
        throw new Error('Transaction reverted: The contract rejected your proposal. You may need higher voting power or the contract might not support this token.');
      }
      
      throw this.handleContractError(error);
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
    amount: ethers.BigNumberish, 
    description: string
  ) {
    try {
      const assetDAO = getContract('AssetDAO', signer);
      const tx = await assetDAO.propose(
        ProposalType.Divestment,
        tokenAddress,
        amount,
        description
      );
      return await tx.wait();
    } catch (error) {
      console.error('Error creating divestment proposal:', error);
      throw this.handleContractError(error);
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
    value: ethers.BigNumberish, 
    description: string
  ) {
    try {
      const assetDAO = getContract('AssetDAO', signer);
      const tx = await assetDAO.propose(
        ProposalType.ParameterChange,
        parameterAddress,
        value,
        description
      );
      return await tx.wait();
    } catch (error) {
      console.error('Error creating parameter change proposal:', error);
      throw this.handleContractError(error);
    }
  },
  
  /**
   * Vote on a proposal
   * @param signer The ethers signer
   * @param proposalId The ID of the proposal to vote on
   * @param support Whether to support the proposal
   * @returns Transaction receipt
   */
  async voteOnProposal(
    signer: ethers.JsonRpcSigner, 
    proposalId: number, 
    support: boolean
  ) {
    try {
      const assetDAO = getContract('AssetDAO', signer);
      const userAddress = await signer.getAddress();
      
      // Check user's voting power - both direct DLOOP holdings and delegated tokens count
      const dloopToken = getContract('DLoopToken', signer);
      
      // Check direct token holdings
      const walletBalance = await dloopToken.balanceOf(userAddress);
      
      // Check delegated tokens
      const delegatedAmount = await dloopToken.getTotalDelegatedToAmount(userAddress);
      
      // Total voting power is the sum of both
      const totalVotingPower = BigInt(walletBalance) + BigInt(delegatedAmount);
      
      console.log(`Voting power check: Wallet=${ethers.formatEther(walletBalance)}, ` + 
                 `Delegated=${ethers.formatEther(delegatedAmount)}, ` + 
                 `Total=${ethers.formatEther(totalVotingPower)}`);
      
      // User needs some voting power to vote
      if (totalVotingPower <= BigInt(0)) {
        throw new Error(
          'You need DLOOP tokens to vote. Either hold tokens in your wallet or have tokens delegated to you.'
        );
      }
      
      // Check if user has already voted on this proposal
      try {
        const hasVoted = await assetDAO.hasVoted(proposalId, userAddress);
        if (hasVoted) {
          throw new Error('You have already voted on this proposal');
        }
      } catch (checkError) {
        // Continue if hasVoted check fails - it might not be available
        console.warn('Could not check if user has voted:', checkError);
      }
      
      // Estimate gas before submitting the transaction
      try {
        await assetDAO.vote.estimateGas(proposalId, support);
      } catch (gasError: any) {
        // If gas estimation fails, we know the transaction will revert
        // Try to provide more specific error messages based on common revert reasons
        const errorMsg = gasError.message || '';
        if (errorMsg.includes('already voted')) {
          throw new Error('You have already voted on this proposal');
        } else if (errorMsg.includes('voting period')) {
          throw new Error('The voting period for this proposal has ended');
        } else if (errorMsg.includes('not active')) {
          throw new Error('This proposal is not currently active for voting');
        } else if (errorMsg.includes('voting power')) {
          throw new Error('You don\'t have enough voting power. Make sure you have DLOOP tokens in your wallet or delegated to you.');
        }
        throw gasError; // Re-throw if we can't provide a more specific message
      }
      
      // Use the correct function name 'vote' with explicit gas limit to avoid issues
      const tx = await assetDAO.vote(proposalId, support, {
        gasLimit: 300000 // Set a reasonable gas limit
      });
      
      return await tx.wait();
    } catch (error: any) {
      console.error('Error voting on proposal:', error);
      
      // Provide more specific error messages for common issues
      if (error.message?.includes('execution reverted')) {
        if (error.message.includes('already voted')) {
          throw new Error('You have already voted on this proposal');
        } else if (error.message.includes('voting period')) {
          throw new Error('The voting period for this proposal has ended');
        } else if (error.message.includes('delegated tokens') || error.message.includes('voting power')) {
          throw new Error('You need DLOOP tokens to vote. You can use tokens in your wallet or have tokens delegated to you.');
        } else {
          // Generic execution revert with more helpful message
          throw new Error('Transaction failed: You may not have enough DLOOP tokens or the voting period has ended.');
        }
      }
      
      throw this.handleContractError(error);
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
  ) {
    try {
      const assetDAO = getContract('AssetDAO', provider);
      const hasVoted = await assetDAO.hasVoted(proposalId, voterAddress);
      
      if (hasVoted) {
        const support = await assetDAO.getVoterSupport(proposalId, voterAddress);
        const weight = await assetDAO.getVoteWeight(proposalId, voterAddress);
        
        return {
          hasVoted,
          support,
          weight: ethers.formatEther(weight)
        };
      }
      
      return { hasVoted: false, support: false, weight: '0' };
    } catch (error) {
      console.error('Error checking voting status:', error);
      throw this.handleContractError(error);
    }
  },
  
  /**
   * Execute a proposal
   * @param signer The ethers signer
   * @param proposalId The ID of the proposal to execute
   * @returns Transaction receipt
   */
  async executeProposal(signer: ethers.JsonRpcSigner, proposalId: number) {
    try {
      const assetDAO = getContract('AssetDAO', signer);
      
      // Check if the proposal can be executed
      const canBeExecuted = await assetDAO.canBeExecuted(proposalId);
      if (!canBeExecuted) {
        throw new Error('Proposal cannot be executed yet');
      }
      
      const tx = await assetDAO.executeProposal(proposalId);
      return await tx.wait();
    } catch (error) {
      console.error('Error executing proposal:', error);
      throw this.handleContractError(error);
    }
  },
  
  /**
   * Cancel a proposal
   * @param signer The ethers signer
   * @param proposalId The ID of the proposal to cancel
   * @returns Transaction receipt
   */
  async cancelProposal(signer: ethers.JsonRpcSigner, proposalId: number) {
    try {
      const assetDAO = getContract('AssetDAO', signer);
      const tx = await assetDAO.cancelProposal(proposalId);
      return await tx.wait();
    } catch (error) {
      console.error('Error canceling proposal:', error);
      throw this.handleContractError(error);
    }
  },
  
  /**
   * Get all proposals
   * @param provider The ethers provider
   * @returns Array of proposals
   */
  async getAllProposals(provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner) {
    try {
      const assetDAO = getContract('AssetDAO', provider);
      const count = await assetDAO.getProposalCount();
      
      const proposals = [];
      for (let i = 1; i <= count; i++) {
        try {
          const proposal = await this.getProposalDetails(provider, i);
          proposals.push(proposal);
        } catch (error) {
          console.error(`Error fetching proposal ${i}:`, error);
          // Continue with other proposals even if one fails
        }
      }
      
      return proposals;
    } catch (error) {
      console.error('Error fetching all proposals:', error);
      throw this.handleContractError(error);
    }
  },
  
  /**
   * Handle contract errors with descriptive messages
   * @param error The contract error
   * @returns Formatted error with descriptive message
   */
  handleContractError(error: any): Error {
    const errorMessage = error?.message || '';
    
    // Check for known error types from the integration guide
    if (errorMessage.includes('ZeroAddress')) {
      return new Error('Invalid address provided. Please check the token address.');
    } else if (errorMessage.includes('InvalidAmount')) {
      return new Error('Invalid amount specified. Amount must be greater than zero.');
    } else if (errorMessage.includes('Unauthorized')) {
      return new Error('You do not have permission to perform this action.');
    } else if (errorMessage.includes('ProposalNotFound')) {
      return new Error('This proposal does not exist.');
    } else if (errorMessage.includes('ProposalAlreadyExecuted')) {
      return new Error('This proposal has already been executed.');
    }
    
    // Return original error for unknown cases
    return new Error(`Transaction error: ${errorMessage}`);
  }
};
