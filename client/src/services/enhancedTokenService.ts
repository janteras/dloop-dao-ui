/**
 * Enhanced Token Resolution Service
 * 
 * A comprehensive service for token resolution, metadata fetching, and formatting
 * with support for multiple networks, caching, and async loading capabilities.
 * 
 * This service extends the functionality of the existing TokenSymbolResolver
 * with additional features like multi-chain support and advanced metadata handling.
 */

import { ethers } from 'ethers';
import { TokenSymbolResolver } from './tokenSymbolService';

// Token chain identifiers
export enum TokenChain {
  ETHEREUM = 'ethereum',
  SEPOLIA = 'sepolia',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
  POLYGON = 'polygon',
  BASE = 'base'
}

// Token price source identifiers
export enum PriceSource {
  COINGECKO = 'coingecko',
  CHAINLINK = 'chainlink',
  UNISWAP = 'uniswap',
  INTERNAL = 'internal'
}

// Enhanced token information interface
export interface EnhancedTokenInfo {
  // Basic token info
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  
  // Extended metadata
  chain: TokenChain;
  logoURI?: string;
  websiteURL?: string;
  explorerURL?: string;
  
  // Price information
  priceUSD?: number;
  priceChangeUSD?: number;
  priceSource?: PriceSource;
  lastUpdated?: number;
  
  // Token traits
  isStablecoin?: boolean;
  isNative?: boolean;
  isVerified?: boolean;
  tags?: string[];
  
  // Protocol-specific data
  dloopSpecific?: {
    isGovernable?: boolean;
    canDelegate?: boolean;
    totalSupply?: string;
  };
}

// Token amount with metadata
export interface TokenAmount {
  raw: string | number | bigint;
  formatted: string;
  token: EnhancedTokenInfo;
}

/**
 * Enhanced Token Service class with advanced features
 */
export class EnhancedTokenService {
  private tokenRegistry: Map<string, EnhancedTokenInfo> = new Map();
  private priceCache: Map<string, { price: number, timestamp: number }> = new Map();
  private loadingPromises: Map<string, Promise<EnhancedTokenInfo | null>> = new Map();
  private providers: Map<TokenChain, ethers.Provider> = new Map();
  private priceTTL = 5 * 60 * 1000; // 5 minutes cache for prices
  
  // Initialize with default tokens
  constructor() {
    // Import existing tokens from the TokenSymbolResolver
    this.importFromLegacyResolver();
    
    // Add native tokens
    this.registerToken({
      address: 'ETH',
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      chain: TokenChain.ETHEREUM,
      isNative: true,
      isVerified: true,
      logoURI: 'https://ethereum.org/static/6b935ac0e6194247347855dc3d328e83/13c43/eth-diamond-black.png'
    });
  }
  
  /**
   * Import tokens from the legacy TokenSymbolResolver
   */
  private importFromLegacyResolver() {
    // Get all tokens from the existing resolver
    const legacyAddresses = [
      '0x05b366778566e93abfb8e4a9b794e4ad006446b4', // DLOOP
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
      '0xda9d4f9b69ac6c22e444ed9af0cfc043b7a7f53f'  // USDC (Sepolia)
    ];
    
    // Import each token
    for (const address of legacyAddresses) {
      const tokenInfo = TokenSymbolResolver.getTokenInfo(address);
      if (tokenInfo) {
        this.registerToken({
          address,
          symbol: tokenInfo.symbol,
          name: tokenInfo.name,
          decimals: tokenInfo.decimals,
          chain: address === '0xda9d4f9b69ac6c22e444ed9af0cfc043b7a7f53f' 
            ? TokenChain.SEPOLIA 
            : TokenChain.ETHEREUM,
          logoURI: tokenInfo.logoURI,
          isVerified: true,
          isStablecoin: tokenInfo.symbol === 'USDC',
          tags: tokenInfo.symbol === 'DLOOP' ? ['governance'] : undefined
        });
      }
    }
  }
  
