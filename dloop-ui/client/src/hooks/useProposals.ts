import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useWallet } from '@/hooks/useWallet';
import { useEthers } from '@/contexts/EthersContext';
import { getContract } from '@/lib/contracts';
import { useToast } from '@/hooks/use-toast';
import { Proposal, CreateProposalParams } from '@/types';
import { timeRemaining } from '@/lib/utils';
import { AssetDAOService, ProposalState, ProposalType } from '@/services/assetDaoService';
import { handleAssetDAOError } from '@/lib/contractErrorHandler';

export const useProposals = () => {
  const { signer, isConnected } = useWallet();
  const { provider, signer: ethersSigner } = useEthers();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch Protocol metrics
  const { data: protocolMetrics } = useQuery({
    queryKey: ['protocol-metrics'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/protocol/metrics');
        if (!response.ok) {
          throw new Error('Failed to fetch protocol metrics');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching protocol metrics:', error);
        return null;
      }
    },
    enabled: true,
    staleTime: 60 * 1000, // 1 minute
  });
  
  // Fetch Protocol DAO proposals
  const { data: protocolProposals, isLoading: protocolLoading, error: protocolError } = useQuery({
    queryKey: ['protocol-dao-proposals'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/protocol/proposals');
        if (!response.ok) {
          throw new Error('Failed to fetch protocol proposals');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching protocol proposals:', error);
        return [];
      }
    },
    enabled: true,
    staleTime: 60 * 1000, // 1 minute
  });

  // Fetch Asset DAO proposals using the enhanced service
  const { data: proposals, isLoading, error, refetch: refetchProposals } = useQuery({
    queryKey: ['asset-dao-proposals'],
    queryFn: async () => {
      if (!provider) return [];
      try {
        // Get all proposals using the service
        // Handle provider type safely
        let apiProvider: ethers.JsonRpcProvider | ethers.JsonRpcSigner;
        if (provider instanceof ethers.JsonRpcProvider) {
          apiProvider = provider;
        } else if (provider instanceof ethers.BrowserProvider) {
          try {
            apiProvider = await provider.getSigner().catch(() => {
              // Fallback to a new provider if signer isn't available
              return new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/');
            });
          } catch (e) {
            // Last resort fallback
            apiProvider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/');
          }
        } else {
          // Default case - likely won't happen but provides a fallback
          apiProvider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/');
        }
        
        // Transform the data to match the expected format in the UI
        const proposalData = await AssetDAOService.getAllProposals(apiProvider);
        const formattedProposals = proposalData.map((p: any) => {
          // Get proposal state name
          const getStateDescription = (state: number) => {
            const stateNames = ['Pending', 'Active', 'Succeeded', 'Defeated', 'Executed', 'Canceled', 'Expired'];
            return stateNames[state] || 'Unknown';
          };
          
          // Map proposal state to UI status
          const getStatusFromState = (state: number): 'active' | 'passed' | 'failed' | 'executed' => {
            // According to the enum in assetDaoService.ts:
            // Pending = 0, Active = 1, Defeated = 2, Succeeded = 3, Queued = 4, Executed = 5, Expired = 6
            switch (state) {
              case ProposalState.Active: // 1
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
                return 'active'; // Default status
            }
          };
          
          // Get proposal type name
          const getTypeDescription = (type: number) => {
            if (type === ProposalType.Investment) return 'invest';
            if (type === ProposalType.Divestment) return 'divest';
            if (type === ProposalType.ParameterChange) return 'parameter-change';
            return 'other';
          };
          
          // Check for manually canceled proposals
          // Note: There's no Canceled state in the enum, so this might be a custom flag in the proposal data
          const isCanceled = Boolean(p.canceled);
          
          // Helper function to safely format amounts
          const safeFormatEther = (value: any) => {
            try {
              // Ensure the value is a proper BigInt-convertible value (remove decimal if present)
              if (typeof value === 'string' && value.includes('.')) {
                value = value.split('.')[0]; // Take just the integer part
              }
              return ethers.formatEther(value);
            } catch (e) {
              console.warn('Error formatting ether value:', e, value);
              return '0';
            }
          };
          
          return {
            id: p.id,
            title: p.description?.split('\n')[0] || `Proposal ${p.id}`,
            description: p.description || '',
            proposer: p.proposer,
            createdAt: p.createdAt instanceof Date ? p.createdAt.getTime() : 0,
            endTime: p.votingEnds instanceof Date ? p.votingEnds.getTime() : 0,
            forVotes: parseFloat(safeFormatEther(p.forVotes)),
            againstVotes: parseFloat(safeFormatEther(p.againstVotes)),
            executed: p.state === ProposalState.Executed,
            canceled: isCanceled,
            status: getStatusFromState(p.state), // Add the status property for UI display
            state: getStateDescription(p.state),
            type: getTypeDescription(p.type),
            amount: parseFloat(safeFormatEther(p.amount)),
            token: p.token,
            endsIn: p.votingEnds instanceof Date ? timeRemaining(p.votingEnds.getTime()) : '',
          };
        });
        
        return formattedProposals;
      } catch (error) {
        console.error('Error fetching proposals:', error);
        return [];
      }
    },
    enabled: !!provider,
    staleTime: 60 * 1000,
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

  // Define supported tokens with their Sepolia testnet addresses
  const supportedTokens = [
    { symbol: "DLOOP", address: "0x05B366778566e93abfB8e4A9B794e4ad006446b4" },
    { symbol: "USDC", address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" }, // Sepolia USDC
    { symbol: "WBTC", address: "0xCA063A2AB07491eE991dCecb456D1265f842b568" }  // Sepolia WBTC
  ];

  // Create a new proposal
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
      console.log('Creating proposal with parameters:', params);
      
      // This function is mainly used as a backend service call now
      // The actual blockchain transaction happens in create-proposal-modal.tsx
      // This ensures the UI database stays in sync with blockchain proposals
      
      // Make a backend API call to store the proposal in our database
      const response = await fetch('/api/proposals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
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
        const receipt = await AssetDAOService.voteOnProposal(signer, proposalId, support);
        return { proposalId, success: true, receipt };
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
          const support = await assetDAO.getVoterSupport(proposalId, address);
          return { hasVoted, support };
        } catch (e) {
          console.error('Error getting voter support:', e);
          return { hasVoted, support: false };
        }
      }
      
      return { hasVoted: false, support: false };
    } catch (error) {
      console.error('Error checking vote status:', error);
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
    protocolLoading,
    protocolError,
    protocolMetrics,
    error: error || protocolError,
    voteOnProtocolProposal,
    executeProtocolProposal,
  };
};