/**
 * Enhanced Token Service
 * 
 * Provides advanced token handling capabilities including:
 * - Token metadata caching and resolution
 * - Token price lookups
 * - Token balance formatting with proper decimals
 * - Support for different token standards (ERC20, ERC721, ERC1155)
 */

import { useUnifiedContract } from '@/hooks/useUnifiedContract';
import { useUnifiedWallet } from '@/hooks/unified';
import { useQuery } from 'react-query';
import { ethers } from 'ethers';
import { useMemo } from 'react';

// ABI snippets for the token standards we support
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
];

const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function balanceOf(address owner) view returns (uint256)',
  'function tokenURI(uint256 tokenId) view returns (string)',
  'function ownerOf(uint256 tokenId) view returns (address)',
];

const ERC1155_ABI = [
  'function balanceOf(address account, uint256 id) view returns (uint256)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'function uri(uint256 id) view returns (string)',
];

/**
 * Token standards supported by the service
 */
export enum TokenStandard {
  ERC20 = 'ERC20',
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Token metadata including common fields across standards
 */
export interface TokenMetadata {
  address: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  totalSupply?: string;
  priceUsd?: number;
  iconUrl?: string;
  standard: TokenStandard;
  lastUpdated: number;
}

/**
 * In-memory cache for token metadata to reduce network calls
 */
const tokenMetadataCache: Record<string, TokenMetadata> = {};

/**
 * Known token addresses for common tokens
 */
export const KNOWN_TOKENS: Record<string, Partial<TokenMetadata>> = {
  // Mainnet tokens
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': { 
    name: 'USD Coin', 
    symbol: 'USDC', 
    decimals: 6, 
    standard: TokenStandard.ERC20,
    iconUrl: 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png'
  },
  '0xdAC17F958D2ee523a2206206994597C13D831ec7': {
    name: 'Tether USD', 
    symbol: 'USDT', 
    decimals: 6, 
    standard: TokenStandard.ERC20,
    iconUrl: 'https://assets.coingecko.com/coins/images/325/small/Tether-logo.png'
  },
  '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': {
    name: 'Wrapped Bitcoin', 
    symbol: 'WBTC', 
    decimals: 8, 
    standard: TokenStandard.ERC20,
    iconUrl: 'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png'
  },
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': {
    name: 'Wrapped Ether', 
    symbol: 'WETH', 
    decimals: 18, 
    standard: TokenStandard.ERC20,
    iconUrl: 'https://assets.coingecko.com/coins/images/2518/small/weth.png'
  },
  // Add more tokens as needed
};

/**
 * Enhanced Token Service for comprehensive token handling
 */
export class EnhancedTokenService {
  /**
   * Detects the token standard for a given contract address
   * @param address Token contract address
   * @returns Promise resolving to the detected token standard
   */
  static async detectTokenStandard(address: string): Promise<TokenStandard> {
    try {
      // Try ERC20 first as it's most common
      const erc20Contract = new ethers.Contract(address, ERC20_ABI, ethers.getDefaultProvider());
      await erc20Contract.symbol();
      await erc20Contract.decimals();
      return TokenStandard.ERC20;
    } catch (e) {
      try {
        // Try ERC721 next
        const erc721Contract = new ethers.Contract(address, ERC721_ABI, ethers.getDefaultProvider());
        await erc721Contract.symbol();
        await erc721Contract.ownerOf(0);
        return TokenStandard.ERC721;
      } catch (e) {
        try {
          // Finally try ERC1155
          const erc1155Contract = new ethers.Contract(address, ERC1155_ABI, ethers.getDefaultProvider());
          await erc1155Contract.uri(0);
          return TokenStandard.ERC1155;
        } catch (e) {
          return TokenStandard.UNKNOWN;
        }
      }
    }
  }

