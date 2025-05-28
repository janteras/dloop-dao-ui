/**
 * Proposal Helper Utilities
 * Provides consistent mapping and formatting for proposals across the app
 */

import { ethers } from 'ethers';

// Use a safe formatUnits function that works with different ethers versions
function safeFormatUnits(value: string | bigint, decimals: number = 18): string {
  try {
    // Use Ethers v6 formatUnits directly
    if (typeof ethers.formatUnits === 'function') {
      return ethers.formatUnits(value, decimals);
    }
    
    // Manual fallback for safety
    const valueStr = value.toString();
    if (typeof value === 'bigint' || /^\d+$/.test(valueStr)) {
      const numValue = BigInt(valueStr);
      
      // Calculate divisor manually
      let divisor = BigInt(1);
      for (let i = 0; i < decimals; i++) {
        divisor = divisor * BigInt(10);
      }
      
      const wholePart = numValue / divisor;
      const fractionPart = numValue % divisor;
      
      let fractionStr = fractionPart.toString().padStart(decimals, '0');
      // Remove trailing zeros
      fractionStr = fractionStr.replace(/0+$/, '');
      
      return fractionStr.length > 0 
        ? `${wholePart}.${fractionStr}` 
        : wholePart.toString();
    }
    
    throw new Error('Invalid format for formatting');
  } catch (error) {
    console.error('Error in safeFormatUnits:', error);
    return '0';
  }
}

// Common token addresses and their symbols
export const TOKEN_ADDRESSES: Record<string, string> = {
  // Sepolia Testnet addresses - Lowercase for case-insensitive matching
  "0x05b366778566e93abfb8e4a9b794e4ad006446b4": "DLOOP",
  "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238": "USDC",
  "0xca063a2ab07491ee991dcecb456d1265f842b568": "WBTC",
  
  // Zero address fallback
  "0x0000000000000000000000000000000000000000": "ETH"
};

/**
 * Maps a proposal type from contract representation to UI display format
 * @param type The proposal type as number, string or enum value
 * @returns The UI display string ('invest' or 'divest')
 */
export function mapContractTypeToUI(type: string | number | bigint | undefined): string {
  // Only log in development mode to avoid console spam
  if (process.env.NODE_ENV === 'development') {
    console.debug('Mapping proposal type:', {
      type,
      typeOf: typeof type,
      value: type
    });
  }
  
  // Handle undefined case first
  if (type === undefined || type === null) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Proposal type is undefined, defaulting to "invest"');
    }
    return 'invest';
  }
  
  // Handle bigint type (common in Wagmi implementations)
  if (typeof type === 'bigint') {
    return type === 0n ? 'invest' : 'divest';
  }
  
  // Handle number types (from contract - common in Ethers implementations)
  if (typeof type === 'number') {
    return type === 0 ? 'invest' : 'divest';
  }
  
  // Handle string types that are actually numbers (common when converting from BigNumber)
  if (typeof type === 'string') {
    // Check if it's a string representation of a number
    if (!isNaN(Number(type))) {
      const numericType = Number(type);
      return numericType === 0 ? 'invest' : 'divest';
    }
    
    // Handle direct string values like 'invest' or 'divest'
    const normalizedType = type.toLowerCase().trim();
    
    if (['invest', 'investment', '0', 'investproposal'].includes(normalizedType)) {
      return 'invest';
    }
    
    if (['divest', 'divestment', '1', 'divestproposal'].includes(normalizedType)) {
      return 'divest';
    }
    
    // Check for common substrings
    if (normalizedType.includes('invest') && !normalizedType.includes('divest')) {
      return 'invest';
    }
    
    if (normalizedType.includes('divest')) {
      return 'divest';
    }
  }
  
  // If we reach here, the type is invalid or unrecognized
  // Only log in development mode
  if (process.env.NODE_ENV === 'development') {
    console.warn('Unrecognized proposal type:', type, 'defaulting to "invest"');
  }
  
  // Default to 'invest' for safety
  return 'invest';
}

/**
 * Gets the token symbol for a given address
 * @param address The token address
 * @returns The token symbol
 */
