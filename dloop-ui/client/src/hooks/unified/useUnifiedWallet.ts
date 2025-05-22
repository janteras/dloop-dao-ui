/**
 * Enhanced Unified Wallet Hook
 * 
 * This hook provides a consistent interface for wallet interactions
 * with enhanced telemetry, error handling, and implementation switching.
 * It follows the unified contract access pattern established for the migration.
 */

import { useCallback } from 'react';
import { useFeatureFlag } from '@/config/feature-flags';
import { useWallet } from '@/hooks/useWallet';
import { useWagmiWallet } from '@/hooks/useWagmiWallet';
import { createTelemetryData, TelemetryData } from '@/components/common/factory';
import { processContractError } from '@/services/errorHandling';

export interface UnifiedWalletOptions {
  /**
   * Force a specific implementation regardless of feature flags
   */
  implementation?: 'ethers' | 'wagmi';
  
  /**
   * Callback for implementation-specific telemetry
   */
  onTelemetry?: (data: TelemetryData) => void;
}

export interface UnifiedWalletResult {
  /**
   * Whether the wallet is connected
   */
  isConnected: boolean;
  
  /**
   * The connected account address
   */
  address: string | undefined;
  
  /**
   * The current chain ID
   */
  chainId: number | undefined;
  
  /**
   * Function to connect the wallet
   */
  connect: () => Promise<void>;
  
  /**
   * Function to disconnect the wallet
   */
  disconnect: () => Promise<void>;
  
  /**
   * Whether the wallet is currently connecting
   */
  isConnecting: boolean;
  
  /**
   * Implementation details for telemetry and debugging
   */
  implementation: 'ethers' | 'wagmi';
}

/**
 * Enhanced unified hook for wallet interactions with telemetry
 */
export function useUnifiedWallet(options: UnifiedWalletOptions = {}): UnifiedWalletResult {
  // Determine which implementation to use based on feature flags or explicit choice
  const useWagmiFlag = useFeatureFlag('useWagmiWallet');
  const useWagmiImpl = options.implementation === 'wagmi' || (options.implementation !== 'ethers' && useWagmiFlag);
  
  // Get wallet data from the appropriate implementation
  const ethersWallet = useWallet();
  const wagmiWallet = useWagmiWallet();
  
  // Choose the correct implementation based on the flag or explicit choice
  const wallet = useWagmiImpl ? wagmiWallet : ethersWallet;
  
  // Enhanced connect function with telemetry
  const connect = useCallback(async () => {
    try {
      // Send telemetry for connect start
      if (options.onTelemetry) {
        options.onTelemetry(createTelemetryData(
          useWagmiImpl ? 'wagmi' : 'ethers',
          'useUnifiedWallet',
          'pending',
          {
            action: 'connect'
          }
        ));
      }
      
      // Call the implementation-specific connect function
      if (typeof wallet.connect === 'function') {
        await wallet.connect();
      }
      
      // Send telemetry for successful connection
      if (options.onTelemetry) {
        options.onTelemetry(createTelemetryData(
          useWagmiImpl ? 'wagmi' : 'ethers',
          'useUnifiedWallet',
          'success',
          {
            action: 'connect',
            metadata: {
              address: wallet.address,
              chainId: wallet.chainId
            }
          }
        ));
      }
    } catch (error) {
      // Process any errors through the centralized error handler
      processContractError(error, {
        component: 'useUnifiedWallet',
        method: 'connect',
        implementation: useWagmiImpl ? 'wagmi' : 'ethers'
      }, {
        showToast: true,
        onTelemetry: options.onTelemetry
      });
    }
  }, [wallet, useWagmiImpl, options.onTelemetry]);
  
  // Enhanced disconnect function with telemetry
  const disconnect = useCallback(async () => {
    try {
      // Send telemetry for disconnect start
      if (options.onTelemetry) {
        options.onTelemetry(createTelemetryData(
          useWagmiImpl ? 'wagmi' : 'ethers',
          'useUnifiedWallet',
          'pending',
          {
            action: 'disconnect'
          }
        ));
      }
      
      // Call the implementation-specific disconnect function
      if (typeof wallet.disconnect === 'function') {
        await wallet.disconnect();
      }
      
      // Send telemetry for successful disconnection
      if (options.onTelemetry) {
        options.onTelemetry(createTelemetryData(
          useWagmiImpl ? 'wagmi' : 'ethers',
          'useUnifiedWallet',
          'success',
          {
            action: 'disconnect'
          }
        ));
      }
    } catch (error) {
      // Process any errors through the centralized error handler
      processContractError(error, {
        component: 'useUnifiedWallet',
        method: 'disconnect',
        implementation: useWagmiImpl ? 'wagmi' : 'ethers'
      }, {
        showToast: true,
        onTelemetry: options.onTelemetry
      });
    }
  }, [wallet, useWagmiImpl, options.onTelemetry]);
  
  // Return a consistent interface regardless of implementation
  return {
    isConnected: wallet.isConnected || false,
    address: wallet.address,
    chainId: wallet.chainId,
    connect,
    disconnect,
    isConnecting: wallet.isConnecting || false,
    implementation: useWagmiImpl ? 'wagmi' : 'ethers'
  };
}
