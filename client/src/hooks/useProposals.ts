import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useWallet } from '@/hooks/useWallet';
import { useEthers } from '@/contexts/EthersContext';
import { getContract } from '@/lib/contracts';
import { useToast } from '@/hooks/useToast';
import { Proposal, CreateProposalParams } from '@/types';
import { timeRemaining } from '@/lib/utils';
import { EnhancedAssetDAOService, ProposalState, ProposalType } from '@/services/enhanced-assetDaoService';
import { handleAssetDAOError } from '@/lib/contractErrorHandler';
import { fetchAPI } from '@/lib/api-utils';
import { mapContractTypeToUI, mapUITypeToContract } from '@/lib/proposalTypeMapping';
import { formatDistanceToNow } from 'date-fns';

/**
 * @hook useProposals
 * @description A comprehensive hook for managing AssetDAO and ProtocolDAO proposals.
 * This hook provides functionality for:
 * - Fetching all proposals from the AssetDAO and ProtocolDAO
 * - Creating new proposals
 * - Voting on proposals
 * - Executing proposals
 * - Monitoring proposal status changes via blockchain events
 * 
 * It handles proper type conversions between UI and contract representations,
 * error handling, and user notifications.
 * 
 * @returns {Object} An object containing proposal data and management functions
 * @property {Proposal[]} proposals - Current AssetDAO proposals
 * @property {boolean} isLoading - Loading state for AssetDAO proposals
 * @property {Error|null} error - Error state for AssetDAO proposals fetch
 * @property {Function} createProposal - Function to create a new proposal
 * @property {Function} voteOnProposal - Function to vote on a proposal
 * @property {Function} executeProposal - Function to execute a passed proposal
 * @property {Function} refetchProposals - Function to manually refresh proposals
 */
