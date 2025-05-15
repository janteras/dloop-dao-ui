import { useState, useEffect } from 'react';

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
        const data = await response.json();
        
        // Check if we have a valid Infura API key
        if (!data.infuraApiKey) {
          setIsInfuraConnected(false);
          setError('Missing Infura API key');
        } else {
          // Simply assume Infura key is valid if it has a reasonable length
          // This avoids CORS issues with making direct requests to Infura
          if (data.infuraApiKey && data.infuraApiKey.length > 10) {
            setIsInfuraConnected(true);
            
            // Save to localStorage for use in web3modal-provider
            localStorage.setItem('infura_api_key', data.infuraApiKey);
          } else {
            setIsInfuraConnected(false);
            setError('Invalid Infura API key');
          }
        }
        
        // Check if we have a valid WalletConnect project ID
        if (!data.walletConnectProjectId) {
          setIsWalletConnectConfigured(false);
        } else {
          setIsWalletConnectConfigured(true);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error checking infrastructure:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
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