export function getTokenSymbol(address: string | undefined): string {
  // Handle undefined address
  if (!address) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Undefined token address, returning UNKNOWN');
    }
    return 'UNKNOWN';
  }
  
  // Handle empty string and placeholder addresses
  if (address.trim() === '' || address === '0x') {
    return 'ETH';
  }
  
  // Normalize addresses for case-insensitive comparison
  const normalizedAddress = address.toLowerCase();
  
  // Check if we have a mapping for this address
  for (const [mappedAddress, symbol] of Object.entries(TOKEN_ADDRESSES)) {
    if (mappedAddress.toLowerCase() === normalizedAddress) {
      return symbol;
    }
  }
  
  // Handle special cases like the zero address and native token
  if (normalizedAddress === '0x0000000000000000000000000000000000000000') {
    return 'ETH';
  }
  
  // Special cases for testnet tokens that might not be in TOKEN_ADDRESSES
  if (normalizedAddress.includes('usdc') || normalizedAddress.includes('usd')) {
    return 'USDC';
  }
  
  if (normalizedAddress.includes('btc') || normalizedAddress.includes('bitcoin')) {
    return 'WBTC';
  }
  
  if (normalizedAddress.includes('dloop') || normalizedAddress.includes('loop')) {
    return 'DLOOP';
  }
  
  // For addresses that don't appear to be valid Ethereum addresses
  if (!normalizedAddress.startsWith('0x') || normalizedAddress.length !== 42) {
    // It might be a special identifier or a non-standard token reference
    // Return it as is if it's short, otherwise truncate
    return address.length <= 10 ? address : `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
  
  // If no match found and it's a valid Ethereum address, return a shortened version
  const shortAddress = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  
  // Only log warnings in development mode
  if (process.env.NODE_ENV === 'development') {
    console.warn(`No token symbol found for address: ${address}, using shortened address: ${shortAddress}`);
  }
  
  return shortAddress;
}

/**
 * Formats an amount for display
 * @param amount The amount to format
 * @returns The formatted amount string
 */
export function formatAmount(amount: string | number | bigint | undefined): string {
  if (amount === undefined || amount === null) {
    return '0.00'; // Use 0.00 instead of '-' for undefined values
  }
  
  try {
    // For development debugging
    if (process.env.NODE_ENV === 'development') {
      console.debug('Formatting amount:', {
        value: amount,
        type: typeof amount,
        hasToString: typeof amount === 'object' && amount !== null && 'toString' in amount
      });
    }
    
    // Handle BigNumber or bigint cases
    if (typeof amount === 'bigint') {
      // Use safe formatter for bigint values (typically from contracts)
      const formatted = safeFormatUnits(amount.toString(), 18);
      const parsedAmount = parseFloat(formatted);
      return parsedAmount === 0 ? '-' : parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
    
    // Handle objects with toString method (like BigNumber)
    if (typeof amount === 'object' && amount !== null && 'toString' in (amount as any)) {
      try {
        const amountStr = (amount as any).toString();
        // Check if this is a BigNumber in wei format
        if (/^\d+$/.test(amountStr) && amountStr.length > 10) {
          const formatted = safeFormatUnits(amountStr, 18);
          const parsedAmount = parseFloat(formatted);
          return parsedAmount === 0 ? '-' : parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
        } else {
          // Regular number object
          const parsedAmount = parseFloat(amountStr);
          return isNaN(parsedAmount) ? '-' : parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
        }
      } catch (err) {
        console.error('Error formatting object amount:', err);
        return '-';
      }
    }
    
    // Handle direct number
    if (typeof amount === 'number') {
      return amount === 0 ? '-' : amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
    
    // Handle string representation of number
    if (typeof amount === 'string') {
      // If the string is empty
      if (!amount.trim()) {
        return '-';
      }
      
      // If the string is a valid number
      if (!isNaN(Number(amount))) {
        const parsedAmount = parseFloat(amount);
        return parsedAmount === 0 ? '-' : parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
      }
      
      // If it's a hex string potentially representing a token amount
      if (amount.startsWith('0x')) {
        try {
          const bigIntValue = BigInt(amount);
          const formatted = safeFormatUnits(bigIntValue.toString(), 18);
          const parsedAmount = parseFloat(formatted);
          return parsedAmount === 0 ? '-' : parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
        } catch (error) {
          // Not a valid hex number
          return amount;
        }
      }
      
      // If none of the above, return the string as is
      return amount;
    }
    
    // Fallback for unknown format
    return '-';
  } catch (error) {
    console.error('Error formatting amount:', error, {amount});
    return '-';
  }
}

/**
 * Shortens an Ethereum address for display
 * @param address The full Ethereum address
 * @returns The shortened address (0xABCD...XYZ format)
 */
export function shortenAddress(address: string): string {
  if (!address || address.length < 10) {
    return address || 'Unknown';
  }
  
  // For non-Ethereum addresses (like "AI.Gov")
  if (!address.startsWith('0x')) {
    return address;
  }
  
  // For standard Ethereum addresses, show first 6 and last 4 chars
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Combines a token address and amount for display
 * @param token The token address 
 * @param amount The amount
 * @returns Formatted string with amount and token symbol
 */
export function formatTokenAmount(token: string | undefined, amount: string | number | bigint | undefined): string {
  const formattedAmount = formatAmount(amount);
  const tokenSymbol = getTokenSymbol(token);
  
  // Special case: if we have a valid token symbol but no amount, show 0.00 instead of '-'
  if (formattedAmount === '-' && tokenSymbol !== 'UNKNOWN') {
    return `0.00 ${tokenSymbol}`;
  }
  
  // Special case: if the amount is actually a token symbol itself (e.g., 'USDC')
  if (typeof amount === 'string' && 
      (amount.toUpperCase() === 'ETH' || 
       amount.toUpperCase() === 'USDC' || 
       amount.toUpperCase() === 'WBTC' || 
       amount.toUpperCase() === 'DLOOP')) {
    // If both amount and token contain token symbols, just use one
    if (tokenSymbol !== 'UNKNOWN') {
      return `0.00 ${tokenSymbol}`; 
    } else {
      return `0.00 ${amount.toUpperCase()}`;
    }
  }
  
  return `${formattedAmount} ${tokenSymbol}`;
}

export default {
  mapContractTypeToUI,
  getTokenSymbol,
  formatAmount,
  formatTokenAmount,
  shortenAddress,
  TOKEN_ADDRESSES
};