  /**
   * Set a provider for a specific chain
   * @param chain Chain identifier
   * @param provider Ethers provider
   */
  setProvider(chain: TokenChain, provider: ethers.Provider) {
    this.providers.set(chain, provider);
    return this;
  }
  
  /**
   * Register a new token in the registry
   * @param token Token information
   */
  registerToken(token: EnhancedTokenInfo) {
    const normalizedAddress = token.address.toLowerCase();
    this.tokenRegistry.set(normalizedAddress, token);
    return this;
  }
  
  /**
   * Get token information
   * @param address Token address
   * @param chain Optional chain to scope the lookup
   * @returns Token information or null if not found
   */
  getTokenInfo(address: string, chain?: TokenChain): EnhancedTokenInfo | null {
    if (!address) return null;
    
    const normalizedAddress = address.toLowerCase();
    const token = this.tokenRegistry.get(normalizedAddress);
    
    // If chain is specified, make sure it matches
    if (token && chain && token.chain !== chain) {
      return null;
    }
    
    return token || null;
  }
  
  /**
   * Asynchronously get token information with fallback to on-chain lookup
   * @param address Token address
   * @param chain Chain to use for on-chain lookup
   * @returns Promise resolving to token info or null
   */
  async getTokenInfoAsync(address: string, chain: TokenChain = TokenChain.ETHEREUM): Promise<EnhancedTokenInfo | null> {
    if (!address) return null;
    
    const normalizedAddress = address.toLowerCase();
    
    // Check if already in registry
    const cachedToken = this.getTokenInfo(normalizedAddress, chain);
    if (cachedToken) return cachedToken;
    
    // Check if already loading
    if (this.loadingPromises.has(normalizedAddress)) {
      return this.loadingPromises.get(normalizedAddress)!;
    }
    
    // Start loading token info
    const loadPromise = this.fetchTokenInfoFromChain(normalizedAddress, chain);
    this.loadingPromises.set(normalizedAddress, loadPromise);
    
    try {
      const tokenInfo = await loadPromise;
      if (tokenInfo) {
        this.registerToken(tokenInfo);
      }
      return tokenInfo;
    } finally {
      // Clean up the loading promise
      this.loadingPromises.delete(normalizedAddress);
    }
  }
  
  /**
   * Fetch token information from on-chain data
   * @param address Token address
   * @param chain Chain to use for lookup
   * @returns Promise resolving to token info or null
   */
  private async fetchTokenInfoFromChain(address: string, chain: TokenChain): Promise<EnhancedTokenInfo | null> {
    const provider = this.providers.get(chain);
    if (!provider || !ethers.isAddress(address)) return null;
    
    try {
      // ERC20 minimal ABI for fetching token info
      const minimalABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)"
      ];
      
      // Create contract instance
      const tokenContract = new ethers.Contract(address, minimalABI, provider);
      
