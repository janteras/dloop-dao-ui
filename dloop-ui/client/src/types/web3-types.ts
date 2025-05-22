/**
 * Web3 Type Definitions
 * 
 * Centralized type definitions for smart contract interactions, blockchain data,
 * and web3-specific concepts.
 */

import { TokenChain } from '@/services/enhancedTokenService';

/**
 * Ethereum address type with validation
 */
export type EthereumAddress = string & { readonly _brand: unique symbol };

/**
 * Create a validated Ethereum address
 * @param address The address to validate
 */
export function createEthereumAddress(address: string): EthereumAddress {
  if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
    throw new Error(`Invalid Ethereum address: ${address}`);
  }
  return address as EthereumAddress;
}

/**
 * Type guard for Ethereum addresses
 * @param value Value to check
 */
export function isEthereumAddress(value: unknown): value is EthereumAddress {
  return typeof value === 'string' && /^0x[a-fA-F0-9]{40}$/.test(value);
}

/**
 * Assertion function for Ethereum addresses
 * @param value Value to assert
 */
export function assertEthereumAddress(value: unknown): asserts value is EthereumAddress {
  if (!isEthereumAddress(value)) {
    throw new Error(`Expected Ethereum address, got: ${value}`);
  }
}

/**
 * Format an Ethereum address for display
 * @param address Ethereum address to format
 * @param chars Number of characters to show at the beginning and end
 */
export function formatEthereumAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return '';
  
  // Handle AI.Gov and other special addresses
  if (!address.startsWith('0x')) return address;
  
  if (address.length < startChars + endChars + 3) return address;
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Web3 Implementation Type
 */
export type Web3Implementation = 'ethers' | 'wagmi';

/**
 * Transaction Status
 */
export enum TransactionStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  REJECTED = 'rejected'
}

/**
 * Transaction Receipt with implementation-agnostic fields
 */
export interface TransactionReceipt {
  hash: string;
  blockNumber: number;
  confirmations: number;
  status: TransactionStatus;
  from: EthereumAddress;
  to: EthereumAddress | null;
  gasUsed: string | number;
}

/**
 * Token information with proper typing
 */
export interface TokenInfo {
  address: EthereumAddress;
  symbol: string;
  name: string;
  decimals: number;
  chain: TokenChain;
  logo?: string;
  price?: number;
}

/**
 * Web3 Error categories
 */
export enum Web3ErrorType {
  USER_REJECTED = 'user_rejected',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  NETWORK_ERROR = 'network_error',
  CONTRACT_ERROR = 'contract_error',
  UNKNOWN = 'unknown'
}

/**
 * Web3-specific error with categorization
 */
export class Web3Error extends Error {
  public readonly type: Web3ErrorType;
  public readonly originalError?: unknown;
  
  constructor(message: string, type: Web3ErrorType = Web3ErrorType.UNKNOWN, originalError?: unknown) {
    super(message);
    this.name = 'Web3Error';
    this.type = type;
    this.originalError = originalError;
  }
  
  /**
   * Factory method to categorize common web3 errors
   */
  static fromError(error: unknown): Web3Error {
    if (error instanceof Web3Error) return error;
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (/user rejected|denied transaction|rejected by user/i.test(errorMessage)) {
      return new Web3Error('Transaction was rejected by the user', Web3ErrorType.USER_REJECTED, error);
    }
    
    if (/insufficient funds|underpriced/i.test(errorMessage)) {
      return new Web3Error('Insufficient funds for transaction', Web3ErrorType.INSUFFICIENT_FUNDS, error);
    }
    
    if (/network|connection|timeout/i.test(errorMessage)) {
      return new Web3Error('Network error occurred', Web3ErrorType.NETWORK_ERROR, error);
    }
    
    if (/revert|invalid opcode|invalid bytecode/i.test(errorMessage)) {
      return new Web3Error('Smart contract execution failed', Web3ErrorType.CONTRACT_ERROR, error);
    }
    
    return new Web3Error(errorMessage, Web3ErrorType.UNKNOWN, error);
  }
}