  /**
   * Gets token metadata with priority from cache > known tokens > on-chain
   * @param address Token contract address
   * @param forceRefresh Whether to force a refresh from the chain
   * @returns Promise resolving to token metadata
   */
  static async getTokenMetadata(address: string, forceRefresh = false): Promise<TokenMetadata | null> {
    // Check cache first if not forcing refresh
    if (!forceRefresh && tokenMetadataCache[address]) {
      // Return cached value if it's recent (less than 1 hour old)
      const cachedData = tokenMetadataCache[address];
      if (Date.now() - cachedData.lastUpdated < 3600000) {
        return cachedData;
      }
    }

    // Check if it's a known token
    if (KNOWN_TOKENS[address]) {
      const knownData = KNOWN_TOKENS[address];
      const metadata: TokenMetadata = {
        address,
        name: knownData.name,
        symbol: knownData.symbol,
        decimals: knownData.decimals,
        iconUrl: knownData.iconUrl,
        standard: knownData.standard || TokenStandard.ERC20,
        lastUpdated: Date.now()
      };
      
      // Update cache
      tokenMetadataCache[address] = metadata;
      return metadata;
    }

    try {
      // Determine token standard if not known
      const standard = await this.detectTokenStandard(address);
      
      // Get metadata based on standard
      let metadata: TokenMetadata = {
        address,
        standard,
        lastUpdated: Date.now()
      };
      
      if (standard === TokenStandard.ERC20) {
        const erc20Contract = new ethers.Contract(address, ERC20_ABI, ethers.getDefaultProvider());
        const [name, symbol, decimals, totalSupply] = await Promise.all([
          erc20Contract.name().catch(() => 'Unknown Token'),
          erc20Contract.symbol().catch(() => 'UNKNOWN'),
          erc20Contract.decimals().catch(() => 18),
          erc20Contract.totalSupply().catch(() => '0')
        ]);
        
        metadata = {
          ...metadata,
          name,
          symbol,
          decimals,
          totalSupply: totalSupply.toString()
        };
      } else if (standard === TokenStandard.ERC721) {
        const erc721Contract = new ethers.Contract(address, ERC721_ABI, ethers.getDefaultProvider());
        const [name, symbol] = await Promise.all([
          erc721Contract.name().catch(() => 'Unknown NFT'),
          erc721Contract.symbol().catch(() => 'NFT')
        ]);
        
        metadata = {
          ...metadata,
          name,
          symbol
        };
      } else if (standard === TokenStandard.ERC1155) {
        // ERC1155 doesn't have standard name/symbol methods
        metadata = {
          ...metadata,
          name: 'Multi Token',
          symbol: 'MT'
        };
      }
      
      // Try to get token price if it's ERC20
      if (standard === TokenStandard.ERC20) {
        try {
          const price = await this.getTokenPrice(address);
          if (price) {
            metadata.priceUsd = price;
          }
        } catch (e) {
          console.warn(`Failed to get price for token ${address}:`, e);
        }
      }
      
      // Update cache
      tokenMetadataCache[address] = metadata;
      return metadata;
    } catch (error) {
      console.error(`Failed to get metadata for token ${address}:`, error);
      return null;
    }
  }