export const useProposals = () => {
  const { signer, isConnected } = useWallet();
  const { provider, signer: ethersSigner } = useEthers();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Fetches protocol metrics from the API
   * - Contains information about total value locked, token stats, and other metrics
   */
  const { data: protocolMetrics, error: metricsError } = useQuery({
    queryKey: ['protocol-metrics'],
    queryFn: async () => {
      console.log('Fetching protocol metrics...');
      try {
        return await fetchAPI('/.netlify/functions/protocol-metrics');
      } catch (error) {
        console.error('Error fetching protocol metrics:', error);
        // Return fallback data in development
        if (process.env.NODE_ENV === 'development') {
          return {
            totalProposals: 85,
            activeProposals: 5,
            totalValueLocked: "1250000",
            governanceTokenSupply: "10000000"
          };
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2
  });

  /**
   * Fetches Protocol DAO proposals from the API
   * - These are governance proposals for the overall protocol
   * - Separate from AssetDAO proposals which focus on investment decisions
   */
  const { data: protocolProposals, error: proposalsError } = useQuery({
    queryKey: ['protocol-proposals'],
    queryFn: async () => {
      console.log('Fetching protocol proposals...');
      try {
        return await fetchAPI('/.netlify/functions/protocol-proposals');
      } catch (error) {
        console.error('Error fetching protocol proposals:', error);
        // Return fallback data in development
        if (process.env.NODE_ENV === 'development') {
          return { proposals: [], total: 0 };
        }
        throw error;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 2
  });

  /**
   * Fetches AssetDAO proposals directly from the blockchain
   * - Uses the EnhancedAssetDAOService with proper ABI handling
   * - Handles contract data consistency issues
   * - Proper error handling and fallback mechanisms
   */
  const { data: proposals, isLoading, error, refetch: refetchProposals } = useQuery({
    queryKey: ['asset-dao-proposals'],
    queryFn: async () => {
      if (!provider) {
        console.warn('No provider available for proposals fetch');
        return [];
      }

      try {
        console.log('🔍 Fetching AssetDAO proposals...');

        // Handle provider type safely with improved error handling
        let apiProvider: ethers.JsonRpcProvider | ethers.JsonRpcSigner;

        if (provider instanceof ethers.JsonRpcProvider) {
          apiProvider = provider;
        } else if (provider instanceof ethers.BrowserProvider) {
          // Use wallet context signer if available and connected, otherwise use provider for read-only
          if (isConnected && signer) {
            console.log('✅ Using connected wallet signer for proposals');
            apiProvider = signer;
          } else {
            console.log('📖 Using read-only provider for proposals');
            apiProvider = provider;
          }
        } else {
          // Fallback to a reliable read-only provider
          apiProvider = signer || new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/ca485bd6567e4c5fb5693ee66a5885d8');
        }

        // Run contract diagnostics first to identify issues
        const diagnostics = await EnhancedAssetDAOService.runContractDiagnostics(apiProvider);

        if (!diagnostics.contractAccessible) {
          console.error('❌ AssetDAO contract not accessible:', diagnostics.errors);
          throw new Error(`Contract not accessible: ${diagnostics.errors.join(', ')}`);
        }

        if (!diagnostics.proposalCountWorking) {
          console.error('❌ getProposalCount method failing:', diagnostics.errors);
          throw new Error('Contract getProposalCount method is failing');
        }

        // Fetch proposals using enhanced service with proper error handling
        const contractProposals = await EnhancedAssetDAOService.getAllProposals(apiProvider);
        console.log(`✅ Fetched ${contractProposals.length} proposals from contract`);

        // Transform contract data to UI format with consistent field mapping
        const formattedProposals = contractProposals.map((p: ProposalDetails) => {
          // Helper function to safely format BigNumber amounts (Ethers v6 compatible)
          const safeFormatEther = (value: bigint | string | number) => {
            try {
              // Handle bigint (Ethers v6 native type)
              if (typeof value === 'bigint') {
                return ethers.formatEther(value);
              }
              // Handle string values
              else if (typeof value === 'string') {
                // Handle string values that might already be formatted
                if (value.includes('.')) {
                  return value;
                }
                return ethers.formatEther(value);
              }
              // Handle number values
              else if (typeof value === 'number') {
                return ethers.formatEther(value.toString());
              }
              // Fallback for any other type
              else {
                return ethers.formatEther(value.toString());
              }
            } catch (e) {
              console.warn('Error formatting ether value:', e, value);
              return '0';
            }
          };

          // Map proposal state to UI status with consistent logic
          const getUIStatus = (state: number, endTime: Date, executed: boolean, canceled: boolean): 'active' | 'passed' | 'failed' | 'executed' => {
            if (executed) return 'executed';
            if (canceled) return 'failed';

            const now = new Date();
            const hasEnded = endTime < now;

            switch (state) {
              case ProposalState.Active: // 1
                return hasEnded ? 'failed' : 'active';
              case ProposalState.Pending: // 0
                return 'active';
              case ProposalState.Succeeded: // 3
              case ProposalState.Queued: // 4
                return 'passed';
              case ProposalState.Defeated: // 2
              case ProposalState.Expired: // 6
                return 'failed';
              case ProposalState.Executed: // 5
                return 'executed';
              default:
                // Fallback based on voting results
                if (hasEnded) {
                  const forVotes = parseFloat(safeFormatEther(p.forVotes));
                  const againstVotes = parseFloat(safeFormatEther(p.againstVotes));
                  return forVotes > againstVotes ? 'passed' : 'failed';
                }
                return 'active';
            }
          };

          // Find token info for contract address mapping
          const tokenInfo = supportedTokens.find(t => t.symbol === p.token);

          return {
            id: p.id,
            title: p.description?.split('\n')[0] || `Proposal ${p.id}`,
            description: p.description || '',
            proposer: p.proposer,
            createdAt: p.createdAt.getTime(),
            endTime: p.votingEnds.getTime(),
            forVotes: parseFloat(safeFormatEther(p.forVotes)),
            againstVotes: parseFloat(safeFormatEther(p.againstVotes)),
            executed: p.executed,
            canceled: p.canceled,
            status: getUIStatus(p.state, p.votingEnds, p.executed, p.canceled),
            state: ['Pending', 'Active', 'Defeated', 'Succeeded', 'Queued', 'Executed', 'Expired'][p.state] || 'Unknown',
            type: p.type,
            amount: typeof p.amount === 'string' ? parseFloat(p.amount) : parseFloat(safeFormatEther(p.amount)),
            token: p.token,
            endsIn: timeRemaining(p.votingEnds.getTime()),
            contractAddress: tokenInfo?.address,
          };
        });

        console.log(`✅ Successfully transformed ${formattedProposals.length} proposals for UI`);
        return formattedProposals;

      } catch (error) {
        console.error('❌ Critical error fetching proposals:', error);

        // Enhanced error handling with specific error types
        if (error instanceof Error) {
          if (error.message.includes('network')) {
            throw new Error('Network connection failed. Please check your internet connection and try again.');
          } else if (error.message.includes('Contract not accessible')) {
            throw new Error('AssetDAO contract is not accessible. The contract may be down or the network may be experiencing issues.');
          } else if (error.message.includes('getProposalCount')) {
            throw new Error('Contract method getProposalCount is failing. This may indicate an ABI mismatch or contract deployment issue.');
          }
        }

        // Return empty array for graceful degradation
        return [];
      }
    },
    enabled: !!provider,
    staleTime: 60 * 1000,
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors, but not for contract errors
      if (failureCount >= 3) return false;
      return !error.message.includes('Contract') && !error.message.includes('ABI');
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Live subscription for new proposals
  const queryClient = useQueryClient();
  const useEffect = useCallback(() => {
    if (!provider) return;
    const assetDAO = getContract('AssetDAO', provider);
    const onCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['asset-dao-proposals'] });
    };
    assetDAO.on('ProposalCreated', onCreated);
    return () => { assetDAO.off('ProposalCreated', onCreated); };
  }, [provider, queryClient]);

  /**
   * Supported tokens configuration with their Sepolia testnet addresses
   * Used for resolving token information throughout the application
   */
  const supportedTokens = [
    { symbol: "DLOOP", address: "0x05B366778566e93abfB8e4A9B794e4ad006446b4" },
    { symbol: "USDC", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" }, // Sepolia USDC
    { symbol: "WBTC", address: "0xCA063A2AB07491eE991dCecb456D1265f842b568" }  // Sepolia WBTC
  ];

  /**
   * Creates a new proposal in the AssetDAO
   * @param {CreateProposalParams} params - The proposal parameters
   * @returns {Promise<boolean>} - Success indicator
   */
  const createProposal = async (params: CreateProposalParams) => {
    if (!signer || !isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Map the UI proposal type to the contract enum value
      const contractProposalType = mapUITypeToContract(params.type);
      console.log('Creating proposal with parameters:', params);
      console.log('Mapped UI type', params.type, 'to contract type', contractProposalType);

      // This function is mainly used as a backend service call now
      // The actual blockchain transaction happens in create-proposal-modal.tsx
      // This ensures the UI database stays in sync with blockchain proposals

      // Make a backend API call to store the proposal in our database
      // Include mapped contractProposalType with the request
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          contractProposalType // Include the mapped contract type
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create proposal in database');
      }

      toast({
        title: 'Proposal Recorded',
        description: 'Your proposal has been recorded in our database.',
      });

      // Refetch proposals to update the UI
      queryClient.invalidateQueries({ queryKey: ['asset-dao-proposals'] });

      return true;
    } catch (error: any) {
      console.error('Error creating proposal in database:', error);
      toast({
        title: 'Proposal Recording Failed',
        description: error.message || 'There was an error recording your proposal. Please try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vote on a proposal using the enhanced service
  const voteOnProposal = useMutation({
    mutationFn: async ({ proposalId, support }: { proposalId: number, support: boolean }) => {
      if (!signer || !isConnected) {
        throw new Error('Please connect your wallet first.');
      }

      try {
        // Use the service to vote on the proposal
        const tx = await EnhancedAssetDAOService.voteOnProposal(signer, proposalId, support);
        return { proposalId, success: true, receipt: tx };
      } catch (error) {
        // Use the error handler to get a user-friendly error message
        const errorMsg = handleAssetDAOError(error);
        throw new Error(errorMsg);
      }
    },
    onSuccess: () => {
      toast({
        title: 'Vote Cast',
        description: 'Your vote has been cast successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['asset-dao-proposals'] });
      return true;
    },
    onError: (error: Error) => {
      toast({
        title: 'Vote Failed',
        description: error.message || 'There was an error casting your vote. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Execute a proposal
  const executeProposal = useMutation({
    mutationFn: async (proposalId: number) => {
      if (!signer || !isConnected) {
        throw new Error('Please connect your wallet first.');
      }

      const assetDAO = getContract('AssetDAO', signer);
      const tx = await assetDAO.executeProposal(proposalId);
      await tx.wait();

      return { proposalId, success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Proposal Executed',
        description: 'The proposal has been executed successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['asset-dao-proposals'] });
      return true;
    },
    onError: (error: Error) => {
      toast({
        title: 'Execution Failed',
        description: error.message || 'There was an error executing the proposal. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Cancel a proposal
  const cancelProposal = useMutation({
    mutationFn: async (proposalId: number) => {
      if (!signer || !isConnected) {
        throw new Error('Please connect your wallet first.');
      }

      const assetDAO = getContract('AssetDAO', signer);
      const tx = await assetDAO.cancelProposal(proposalId);
      await tx.wait();

      return { proposalId, success: true };
    },
    onSuccess: () => {
      toast({
        title: 'Proposal Canceled',
        description: 'The proposal has been canceled successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['asset-dao-proposals'] });
      return true;
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation Failed',
        description: error.message || 'There was an error canceling the proposal. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const getProposalStatus = useCallback((proposal: any): Proposal['status'] => {
    if (proposal.executed) return 'executed';
    if (proposal.canceled) return 'failed';

    const now = Date.now();
    const endTime = proposal.votingEnds.toNumber() * 1000;

    if (now < endTime) return 'active';

    const forVotes = parseFloat(ethers.formatEther(proposal.forVotes));
    const againstVotes = parseFloat(ethers.formatEther(proposal.againstVotes));

    return forVotes > againstVotes ? 'passed' : 'failed';
  }, []);

  // Protocol DAO proposal voting (mock implementation, would use contract in production)
  const voteOnProtocolProposal = async (proposalId: number, support: boolean) => {
    if (!signer || !isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return { success: false };
    }

    try {
      // In a real implementation, would call contract method
      // const protocolDAO = getContract('ProtocolDAO', signer);
      // const tx = await protocolDAO.castVote(proposalId, support);
      // await tx.wait();

      // Mock successful vote
      toast({
        title: 'Vote Cast',
        description: 'Your vote has been cast successfully on protocol proposal.',
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error voting on protocol proposal:', error);
      toast({
        title: 'Vote Failed',
        description: error.message || 'There was an error casting your vote. Please try again.',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  // Protocol DAO proposal execution (mock implementation, would use contract in production)
  const executeProtocolProposal = async (proposalId: number) => {
    if (!signer || !isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return { success: false };
    }

    try {
      // In a real implementation, would call contract method
      // const protocolDAO = getContract('ProtocolDAO', signer);
      // const tx = await protocolDAO.executeProposal(proposalId);
      // await tx.wait();

      // Mock successful execution
      toast({
        title: 'Proposal Executed',
        description: 'The protocol proposal has been executed successfully.',
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error executing protocol proposal:', error);
      toast({
        title: 'Execution Failed',
        description: error.message || 'There was an error executing the proposal. Please try again.',
        variant: 'destructive',
      });
      return { success: false };
    }
  };

  // Check if a user has voted on a proposal
  const checkUserVote = async (proposalId: number, address: string) => {
    if (!provider || !address) return null;
    try {
      // Convert provider to appropriate type for the service
      let apiProvider;
      if (provider instanceof ethers.BrowserProvider) {
        try {
          apiProvider = await provider.getSigner();
        } catch {
          // Fallback to JsonRpcProvider with default URL if we can't get a signer
          apiProvider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/');
        }
      } else {
        apiProvider = provider;
      }

      const assetDAO = getContract('AssetDAO', apiProvider);
      const hasVoted = await assetDAO.hasVoted(proposalId, address);

      if (hasVoted) {
        try {
          // Try different methods to get vote support data
          let support;
          try {
            support = await assetDAO.getVoterSupport(proposalId, address);
          } catch (e) {
            // Fallback: try to get support from vote receipts
            try {
              const receipt = await assetDAO.getReceipt(proposalId, address);
              support = receipt.support;
            } catch (e2) {
              // Last fallback: check vote events
              const filter = assetDAO.filters.VoteCast(proposalId, address);
              const events = await assetDAO.queryFilter(filter);
              if (events.length > 0) {
                support = events[events.length - 1].args?.support;
              }
            }
          }
          return { hasVoted, support: support !== undefined ? support : null };
        } catch (e) {
          console.error('Error getting voter support:', e);
          return { hasVoted, support: null };
        }
      }

      return { hasVoted: false, support: false };
    } catch (error) {
      console.error('Error checking vote status:', error);
      return null;
    }
  };

  const transformProposal = useCallback((proposal: any): Proposal => {
    const now = new Date().getTime();
    const createdAt = new Date(Number(proposal.createdAt) * 1000).getTime();
    const votingPeriod = 3 * 24 * 60 * 60 * 1000; // 3 days in milliseconds
    const votingEnds = createdAt + votingPeriod;
    const hasVotingEnded = now > votingEnds;

    // Convert vote counts to numbers with proper formatting
    const forVotes = typeof proposal.forVotes === 'string' ? 
      parseFloat(proposal.forVotes) : Number(proposal.forVotes || 0);
    const againstVotes = typeof proposal.againstVotes === 'string' ? 
      parseFloat(proposal.againstVotes) : Number(proposal.againstVotes || 0);
    const totalVotes = forVotes + againstVotes;

    // Quorum requirement: 100,000 DLOOP tokens
    const QUORUM_REQUIREMENT = 100000;

    // Determine status with proper quorum validation
    let status: Proposal['status'];
    let readyToExecute = false;

    if (!hasVotingEnded) {
      status = 'active';
    } else if (proposal.executed) {
      status = 'executed';
    } else if (proposal.canceled) {
      status = 'failed';
    } else {
      // Check if proposal passed: majority vote AND quorum met
      const majorityAchieved = forVotes > againstVotes && forVotes > 0;
      const quorumMet = totalVotes >= QUORUM_REQUIREMENT;

      if (majorityAchieved && quorumMet) {
        status = 'passed';
        readyToExecute = true; // Mark as ready for execution
      } else {
        status = 'failed';
      }
    }

    return {
      id: Number(proposal.id),
      title: proposal.description || `Proposal ${proposal.id}`,
      description: proposal.description || `Proposal ${proposal.id}`,
      type: mapContractTypeToUI(proposal.type, {
        title: proposal.description,
        description: proposal.description
      }) as ProposalType,
      token: proposal.assetAddress || proposal.token || '',
      amount: proposal.amount || '0',
      proposer: proposal.proposer || '',
      createdAt: new Date(Number(proposal.createdAt) * 1000).toISOString(),
      deadline: new Date(votingEnds).toISOString(),
      forVotes: forVotes,
      againstVotes: againstVotes,
      status,
      executed: Boolean(proposal.executed),
      canceled: Boolean(proposal.canceled),
      readyToExecute: readyToExecute, // Add execution readiness flag
      endsIn: hasVotingEnded ? 'Ended' : formatDistanceToNow(new Date(votingEnds), { addSuffix: true }),
      quorumMet: totalVotes >= QUORUM_REQUIREMENT,
      totalVotes: totalVotes
    };
  }, []);

  // Helper function to get signer safely without triggering new requests
  const getSafeProvideSigner = async () => {
    if (!provider || !(provider instanceof ethers.BrowserProvider)) {
      return null;
    }

    try {
      // Use the wallet context connection state instead of making new requests
      if (!isConnected || !signer) {
        console.log('🔍 Wallet not connected or signer unavailable, using read-only mode');
        return null;
      }

      // Return the existing signer from wallet context
      return signer;
    } catch (error: any) {
      console.warn('⚠️ Could not access signer, using read-only mode:', error?.message || error);
      return null;
    }
  };

  return {
    createProposal,
    voteOnProposal: voteOnProposal.mutateAsync,
    executeProposal: executeProposal.mutateAsync,
    cancelProposal: cancelProposal.mutateAsync,
    checkUserVote,
    proposals,
    isLoading,
    isSubmitting,
    refetchProposals,
    protocolProposals,
    protocolLoading: false,
    protocolError: null,
    protocolMetrics,
    error: error || proposalsError,
    voteOnProtocolProposal,
    executeProtocolProposal,
  };
};