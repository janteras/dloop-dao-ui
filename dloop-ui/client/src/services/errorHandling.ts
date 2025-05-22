/**
 * Contract Error Handling Service
 * 
 * Provides centralized error handling for blockchain interactions with
 * consistent error categorization, user-friendly messages, and telemetry.
 */

import toast from 'react-hot-toast';
import { TelemetryData } from '@/components/common/factory';

// Define error categories for better error handling
export enum ErrorCategory {
  CONTRACT_EXECUTION = 'contract_execution',
  TRANSACTION_REJECTED = 'transaction_rejected',
  NETWORK_ERROR = 'network_error',
  WALLET_CONNECTION = 'wallet_connection',
  PROVIDER_ERROR = 'provider_error',
  UNEXPECTED_ERROR = 'unexpected_error',
}

// Define error context interface for providing additional information
export interface ErrorContext {
  component: string;
  method: string;
  implementation: 'ethers' | 'wagmi';
  args?: any[];
  metadata?: Record<string, any>;
}

// Define standardized contract error interface
export interface ContractError {
  category: ErrorCategory;
  message: string;
  details?: string;
  recoverable: boolean;
  originalError: Error;
  context: ErrorContext;
  code?: string | number;
}

/**
 * Maps common error codes to error categories
 */
const ERROR_CODE_MAPPING: Record<string, ErrorCategory> = {
  // Ethers error codes
  'CALL_EXCEPTION': ErrorCategory.CONTRACT_EXECUTION,
  'INSUFFICIENT_FUNDS': ErrorCategory.CONTRACT_EXECUTION,
  'UNPREDICTABLE_GAS_LIMIT': ErrorCategory.CONTRACT_EXECUTION,
  'TRANSACTION_REPLACED': ErrorCategory.CONTRACT_EXECUTION,
  'ACTION_REJECTED': ErrorCategory.TRANSACTION_REJECTED,
  'NETWORK_ERROR': ErrorCategory.NETWORK_ERROR,
  
  // Wagmi error codes
  'ContractFunctionExecutionError': ErrorCategory.CONTRACT_EXECUTION,
  'UserRejectedRequestError': ErrorCategory.TRANSACTION_REJECTED,
  'InsufficientFundsError': ErrorCategory.CONTRACT_EXECUTION,
  'ChainNotConfiguredError': ErrorCategory.NETWORK_ERROR,
  'ProviderDisconnectedError': ErrorCategory.PROVIDER_ERROR,
  'ResourceUnavailableError': ErrorCategory.PROVIDER_ERROR,
};

/**
 * Maps error categories to user-friendly messages
 */
const USER_MESSAGES: Record<ErrorCategory, string> = {
  [ErrorCategory.CONTRACT_EXECUTION]: 'The transaction could not be completed due to a contract error',
  [ErrorCategory.TRANSACTION_REJECTED]: 'Transaction was rejected',
  [ErrorCategory.NETWORK_ERROR]: 'Network connection error',
  [ErrorCategory.WALLET_CONNECTION]: 'Wallet connection error',
  [ErrorCategory.PROVIDER_ERROR]: 'Provider error',
  [ErrorCategory.UNEXPECTED_ERROR]: 'An unexpected error occurred',
};

/**
 * Determines if an error is recoverable by the user
 */
export function isRecoverableError(error: Error | any, errorCategory?: ErrorCategory): boolean {
  // If category is provided, use that to determine recoverability
  if (errorCategory) {
    return [
      ErrorCategory.TRANSACTION_REJECTED,
      ErrorCategory.NETWORK_ERROR,
      ErrorCategory.WALLET_CONNECTION,
    ].includes(errorCategory);
  }
  
  // Check common recoverable error patterns
  if (error.code === 'ACTION_REJECTED' || error.code === 'UserRejectedRequestError') {
    return true;
  }
  
  if (error.message?.includes('user rejected') || error.message?.includes('User rejected')) {
    return true;
  }
  
  if (error.message?.includes('network') || error.message?.includes('connect')) {
    return true;
  }
  
  return false;
}

/**
 * Categorize an error based on its properties
 */
