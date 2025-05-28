import { useState, useEffect } from 'react';
import { useAppConfig } from '@/config/app-config';
import { formatEther } from 'ethers';
import { formatUnits } from 'viem';
import { useContractRead, useContractWrite } from 'wagmi';
import { useWallet } from '@/hooks/useWallet';
import { useWagmiWallet } from '@/hooks/useWagmiWallet';
import { useFeatureFlag } from '@/config/feature-flags';
import { monitorMigrationHealth } from '@/lib/migration-monitoring';

// ABI for ProposalContract (simplified version)
const proposalContractABI = [
  {
    inputs: [{ internalType: 'uint256', name: 'proposalId', type: 'uint256' }],
    name: 'castVote',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'proposalId', type: 'uint256' },
      { internalType: 'bool', name: 'support', type: 'bool' }
    ],
    name: 'castVote',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

type VoteParams = {
  proposalId: string | number;
  support: boolean;
};

// Helper function to normalize contract addresses
const normalizeAddress = (address: string) => address.toLowerCase();

/**
 * Hook for interacting with proposal voting functionality
 * Provides a unified interface regardless of whether we're using Ethers or Wagmi
 */
export function useProposalVoting(contractAddress?: string) {
  const { useWagmi } = useAppConfig();
  const useWagmiForProposals = useFeatureFlag('useWagmiForProposals');
  const { isConnected: isEthersConnected, address: ethersAddress } = useWallet();
  const { isConnected: isWagmiConnected, address: wagmiAddress } = useWagmiWallet();
  
  const [isVoting, setIsVoting] = useState(false);
  const [lastVoteResult, setLastVoteResult] = useState<{
    success: boolean;
    error?: string;
    txHash?: string;
  } | null>(null);

  // Wagmi implementation for voting
  const { writeAsync: wagmiCastVote } = useContractWrite({
    address: contractAddress as `0x${string}`,
    abi: proposalContractABI,
    functionName: 'castVote',
    enabled: Boolean(contractAddress) && useWagmiForProposals,
  });

  // Function to cast a vote using the appropriate implementation
  const castVote = async ({ proposalId, support }: VoteParams) => {
    setIsVoting(true);
    setLastVoteResult(null);

    try {
      // Use Wagmi if the feature flag is enabled
      if (useWagmi && useWagmiForProposals) {
        if (!isWagmiConnected) {
          throw new Error('Wallet not connected');
        }

        const result = await wagmiCastVote({
          args: [BigInt(proposalId), support],
        });

        setLastVoteResult({
          success: true,
          txHash: result.hash,
        });

        return {
          success: true,
          txHash: result.hash,
        };
      } else {
        // Legacy Ethers implementation
        if (!isEthersConnected) {
          throw new Error('Wallet not connected');
        }

        // This would be your Ethers implementation
        // For demonstration purposes, we'll just simulate success
        const txHash = `0x${Math.random().toString(16).substring(2, 10)}`;
        
        setLastVoteResult({
          success: true,
          txHash,
        });

        return {
          success: true,
          txHash,
        };
      }
    } catch (error) {
      console.error('Error casting vote:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Log migration health metrics
      monitorMigrationHealth({
        component: 'useProposalVoting',
        action: 'castVote',
        isWagmi: useWagmi && useWagmiForProposals,
        error: errorMessage,
        details: {
          proposalId,
          support,
          contractAddress,
        },
      });
      
      setLastVoteResult({
        success: false,
        error: errorMessage,
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsVoting(false);
    }
  };

  return {
    castVote,
    isVoting,
    lastVoteResult,
    isConnected: useWagmi && useWagmiForProposals ? isWagmiConnected : isEthersConnected,
    address: useWagmi && useWagmiForProposals ? wagmiAddress : ethersAddress,
  };
}

/**
 * Hook for fetching proposal information
 */
export function useProposalInfo(contractAddress?: string, proposalId?: string | number) {
  const { useWagmi } = useAppConfig();
  const useWagmiForProposals = useFeatureFlag('useWagmiForProposals');
  
  const [proposalInfo, setProposalInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Wagmi implementation to fetch proposal info
  const { data: wagmiProposalData, isLoading: wagmiIsLoading, error: wagmiError } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: proposalContractABI,
    functionName: 'proposals',
    args: proposalId ? [BigInt(proposalId)] : undefined,
    enabled: Boolean(contractAddress) && Boolean(proposalId) && useWagmiForProposals && useWagmi,
  });

  // Effect to handle Wagmi data
  useEffect(() => {
    if (useWagmi && useWagmiForProposals) {
      if (wagmiProposalData) {
        setProposalInfo(wagmiProposalData);
      }
      setIsLoading(wagmiIsLoading);
      setError(wagmiError?.message || null);
    }
  }, [wagmiProposalData, wagmiIsLoading, wagmiError, useWagmi, useWagmiForProposals]);

  // Effect to handle Ethers data fetching
  useEffect(() => {
    if (!useWagmi || !useWagmiForProposals) {
      const fetchProposalInfo = async () => {
        if (!contractAddress || !proposalId) {
          return;
        }

        setIsLoading(true);
        setError(null);

        try {
          // This would be your Ethers implementation
          // For demonstration purposes, we'll just simulate data
          const mockProposalData = {
            id: proposalId,
            title: `Proposal ${proposalId}`,
            description: 'This is a sample proposal description',
            forVotes: Math.floor(Math.random() * 1000),
            againstVotes: Math.floor(Math.random() * 500),
            status: Math.random() > 0.5 ? 'active' : 'pending',
          };

          setProposalInfo(mockProposalData);
        } catch (error) {
          console.error('Error fetching proposal info:', error);
          
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          setError(errorMessage);
          
          // Log migration health metrics
          monitorMigrationHealth({
            component: 'useProposalInfo',
            action: 'fetchProposalInfo',
            isWagmi: false, // This is Ethers implementation
            error: errorMessage,
            details: {
              proposalId,
              contractAddress,
            },
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchProposalInfo();
    }
  }, [contractAddress, proposalId, useWagmi, useWagmiForProposals]);

  return {
    proposalInfo,
    isLoading,
    error,
    // Helper functions for formatting
    getFormatted: {
      forVotes: () => {
        if (!proposalInfo?.forVotes) return '0';
        return useWagmi && useWagmiForProposals
          ? formatUnits(proposalInfo.forVotes, 18)
          : formatEther(proposalInfo.forVotes);
      },
      againstVotes: () => {
        if (!proposalInfo?.againstVotes) return '0';
        return useWagmi && useWagmiForProposals
          ? formatUnits(proposalInfo.againstVotes, 18)
          : formatEther(proposalInfo.againstVotes);
      },
    },
  };
}
