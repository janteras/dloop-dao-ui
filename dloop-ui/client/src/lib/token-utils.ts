/**
 * Token Utilities
 * 
 * Consistent token handling utilities for both Ethers and Wagmi implementations
 */

// Define token info interface
interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  color: string;
  bgColor: string;
}

// Token mapping from contract addresses to symbols and display information
export const TOKEN_REGISTRY: Record<string, TokenInfo> = {
  // USDC on Sepolia
  '0xd093d7331448766923fe7ab270a9f6bce63cefda': {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/20'
  },
  // WBTC on Sepolia
  '0x9c3c9283d3e44854697cd22d3faa240cfb032889': {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/20'
  },
  // DLOOP on Sepolia
  '0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f': {
    symbol: 'DLOOP',
    name: 'D-Loop Token',
    decimals: 18,
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/20'
  }
};

// Token address normalization
export const normalizeTokenAddress = (address: string): string => {
  if (!address) return '';
  return address.toLowerCase();
};

/**
 * Get token information from an address
 * @param address Token contract address
 * @returns Token information or a default object for unknown tokens
 */
export const getTokenInfo = (address: string | undefined) => {
  if (!address) return { 
    symbol: 'Unknown', 
    name: 'Unknown Token', 
    decimals: 18,
    color: 'text-gray', 
    bgColor: 'bg-gray/20' 
  };

  const normalizedAddress = normalizeTokenAddress(address);
  return TOKEN_REGISTRY[normalizedAddress] || { 
    symbol: address.slice(0, 6) + '...' + address.slice(-4), 
    name: 'Unknown Token', 
    decimals: 18,
    color: 'text-gray', 
    bgColor: 'bg-gray/20' 
  };
};

/**
 * Format token amount according to token decimals
 * @param amount Raw amount (may be a BigInt or number)
 * @param tokenAddress Address of the token to get decimals information
 * @returns Formatted amount string
 */
export const formatTokenAmount = (amount: bigint | number | string, tokenAddress: string) => {
  try {
    const tokenInfo = getTokenInfo(tokenAddress);
    const numericAmount = typeof amount === 'bigint' 
      ? Number(amount) / Math.pow(10, tokenInfo.decimals)
      : Number(amount);
    
    return numericAmount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return '0';
  }
};

/**
 * Generate a display string combining amount and token symbol
 * @param amount The token amount
 * @param tokenAddress The token address
 * @returns Formatted string like "1,000 USDC"
 */
export const getAmountWithSymbol = (amount: bigint | number | string, tokenAddress: string) => {
  const formattedAmount = formatTokenAmount(amount, tokenAddress);
  const { symbol } = getTokenInfo(tokenAddress);
  return `${formattedAmount} ${symbol}`;
};
