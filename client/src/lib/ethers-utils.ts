/**
 * Standardized Ethers.js Utilities
 * 
 * This file provides standardized utility functions and patterns for working with ethers.js
 * across the application. It helps ensure consistent handling of contract interactions,
 * type conversions, and error handling.
 */

import { ethers, BigNumberish } from 'ethers';
import { formatNumber } from './utils';

/**
 * Type for contract function interfaces to allow more specific error handling
 */
export interface ContractFunction<T> {
  (...args: any[]): Promise<T>;
}

/**
 * Parse an ethereum transaction error to extract meaningful information
 * @param error The error from ethers
 * @returns A user-friendly error message and the original error
 */
export function parseEthersError(error: any): { message: string; originalError: any } {
  // Default fallback message
  let message = "Transaction failed. Please try again.";

  try {
    if (!error) {
      return { message, originalError: error };
    }

    // Handle string errors
    if (typeof error === 'string') {
      return { message: error, originalError: error };
    }

    // Common error patterns from ethers.js
    if (error.reason) {
      message = error.reason;
    } else if (error.message) {
      if (error.message.includes("user rejected transaction")) {
        message = "Transaction was rejected in wallet";
      } else if (error.message.includes("execution reverted")) {
        const revertReason = error.message.match(/execution reverted: (.*?)"/);
        message = revertReason 
          ? `Transaction reverted: ${revertReason[1]}` 
          : "Transaction reverted by the contract";
      } else if (error.message.includes("insufficient funds")) {
        message = "Insufficient funds for transaction";
      } else if (error.message.includes("gas required exceeds")) {
        message = "Transaction would run out of gas. Try increasing gas limit.";
      } else if (error.message.includes("nonce too high")) {
        message = "Transaction nonce issue. Please refresh the page and try again.";
      } else if (error.message.includes("replacement fee too low")) {
        message = "Gas price too low to replace pending transaction";
      } else if (error.message.includes("already known")) {
        message = "Transaction already submitted";
      } else if (error.message.includes("network changed")) {
        message = "Network changed unexpectedly. Please refresh.";
      } else if (error.message.includes("cannot estimate gas")) {
        message = "Could not estimate gas. The transaction may fail.";
      } else if (error.message.includes("timeout")) {
        message = "Request timed out. The network may be congested.";
      } else {
        // Extract cleaner message if possible
        const cleanMessage = error.message.replace(/\(action="[^"]*", data=null, reason=null, code=[^,]+, version=[^,]+, [^)]*\)/, '');
        message = cleanMessage;
      }
    } else if (error.code) {
      // Handle provider errors
      switch (error.code) {
        case 4001:
          message = "Transaction rejected by user";
          break;
        case -32602:
          message = "Invalid transaction parameters";
          break;
        case -32603:
          message = "Internal error processing transaction";
          break;
        default:
          message = `Error code ${error.code}`;
      }
    }

    // Limit message length
    message = message.length > 120 ? message.substring(0, 117) + '...' : message;
    return { message, originalError: error };
  } catch (parsingError) {
    console.error("Error while parsing Ethers error:", parsingError);
    return { 
      message: "An unexpected error occurred", 
      originalError: error 
    };
  }
}

/**
 * Safely execute a contract call with standardized error handling
 * @param contractFunction The contract function to call
 * @param args Arguments to pass to the contract function
 * @param errorPrefix Optional prefix for error messages to provide context
 * @returns The result of the contract call
 */
export async function safeContractCall<T>(
  contractFunction: ContractFunction<T>,
  args: any[] = [],
  errorPrefix: string = "Contract Error"
): Promise<T> {
  try {
    return await contractFunction(...args);
  } catch (error: any) {
    const parsedError = parseEthersError(error);
    const errorMessage = `${errorPrefix}: ${parsedError.message}`;
    console.error(errorMessage, error);
    throw new Error(errorMessage, { cause: error });
  }
}

/**
 * Safely execute a contract transaction with standardized error handling
 * @param txFunction The contract transaction function to call
 * @param args Arguments to pass to the contract function
 * @param options Transaction options including error prefix and callbacks
 * @returns The transaction receipt
 */
export async function safeContractTransaction<T extends ethers.TransactionResponse>(
  txFunction: ContractFunction<T>,
  args: any[] = [],
  options: {
    errorPrefix?: string;
    confirmations?: number;
    onSubmitted?: (tx: T) => void;
    onConfirmed?: (receipt: ethers.TransactionReceipt) => void;
    onError?: (error: any) => void;
  } = {}
): Promise<ethers.TransactionReceipt> {
  const {
    errorPrefix = "Transaction Error",
    confirmations = 1,
    onSubmitted,
    onConfirmed,
    onError
  } = options;

  try {
    // Send transaction
    const tx = await txFunction(...args);
    
    // Call submitted callback if provided
    if (onSubmitted) onSubmitted(tx);
    
    // Wait for transaction confirmation
    const receipt = await tx.wait(confirmations);
    
    // Call confirmed callback if provided
    if (onConfirmed) onConfirmed(receipt);
    
    return receipt;
  } catch (error: any) {
    // Parse error for better user feedback
    const parsedError = parseEthersError(error);
    const errorMessage = `${errorPrefix}: ${parsedError.message}`;
    
    // Log the error
    console.error(errorMessage, error);
    
    // Call error callback if provided
    if (onError) onError(error);
    
    // Rethrow with improved message
    throw new Error(errorMessage, { cause: error });
  }
}

/**
 * Convert ethers BigNumber to a formatted number string
 * @param value The value to format
 * @param decimals Number of decimals the token has (default: 18 for ETH)
 * @param displayDecimals Number of decimals to display
 * @returns Formatted number string
 */
export function formatBigNumber(
  value: bigint | string | number | null | undefined,
  decimals: number = 18,
  displayDecimals: number = 2
): string {
  if (value === null || value === undefined) {
    return '0';
  }
  
  try {
    // Handle different input types including bigint, number, string
    const formattedValue = ethers.formatUnits(value, decimals);
    return formatNumber(parseFloat(formattedValue), displayDecimals);
  } catch (error) {
    console.warn('Error formatting big number:', error);
    return '0';
  }
}

/**
 * Standardized function to safely parse an amount string to BigNumber
 * @param amount The amount string to parse
 * @param decimals Number of decimals the token has (default: 18 for ETH)
 * @returns Parsed BigNumber
 */
export function parseAmount(amount: string, decimals: number = 18): bigint {
  try {
    // Remove thousands separators if present
    const cleanedAmount = amount.replace(/,/g, '');
    return ethers.parseUnits(cleanedAmount, decimals);
  } catch (error) {
    console.warn('Error parsing amount:', error);
    return ethers.parseUnits('0', decimals);
  }
}

/**
 * Safely get user address from signer
 * @param signer Ethers signer
 * @returns The user's address or null if unavailable
 */
export async function safeGetAddress(signer: ethers.JsonRpcSigner | null): Promise<string | null> {
  if (!signer) return null;
  try {
    return await signer.getAddress();
  } catch (error) {
    console.warn('Error getting address from signer:', error);
    return null;
  }
}

/**
 * Check if an address is valid
 * @param address Address to check
 * @returns True if address is valid
 */
export function isValidAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch (error) {
    return false;
  }
}

/**
 * Helper for estimating gas for a transaction with safety buffers
 * @param txFunction Function returning gas estimate
 * @param args Function arguments
 * @param multiplier Safety multiplier (default: 1.2)
 * @returns Gas limit for the transaction
 */
export async function estimateGasWithBuffer(
  txFunction: (...args: any[]) => Promise<ethers.BigNumber>,
  args: any[] = [],
  multiplier: number = 1.2
): Promise<ethers.BigNumber> {
  try {
    const gasEstimate = await txFunction(...args);
    // Add 20% buffer by default
    return ethers.BigNumber.from(Math.floor(Number(gasEstimate.toString()) * multiplier));
  } catch (error) {
    console.warn('Gas estimation failed:', error);
    // Return a high default if estimation fails
    return ethers.BigNumber.from(1000000); // High default gas limit
  }
}
