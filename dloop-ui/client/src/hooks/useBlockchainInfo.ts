import { useState, useEffect } from 'react';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';

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

        // Get gas price
        console.log('Fetching gas price...');
        try {
          const currentGasPrice = await provider.getFeeData();
          if (currentGasPrice && currentGasPrice.gasPrice) {
            // Convert from wei to gwei for readability
            const gasPriceInGwei = Number(currentGasPrice.gasPrice) / 1e9;
            console.log('Gas price:', gasPriceInGwei.toFixed(2), 'Gwei');
            setGasPrice(`${gasPriceInGwei.toFixed(2)} Gwei`);
          }
        } catch (feeError) {
          // Try fallback method if getFeeData fails (e.g., with MetaMask on certain networks)
          try {
            // @ts-ignore - using any to bypass type checking for deprecated method
            const legacyGasPrice = await provider.getGasPrice();
            if (legacyGasPrice) {
              const gasPriceInGwei = Number(legacyGasPrice) / 1e9;
              console.log('Gas price (legacy method):', gasPriceInGwei.toFixed(2), 'Gwei');
              setGasPrice(`${gasPriceInGwei.toFixed(2)} Gwei`);
            }
          } catch (legacyError) {
            console.warn('Failed to get gas price using both modern and legacy methods', legacyError);
            setGasPrice('Not available');
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