  /**
   * Gets the current market price for a token
   * @param address Token contract address
   * @returns Promise resolving to the token price in USD
   */
  static async getTokenPrice(address: string): Promise<number | null> {
    try {
      // Use CoinGecko API to get token price
      // Note: In a production app, you might want to use a dedicated price oracle or paid API
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${address}&vs_currencies=usd`
      );
      
      const data = await response.json();
      return data[address.toLowerCase()]?.usd || null;
    } catch (error) {
      console.error(`Failed to get price for token ${address}:`, error);
      return null;
    }
  }

  /**
   * Formats a token amount with proper decimals
   * @param amount Raw token amount as string or BigNumber
   * @param decimals Token decimals
   * @param maxDecimals Maximum decimals to display
   * @returns Formatted token amount
   */
  static formatTokenAmount(
    amount: string | ethers.BigNumber,
    decimals = 18,
    maxDecimals = 6
  ): string {
    try {
      const value = ethers.utils.formatUnits(amount, decimals);
      const formatted = parseFloat(value);
      return formatted.toLocaleString('en-US', {
        maximumFractionDigits: maxDecimals
      });
    } catch (error) {
      console.error('Error formatting token amount:', error);
      return '0';
    }
  }

  /**
   * Calculates the fiat value of a token amount
   * @param amount Raw token amount as string or BigNumber
   * @param tokenAddress Token contract address
   * @param decimals Token decimals
   * @returns Promise resolving to the fiat value string
   */
  static async calculateFiatValue(
    amount: string | ethers.BigNumber,
    tokenAddress: string,
    decimals = 18
  ): Promise<string> {
    try {
      const formattedAmount = ethers.utils.formatUnits(amount, decimals);
      const tokenPrice = await this.getTokenPrice(tokenAddress);
      
      if (!tokenPrice) return 'N/A';
      
      const fiatValue = parseFloat(formattedAmount) * tokenPrice;
      return fiatValue.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      });
    } catch (error) {
      console.error('Error calculating fiat value:', error);
      return 'N/A';
    }
  }

  /**
   * Gets the balance of a token for a specific address
   * @param tokenAddress Token contract address
   * @param userAddress User address to check balance for
   * @param tokenId Token ID (for ERC721/ERC1155)
   * @returns Promise resolving to the raw balance
   */
  static async getTokenBalance(
    tokenAddress: string,
    userAddress: string,
    tokenId?: number
  ): Promise<string> {
    try {
      const metadata = await this.getTokenMetadata(tokenAddress);
      
      if (!metadata) {
        return '0';
      }
      
      if (metadata.standard === TokenStandard.ERC20) {
        const erc20Contract = new ethers.Contract(tokenAddress, ERC20_ABI, ethers.getDefaultProvider());
        const balance = await erc20Contract.balanceOf(userAddress);
        return balance.toString();
      } else if (metadata.standard === TokenStandard.ERC721) {
        const erc721Contract = new ethers.Contract(tokenAddress, ERC721_ABI, ethers.getDefaultProvider());
        const balance = await erc721Contract.balanceOf(userAddress);
        return balance.toString();
      } else if (metadata.standard === TokenStandard.ERC1155 && tokenId !== undefined) {
        const erc1155Contract = new ethers.Contract(tokenAddress, ERC1155_ABI, ethers.getDefaultProvider());
        const balance = await erc1155Contract.balanceOf(userAddress, tokenId);
        return balance.toString();
      }
      
      return '0';
    } catch (error) {
      console.error(`Failed to get balance for token ${tokenAddress}:`, error);
      return '0';
    }
  }
}

/**
 * React Query hook for token metadata
 * @param tokenAddress Token contract address
 * @returns Query result with token metadata
 */
export function useTokenMetadata(tokenAddress?: string) {
  return useQuery(
    ['tokenMetadata', tokenAddress],
    async () => {
      if (!tokenAddress) return null;
      return EnhancedTokenService.getTokenMetadata(tokenAddress);
    },
    {
      enabled: !!tokenAddress,
      staleTime: 3600000, // 1 hour
      cacheTime: 86400000, // 24 hours
    }
  );
}

/**
 * React Query hook for token balance
 * @param tokenAddress Token contract address
 * @param tokenId Token ID (for ERC721/ERC1155)
 * @returns Query result with formatted token balance
 */
export function useTokenBalance(tokenAddress?: string, tokenId?: number) {
  const { address } = useUnifiedWallet();
  const { data: metadata } = useTokenMetadata(tokenAddress);
  
  const balanceQuery = useQuery(
    ['tokenBalance', tokenAddress, address, tokenId],
    async () => {
      if (!tokenAddress || !address) return '0';
      return EnhancedTokenService.getTokenBalance(tokenAddress, address, tokenId);
    },
    {
      enabled: !!tokenAddress && !!address,
      staleTime: 30000, // 30 seconds
    }
  );
  
  // Format the balance with proper decimals
  const formattedBalance = useMemo(() => {
    if (!balanceQuery.data || !metadata) return '0';
    return EnhancedTokenService.formatTokenAmount(
      balanceQuery.data,
      metadata.decimals || 18
    );
  }, [balanceQuery.data, metadata]);
  
  return {
    ...balanceQuery,
    formattedBalance,
    metadata
  };
}

/**
 * Hook for using a token contract via the unified contract system
 * @param tokenAddress Token contract address
 * @returns Contract interface and token metadata
 */
export function useTokenContract(tokenAddress?: string) {
  const { data: metadata } = useTokenMetadata(tokenAddress);
  
  // Select appropriate ABI based on token standard
  const abi = useMemo(() => {
    if (!metadata) return ERC20_ABI;
    
    switch (metadata.standard) {
      case TokenStandard.ERC20:
        return ERC20_ABI;
      case TokenStandard.ERC721:
        return ERC721_ABI;
      case TokenStandard.ERC1155:
        return ERC1155_ABI;
      default:
        return ERC20_ABI;
    }
  }, [metadata]);
  
  // Get unified contract
  const contract = useUnifiedContract(tokenAddress, abi);
  
  return {
    contract,
    metadata,
    standard: metadata?.standard || TokenStandard.UNKNOWN
  };
}
