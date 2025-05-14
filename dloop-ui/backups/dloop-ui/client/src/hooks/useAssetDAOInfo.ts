import { useState, useEffect } from 'react';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { getReadOnlyContract, getContractAddress } from '@/lib/contracts';
import { ethers } from 'ethers';
import { contracts } from '@/config/contracts';

interface AssetDAOInfo {
  proposalCount: number | null;
  governanceTokenAddress: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch basic AssetDAO contract information from Sepolia testnet
 * This serves as a test to verify our contract integration is working properly
 */
export function useAssetDAOInfo(): AssetDAOInfo {
  const { provider } = useWallet();
  const [proposalCount, setProposalCount] = useState<number | null>(null);
  const [governanceTokenAddress, setGovernanceTokenAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssetDAOInfo() {
      if (!provider) {
        setError('Provider not available');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const assetDaoAddress = getContractAddress('AssetDAO');
        console.log('Getting AssetDAO contract with address:', assetDaoAddress);
        
        // Create a direct contract instance with the minimal ABI needed
        const minimalAbi = [
          "function getProposalCount() view returns (uint256)",
          "function governanceToken() view returns (address)"
        ];
        
        const assetDaoContract = new ethers.Contract(
          assetDaoAddress,
          minimalAbi,
          provider
        );
        
        console.log('AssetDAO contract instance created');
        
        let localCount = null;
        let localTokenAddress = null;
        
        // Try to get proposal count
        try {
          console.log('Fetching proposal count...');
          const count = await assetDaoContract.getProposalCount();
          console.log('Proposal count:', Number(count));
          localCount = Number(count);
          setProposalCount(localCount);
        } catch (countError) {
          console.error('Error fetching proposal count:', countError);
          // Don't set global error here, try to get other info
        }
        
        // Try to get governance token address
        try {
          console.log('Fetching governance token address...');
          const tokenAddress = await assetDaoContract.governanceToken();
          console.log('Governance token address:', tokenAddress);
          localTokenAddress = tokenAddress;
          setGovernanceTokenAddress(localTokenAddress);
        } catch (tokenError) {
          console.error('Error fetching governance token:', tokenError);
          // Don't set global error here
        }
        
        // If both failed, set a descriptive error
        if (localCount === null && localTokenAddress === null) {
          setError('Unable to retrieve any data from the AssetDAO contract. The contract might not be deployed correctly or the ABI might be incorrect.');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching AssetDAO info:', err);
        setError('Failed to connect to the AssetDAO contract: ' + (err instanceof Error ? err.message : 'Unknown error'));
        setIsLoading(false);
      }
    }

    fetchAssetDAOInfo();
  }, [provider]);

  return {
    proposalCount,
    governanceTokenAddress,
    isLoading,
    error
  };
}