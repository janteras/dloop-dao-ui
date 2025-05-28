import { useState, useEffect } from 'react';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { ethers } from 'ethers';

interface BlockchainInfo {
  blockNumber: number | null;
  blockTimestamp: string | null;
  gasPrice: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch basic blockchain information from Sepolia testnet
 * This serves as a test to verify our provider connection is working properly
 */
export function useBlockchainInfo(): BlockchainInfo {
  const { provider } = useWallet();
  const [blockNumber, setBlockNumber] = useState<number | null>(null);
  const [blockTimestamp, setBlockTimestamp] = useState<string | null>(null);
  const [gasPrice, setGasPrice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlockchainInfo() {
      if (!provider) {
        console.log('Provider not available in useBlockchainInfo');
        setError('Provider not available');
        setIsLoading(false);
        return;
      }

      console.log('Provider available in useBlockchainInfo, attempting connection');

      try {
        setIsLoading(true);
        setError(null);

        // Get latest block number
        console.log('Fetching latest block number...');
        const latestBlockNumber = await provider.getBlockNumber();
        console.log('Received block number:', latestBlockNumber);
        setBlockNumber(latestBlockNumber);

        // Get latest block
        console.log('Fetching block details...');
        const latestBlock = await provider.getBlock(latestBlockNumber);
        if (latestBlock && latestBlock.timestamp) {
          const timestamp = new Date(Number(latestBlock.timestamp) * 1000).toLocaleString();
          console.log('Block timestamp:', timestamp);
          setBlockTimestamp(timestamp);
        }

        // Get gas price with fallback for unsupported methods
        try {
          const gasPrice = await provider.getFeeData();
          console.log('Gas price:', ethers.formatUnits(gasPrice.gasPrice || '0', 'gwei'), 'Gwei');
        } catch (gasPriceError) {
          console.warn('getFeeData failed, falling back to getGasPrice:', gasPriceError);
          try {
            const gasPrice = await provider.getGasPrice();
            console.log('Gas price (fallback):', ethers.formatUnits(gasPrice, 'gwei'), 'Gwei');
          } catch (fallbackError) {
            console.warn('Both gas price methods failed:', fallbackError);
          }
        }

        console.log('Blockchain info fetched successfully');
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching blockchain info:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    }

    fetchBlockchainInfo();

    // Set up an interval to refresh the data every 15 seconds
    const intervalId = setInterval(fetchBlockchainInfo, 15000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [provider]);

  return {
    blockNumber,
    blockTimestamp,
    gasPrice,
    isLoading,
    error
  };
}