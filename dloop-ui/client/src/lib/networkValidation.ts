import { ethers } from 'ethers';
import { handleContractError, ContractErrorCategory } from './contractErrorHandler';

/**
 * Supported Ethereum networks
 */
export enum SupportedChainId {
  SEPOLIA = 11155111,
  MAINNET = 1,
}

/**
 * Network configuration
 * @interface NetworkConfig
 */
export interface NetworkConfig {
  /** Network chain ID */
  chainId: number;
  /** Human-readable network name */
  name: string;
  /** Network currency symbol */
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  /** RPC URL for the network */
  rpcUrls: string[];
  /** Block explorer URLs */
  blockExplorerUrls: string[];
  /** Testnet flag */
  isTestnet: boolean;
}

/**
 * Network configurations for supported networks
 */
export const NETWORK_CONFIGS: Record<number, NetworkConfig> = {
  [SupportedChainId.SEPOLIA]: {
    chainId: SupportedChainId.SEPOLIA,
    name: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'Sepolia Ether',
      symbol: 'SEP',
      decimals: 18,
    },
    rpcUrls: ['https://sepolia.infura.io/v3/'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
    isTestnet: true,
  },
  [SupportedChainId.MAINNET]: {
    chainId: SupportedChainId.MAINNET,
    name: 'Ethereum Mainnet',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://mainnet.infura.io/v3/'],
    blockExplorerUrls: ['https://etherscan.io'],
    isTestnet: false,
  },
};

/**
 * Default chain ID for the application
 */
export const DEFAULT_CHAIN_ID = SupportedChainId.SEPOLIA;

/**
 * Checks if a chain ID is supported by the application
 * @param chainId - The chain ID to check
 * @returns Whether the chain ID is supported
 */
export function isSupportedChainId(chainId: number | undefined): boolean {
  return Boolean(
    chainId && Object.values(SupportedChainId).includes(chainId as SupportedChainId)
  );
}

/**
 * Gets the network configuration for a chain ID
 * @param chainId - The chain ID to get the configuration for
 * @returns The network configuration or undefined if not supported
 */
export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return NETWORK_CONFIGS[chainId];
}

/**
 * Network validation result
 */
export interface NetworkValidationResult {
  /** Whether the network is valid */
  isValid: boolean;
  /** The current chain ID */
  chainId?: number;
  /** Error message if validation failed */
  error?: string;
  /** Network configuration if validation succeeded */
  networkConfig?: NetworkConfig;
}

/**
 * Validates the current network against supported networks
 * @param provider - The ethers provider
 * @returns A promise that resolves to a network validation result
 */
export async function validateNetwork(
  provider: ethers.JsonRpcProvider | ethers.BrowserProvider | null
): Promise<NetworkValidationResult> {
  if (!provider) {
    return {
      isValid: false,
      error: 'No provider available',
    };
  }

  try {
    // Get the network from the provider
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);

    // Check if the chain ID is supported
    if (!isSupportedChainId(chainId)) {
      return {
        isValid: false,
        chainId,
        error: `Unsupported network: ${network.name || chainId}. Please switch to Sepolia Testnet.`,
      };
    }

    // Network is valid, return the configuration
    const networkConfig = getNetworkConfig(chainId);
    return {
      isValid: true,
      chainId,
      networkConfig,
    };
  } catch (error) {
    const processedError = handleContractError(error);
    return {
      isValid: false,
      error: processedError.message,
    };
  }
}

/**
 * Requests a network switch to the specified chain ID
 * @param provider - The ethers provider
 * @param targetChainId - The chain ID to switch to
 * @returns A promise that resolves to a boolean indicating success
 */
export async function switchNetwork(
  provider: ethers.BrowserProvider | null,
  targetChainId: number = DEFAULT_CHAIN_ID
): Promise<boolean> {
  if (!provider) {
    console.error('No provider available');
    return false;
  }

  try {
    const networkConfig = getNetworkConfig(targetChainId);
    if (!networkConfig) {
      console.error(`No configuration for chain ID ${targetChainId}`);
      return false;
    }

    // Get the signer (typically MetaMask or other wallet)
    const signer = await provider.getSigner();
    
    // Check if the provider has the request method (EIP-1193 compliant)
    if (!provider.provider.request) {
      console.error('Provider does not support network switching');
      return false;
    }

    try {
      // Request the switch
      await provider.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      return true;
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        // Add the network
        await provider.provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: networkConfig.name,
              nativeCurrency: networkConfig.nativeCurrency,
              rpcUrls: networkConfig.rpcUrls,
              blockExplorerUrls: networkConfig.blockExplorerUrls,
            },
          ],
        });
        return true;
      }
      // Other errors
      console.error('Failed to switch network:', switchError);
      return false;
    }
  } catch (error) {
    console.error('Error switching network:', error);
    return false;
  }
}

/**
 * Hook-friendly network validation function 
 * For use in React components and hooks
 */
export function getNetworkValidationHandler(provider: ethers.JsonRpcProvider | ethers.BrowserProvider | null) {
  return async (): Promise<NetworkValidationResult> => {
    return validateNetwork(provider);
  };
}