      // Fetch token data
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.totalSupply()
      ]);
      
      // Create token info
      return {
        address,
        symbol,
        name,
        decimals,
        chain,
        isVerified: false, // Not verified by default
        dloopSpecific: {
          totalSupply: totalSupply.toString()
        }
      };
    } catch (error) {
      console.error(`Error fetching token info for ${address}:`, error);
      return null;
    }
  }
  
  /**
   * Get token price in USD
   * @param address Token address
   * @param forceFresh Whether to force a fresh price lookup
   * @returns Promise resolving to price or null
   */
  async getTokenPrice(address: string, forceFresh = false): Promise<number | null> {
    if (!address) return null;
    
    const normalizedAddress = address.toLowerCase();
    
    // Check cache if not forcing fresh data
    if (!forceFresh) {
      const cached = this.priceCache.get(normalizedAddress);
      if (cached && Date.now() - cached.timestamp < this.priceTTL) {
        return cached.price;
      }
    }
    
    // Get token info to determine which API to use
    const tokenInfo = await this.getTokenInfoAsync(normalizedAddress);
    if (!tokenInfo) return null;
    
    try {
      // Default to CoinGecko for this example
      // In a real implementation, this would use different price sources based on the token
      const price = await this.fetchPriceFromCoinGecko(tokenInfo.symbol);
      
      // Cache the result
      if (price !== null) {
        this.priceCache.set(normalizedAddress, {
          price,
          timestamp: Date.now()
        });
        
        // Update the token info
        this.registerToken({
          ...tokenInfo,
          priceUSD: price,
          priceSource: PriceSource.COINGECKO,
          lastUpdated: Date.now()
        });
      }
      
      return price;
    } catch (error) {
      console.error(`Error fetching price for ${tokenInfo.symbol}:`, error);
      return null;
    }
  }
  
  /**
   * Fetch price from CoinGecko (stub implementation)
   * In a real implementation, this would make an API call to CoinGecko
   */
  private async fetchPriceFromCoinGecko(symbol: string): Promise<number | null> {
    // Stub implementation - would normally fetch from CoinGecko API
    const mockPrices: Record<string, number> = {
      'DLOOP': 0.75,
      'ETH': 3000,
      'WETH': 3000,
      'USDC': 1,
      'WBTC': 40000
    };
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return mockPrices[symbol] || null;
  }
  
  /**
   * Format token amount with the appropriate number of decimals
   * @param amount Amount to format
   * @param address Token address
   * @param options Formatting options
   * @returns Formatted amount string
   */
  formatTokenAmount(
    amount: string | number | bigint,
    address: string,
    options: {
      decimals?: number;
      includeSymbol?: boolean;
      compact?: boolean;
      significantDigits?: number;
    } = {}
  ): string {
    const { includeSymbol = false, compact = false, significantDigits = 6 } = options;
    
    const tokenInfo = this.getTokenInfo(address);
    const decimals = options.decimals ?? tokenInfo?.decimals ?? 18;
    
    let formattedAmount: string;
    
    try {
      let numericAmount: number;
      
      // Convert to numeric value
      if (typeof amount === 'bigint') {
        // Handle bigint by converting to decimal based on token decimals
        numericAmount = Number(amount) / Math.pow(10, decimals);
      } else if (typeof amount === 'string') {
        numericAmount = parseFloat(amount);
      } else {
        numericAmount = amount;
      }
      
      // Apply formatting based on options
      if (compact) {
        formattedAmount = new Intl.NumberFormat('en-US', {
          notation: 'compact',
          maximumSignificantDigits: significantDigits
        }).format(numericAmount);
      } else {
        formattedAmount = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: decimals
        }).format(numericAmount);
      }
      
      // Add symbol if requested
      if (includeSymbol && tokenInfo) {
        formattedAmount = `${formattedAmount} ${tokenInfo.symbol}`;
      }
    } catch (error) {
      console.error('Error formatting token amount:', error);
      formattedAmount = String(amount);
    }
    
    return formattedAmount;
  }
  
  /**
   * Get full token amount object with formatting
   * @param amount Amount to format
   * @param address Token address
   * @param options Formatting options
   * @returns TokenAmount object
   */
  async getTokenAmount(
    amount: string | number | bigint,
    address: string,
    options: {
      decimals?: number;
      compact?: boolean;
      significantDigits?: number;
      chain?: TokenChain;
    } = {}
  ): Promise<TokenAmount | null> {
    // Get token info, fetching from chain if needed
    const tokenInfo = await this.getTokenInfoAsync(address, options.chain);
    if (!tokenInfo) return null;
    
    // Format the amount
    const formatted = this.formatTokenAmount(amount, address, options);
    
    return {
      raw: amount,
      formatted,
      token: tokenInfo
    };
  }
  
  /**
   * Clear all caches
   */
  clearCaches() {
    this.priceCache.clear();
    return this;
  }
}

// Export singleton instance
export const enhancedTokenService = new EnhancedTokenService();

// Export types
export type { TokenAmount, EnhancedTokenInfo };