function categorizeError(error: Error | any): ErrorCategory {
  // Check for specific error codes
  if (error.code && ERROR_CODE_MAPPING[error.code]) {
    return ERROR_CODE_MAPPING[error.code];
  }
  
  // Check for specific error types
  if (error.name && ERROR_CODE_MAPPING[error.name]) {
    return ERROR_CODE_MAPPING[error.name];
  }
  
  // Check error message patterns
  const errorMessage = error.message?.toLowerCase() || '';
  
  if (errorMessage.includes('user rejected') || errorMessage.includes('user denied')) {
    return ErrorCategory.TRANSACTION_REJECTED;
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('disconnected')) {
    return ErrorCategory.NETWORK_ERROR;
  }
  
  if (errorMessage.includes('wallet') || errorMessage.includes('connect')) {
    return ErrorCategory.WALLET_CONNECTION;
  }
  
  if (errorMessage.includes('provider')) {
    return ErrorCategory.PROVIDER_ERROR;
  }
  
  // Default to contract execution if it mentions contract or execution
  if (errorMessage.includes('contract') || errorMessage.includes('execution')) {
    return ErrorCategory.CONTRACT_EXECUTION;
  }
  
  return ErrorCategory.UNEXPECTED_ERROR;
}

/**
 * Extract a user-friendly error message from the error
 */
function extractErrorDetails(error: Error | any): string {
  // For Ethers errors
  if (error.reason) {
    return error.reason;
  }
  
  // For Wagmi errors
  if (error.details) {
    return error.details;
  }
  
  // Extract from error message
  const message = error.message || '';
  
  // Try to extract a cleaner message by removing common prefixes
  const cleanedMessage = message
    .replace(/^Error: /, '')
    .replace(/^[a-zA-Z]+Error: /, '')
    .replace(/\(action="[^"]+", code=[^,]+, version=[^,]+, info=[^)]+\)/, '');
  
  return cleanedMessage || 'Unknown error';
}

/**
 * Process an error and return a standardized contract error
 */
export function handleContractError(error: Error | any, context: ErrorContext): ContractError {
  // Categorize the error
  const category = categorizeError(error);
  
  // Get a user-friendly message
  const message = USER_MESSAGES[category];
  
  // Extract more specific details if available
  const details = extractErrorDetails(error);
  
  // Determine if the error is recoverable
  const recoverable = isRecoverableError(error, category);
  
  // Construct the standardized error
  const contractError: ContractError = {
    category,
    message,
    details,
    recoverable,
    originalError: error,
    context,
    code: error.code || undefined,
  };
  
  // Log the error for debugging
  console.error(`[Contract Error] ${context.implementation}/${context.component}/${context.method}:`, {
    category,
    message: details,
    recoverable,
    originalError: error,
  });
  
  return contractError;
}

/**
 * Display an appropriate error toast for the contract error
 */
export function showErrorToast(error: ContractError): void {
  // Skip toasts for user rejections as they're intentional
  if (error.category === ErrorCategory.TRANSACTION_REJECTED) {
    return;
  }
  
  // Show a toast with the appropriate error message
  toast.error(
    error.details ? `${error.message}: ${error.details}` : error.message,
    {
      duration: error.recoverable ? 3000 : 5000,
    }
  );
}

/**
 * Track error telemetry
 */
export function trackErrorTelemetry(
  error: ContractError, 
  onTelemetry?: (data: TelemetryData) => void
): void {
  if (!onTelemetry) return;
  
  onTelemetry({
    implementation: error.context.implementation,
    component: error.context.component,
    action: error.context.method,
    status: 'error',
    error: error.originalError,
    timestamp: Date.now(),
    metadata: {
      category: error.category,
      recoverable: error.recoverable,
      ...error.context.metadata,
    },
  });
}

/**
 * Unified error handler that processes, displays, and tracks errors
 */
export function processContractError(
  error: Error | any, 
  context: ErrorContext, 
  options: { showToast?: boolean, trackTelemetry?: boolean, onTelemetry?: (data: TelemetryData) => void } = {}
): ContractError {
  const { showToast = true, trackTelemetry = true, onTelemetry } = options;
  
  // Process the error
  const contractError = handleContractError(error, context);
  
  // Show toast if requested
  if (showToast) {
    showErrorToast(contractError);
  }
  
  // Track telemetry if requested
  if (trackTelemetry && onTelemetry) {
    trackErrorTelemetry(contractError, onTelemetry);
  }
  
  return contractError;
}
