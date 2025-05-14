import { useQuery } from '@tanstack/react-query';
import { soulboundNftService, TokenDetails } from '@/services/soulboundNftService';
import { useWallet } from '@/hooks/useWallet';

/**
 * Hook for interacting with Soulbound NFTs
 */
export function useSoulboundNFTs() {
  const { provider } = useWallet();

  // Query to get all 10 AI Node NFTs
  const {
    data: allNFTs,
    isLoading: isLoadingAllNFTs,
    error: allNFTsError,
    refetch: refetchAllNFTs,
  } = useQuery<TokenDetails[]>({
    queryKey: ['soulboundNfts', 'all'],
    queryFn: async () => soulboundNftService.getAllAINodeNFTs(provider),
    enabled: !!provider,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query to get NFTs owned by the connected wallet
  const { address } = useWallet();
  const {
    data: ownedNFTs,
    isLoading: isLoadingOwnedNFTs,
    error: ownedNFTsError,
    refetch: refetchOwnedNFTs,
  } = useQuery<TokenDetails[]>({
    queryKey: ['soulboundNfts', 'owned', address],
    queryFn: async () => {
      if (!address) return [];
      return soulboundNftService.getTokensByOwner(address, provider);
    },
    enabled: !!provider && !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if the connected wallet has a valid token
  const {
    data: hasValidToken,
    isLoading: isCheckingValidToken,
    error: validTokenError,
  } = useQuery<boolean>({
    queryKey: ['soulboundNfts', 'valid', address],
    queryFn: async () => {
      if (!address) return false;
      return soulboundNftService.hasValidToken(address, provider);
    },
    enabled: !!provider && !!address,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    // All NFTs
    allNFTs: allNFTs || [],
    isLoadingAllNFTs,
    allNFTsError,
    refetchAllNFTs,

    // Owned NFTs
    ownedNFTs: ownedNFTs || [],
    isLoadingOwnedNFTs,
    ownedNFTsError,
    refetchOwnedNFTs,

    // Valid token check
    hasValidToken: hasValidToken || false,
    isCheckingValidToken,
    validTokenError,
  };
}
