/**
 * TokenSymbolResolver Service
 * 
 * This service provides a clean way to resolve token contract addresses to their symbols
 * and ensure proper separation between amount and token display.
 */

import { ethers } from "ethers";

// Token list interface
interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

// Token registry mapping addresses to token info
type TokenRegistry = {
  [address: string]: TokenInfo;
};

// Default token registry with common tokens
const DEFAULT_TOKEN_REGISTRY: TokenRegistry = {
  // Token addresses are stored in lowercase for case-insensitive lookups
  "0x05b366778566e93abfb8e4a9b794e4ad006446b4": {
    symbol: "DLOOP",
    name: "D-Loop Token",
    decimals: 18,
  },
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": {
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
  },
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": {
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
  },
  // Sepolia testnet tokens
  "0xda9d4f9b69ac6c22e444ed9af0cfc043b7a7f53f": {
    symbol: "USDC",
    name: "USD Coin (Sepolia)",
    decimals: 6,
  },
  "0x3e622317f8c93f7328350cf0b56d9ed4c620c5d6": {
    symbol: "WBTC", 
    name: "Wrapped Bitcoin (Sepolia)",
    decimals: 8,
  },
};

class TokenSymbolResolverClass {
  private tokenRegistry: TokenRegistry;
  private provider: ethers.Provider | null = null;
  private cache: Map<string, TokenInfo> = new Map();
  
  constructor(initialRegistry: TokenRegistry = DEFAULT_TOKEN_REGISTRY) {
    this.tokenRegistry = { ...initialRegistry };
  }
  
  /**
   * Set the provider to use for dynamic token resolution
   * @param provider Ethers provider
   */
  setProvider(provider: ethers.Provider) {
    this.provider = provider;
  }
  
  /**
   * Get the ABI for ERC20 token contract
   */
  private getERC20ABI() {
    return [
      'function symbol() view returns (string)',
      'function name() view returns (string)',
      'function decimals() view returns (uint8)'
    ];
  }
  
  /**
   * Register a new token in the registry
   * @param address Token contract address
   * @param info Token information
   */
  registerToken(address: string, info: TokenInfo) {
    const normalizedAddress = address.toLowerCase();
    this.tokenRegistry[normalizedAddress] = info;
    this.cache.set(normalizedAddress, info);
    return info;
  }
  
  /**
   * Update a token's information in the registry
   * @param address Token contract address
   * @param info Token information
   */
  updateToken(address: string, info: Partial<TokenInfo>) {
    const normalizedAddress = address.toLowerCase();
    if (this.tokenRegistry[normalizedAddress]) {
      this.tokenRegistry[normalizedAddress] = {
        ...this.tokenRegistry[normalizedAddress],
        ...info
      };
      this.cache.set(normalizedAddress, this.tokenRegistry[normalizedAddress]);
      return this.tokenRegistry[normalizedAddress];
    }
    return null;
  }
  
  /**
   * Get token information from the registry
   * @param address Token contract address
   * @returns Token information or null if not found
   */
  getTokenInfo(address: string): TokenInfo | null {
    if (!address) return null;
    
    const normalizedAddress = address.toLowerCase();
    
    // Check cache first
    if (this.cache.has(normalizedAddress)) {
      return this.cache.get(normalizedAddress) || null;
    }
    
    // Then check registry
    const tokenInfo = this.tokenRegistry[normalizedAddress];
    if (tokenInfo) {
      this.cache.set(normalizedAddress, tokenInfo);
      return tokenInfo;
    }
    
    return null;
  }
  
  /**
   * Get token symbol for display
   * @param address Token contract address or symbol
   * @returns Token symbol or formatted address if not found
   */
  getTokenSymbol(address: string): string {
    // If it's already a symbol (not an address) return it
    if (!address) return "Unknown";
    
    // If it doesn't look like an address, return as is
    if (!address.startsWith('0x') || address.length !== 42) {
      return address;
    }
    
    const tokenInfo = this.getTokenInfo(address);
    if (tokenInfo) {
      return tokenInfo.symbol;
    }
    
    // If not found and we need to fetch it asynchronously, return a temporary value
    // and attempt to fetch it asynchronously
    this.fetchTokenInfoAsync(address);
    
    // Return a shortened address as fallback
    return this.formatUnknownToken(address);
  }
  
  /**
   * Format an unknown token address for display
   */
  private formatUnknownToken(address: string): string {
    if (!address) return "Unknown";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
  
  /**
   * Fetch token information asynchronously and update the registry
   * @param address Token contract address
   */
  async fetchTokenInfoAsync(address: string): Promise<TokenInfo | null> {
    if (!this.provider || !address || !address.startsWith('0x')) {
      return null;
    }
    
    const normalizedAddress = address.toLowerCase();
    
    try {
      const tokenContract = new ethers.Contract(
        address,
        this.getERC20ABI(),
        this.provider
      );
      
      // Fetch token info from the contract
      const [symbol, name, decimals] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.name(),
        tokenContract.decimals()
      ]);
      
      // Create and register the token info
      const tokenInfo: TokenInfo = {
        symbol,
        name,
        decimals: decimals
      };
      
      this.registerToken(normalizedAddress, tokenInfo);
      return tokenInfo;
    } catch (error) {
      console.error(`Failed to fetch token info for ${address}:`, error);
      return null;
    }
  }
  
  /**
   * Format an amount with the appropriate number of decimals for a token
   * @param amount Amount to format
   * @param tokenAddress Token address
   * @param fallbackDecimals Default decimals if token not found
   * @returns Formatted amount string
   */
  formatAmount(amount: string | number, tokenAddress: string, fallbackDecimals: number = 18): string {
    const tokenInfo = this.getTokenInfo(tokenAddress);
    const decimals = tokenInfo?.decimals ?? fallbackDecimals;
    
    try {
      // If amount is already a string, try to parse it
      const numericAmount = typeof amount === 'number' ? amount : parseFloat(amount);
      
      if (isNaN(numericAmount)) {
        return '0';
      }
      
      // Format with the appropriate number of decimals
      return numericAmount.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals
      });
    } catch (e) {
      console.warn(`Error formatting amount for token ${tokenAddress}:`, e);
      return amount.toString();
    }
  }
  
  /**
   * Clear the token cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const TokenSymbolResolver = new TokenSymbolResolverClass();

// Export types for reuse
export type { TokenInfo, TokenRegistry };
