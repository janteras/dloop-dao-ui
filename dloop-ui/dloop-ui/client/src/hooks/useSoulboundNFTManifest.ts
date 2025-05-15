import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@/hooks/useWallet';
import { soulboundNftManifestService, StructuredToken } from '@/services/soulboundNftManifestService';

/**
 * Custom hook to access SoulboundNFT manifest and token data
 */
export function useSoulboundNFTManifest() {
  const { provider, isConnected } = useWallet();

  // Fetch the manifest information
  const { 
    data: manifestInfo,
    isLoading: isManifestLoading,
    error: manifestError
  } = useQuery({
    queryKey: ['soulboundNFT', 'manifest'],
    queryFn: async () => {
      const manifest = await soulboundNftManifestService.fetchManifest();
      return soulboundNftManifestService.getManifestInfo();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch all tokens with metadata
  const {
    data: tokens,
    isLoading: isTokensLoading,
    error: tokensError,
    refetch: refetchTokens
  } = useQuery({
    queryKey: ['soulboundNFT', 'tokens', isConnected],
    queryFn: async () => {
      return soulboundNftManifestService.getAllTokens(isConnected ? provider : undefined);
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !!manifestInfo, // Only fetch tokens when manifest is available
  });

  // Function to get a specific token by ID
  const getTokenById = async (id: number): Promise<StructuredToken | null> => {
    return soulboundNftManifestService.getTokenById(id, isConnected ? provider : undefined);
  };

  return {
    manifestInfo,
    tokens,
    isLoading: isManifestLoading || isTokensLoading,
    error: manifestError || tokensError,
    getTokenById,
    refetchTokens
  };
}
