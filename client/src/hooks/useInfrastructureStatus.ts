import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export interface InfrastructureStatus {
  isInfuraConnected: boolean;
  isWalletConnectConfigured: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to check the status of infrastructure services needed by the D-Loop frontend
 */
export function useInfrastructureStatus(): InfrastructureStatus {
  const [isInfuraConnected, setIsInfuraConnected] = useState<boolean>(false);
  const [isWalletConnectConfigured, setIsWalletConnectConfigured] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkInfrastructure() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch API configuration
        const response = await fetch('/api/config');
        
        if (!response.ok) {
          throw new Error(`API config request failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if we have a valid Infura API key
        if (!data.infuraApiKey) {
          setIsInfuraConnected(false);
          setError('Missing Infura API key. Please contact the administrator to provide a valid API key.');
        } else {
          // Validate Infura key format (standard length for API keys)
          if (data.infuraApiKey && data.infuraApiKey.length > 10) {
            setIsInfuraConnected(true);
            
            // Save to localStorage for use in other components
            localStorage.setItem('infura_api_key', data.infuraApiKey);
            
            // Additional validation: Try a simple test request
            try {
              // Using ethers to create a provider with the Infura API key
              const provider = new ethers.InfuraProvider('sepolia', data.infuraApiKey);
              // Simple test to get the current block number
              await provider.getBlockNumber();
              // If we get here, the Infura API key is working
              setIsInfuraConnected(true);
            } catch (infuraError) {
              console.error('Infura connection test failed:', infuraError);
              setIsInfuraConnected(false);
              setError(`Infura API key validation failed: ${infuraError instanceof Error ? infuraError.message : 'Unknown error'}`);
            }
          } else {
            setIsInfuraConnected(false);
            setError('Invalid Infura API key format. Please contact the administrator to provide a valid API key.');
          }
        }
        
        // Check if we have a valid WalletConnect project ID
        if (!data.walletConnectProjectId) {
          setIsWalletConnectConfigured(false);
          // Only set error if Infura is working but WalletConnect isn't
          if (isInfuraConnected && !error) {
            setError('Missing WalletConnect Project ID. Please contact the administrator to provide a valid Project ID.');
          }
        } else if (data.walletConnectProjectId.length < 10) {
          setIsWalletConnectConfigured(false);
          // Only set error if Infura is working but WalletConnect isn't
          if (isInfuraConnected && !error) {
            setError('Invalid WalletConnect Project ID format. Please contact the administrator to provide a valid Project ID.');
          }
        } else {
          setIsWalletConnectConfigured(true);
          // Save to localStorage for use in other components
          localStorage.setItem('wallet_connect_project_id', data.walletConnectProjectId);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error checking infrastructure:', err);
        setIsInfuraConnected(false);
        setIsWalletConnectConfigured(false);
        setError(err instanceof Error ? 
          `API Configuration Error: ${err.message}` : 
          'Unknown error retrieving API configuration');
        setIsLoading(false);
      }
    }

    checkInfrastructure();
  }, []);

  return {
    isInfuraConnected,
    isWalletConnectConfigured,
    isLoading,
    error
  };
}