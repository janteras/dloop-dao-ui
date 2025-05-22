/**
 * Error categories for contract interactions
 */
export enum ContractErrorCategory {
  USER_ERROR = 'user_error',       // User input errors or wallet issues
  PERMISSION_ERROR = 'permission', // Permission or authorization issues
  DATA_ERROR = 'data',            // Invalid data or state issues
  NETWORK_ERROR = 'network',      // Network-related issues
  TRANSACTION_ERROR = 'transaction', // Transaction processing issues
  UNKNOWN_ERROR = 'unknown'       // Uncategorized errors
}

/**
 * Structured contract error response
 * @interface ContractErrorResponse
 */
export interface ContractErrorResponse {
  /** User-friendly error message */
  message: string;
  /** Technical error details for developers */
  details: string;
  /** Error category for handling different types of errors */
  category: ContractErrorCategory;
  /** Whether the error can be retried */
  retryable: boolean;
  /** Suggested action for the user */
  suggestedAction?: string;
}

/**
 * Maps contract error codes to user-friendly messages
 */
const ERROR_CODE_MAP: Record<string, { message: string, category: ContractErrorCategory, retryable: boolean, suggestedAction?: string }> = {
  // AssetDAO specific errors
  'ZeroAddress': {
    message: 'Invalid address provided',
    category: ContractErrorCategory.USER_ERROR,
    retryable: true,
    suggestedAction: 'Please check the token address and try again.'
  },
  'InvalidAmount': {
    message: 'Invalid amount specified',
    category: ContractErrorCategory.USER_ERROR,
    retryable: true,
    suggestedAction: 'Amount must be greater than zero.'
  },
  'CallerNotAdmin': {
    message: 'Admin permission required',
    category: ContractErrorCategory.PERMISSION_ERROR,
    retryable: false,
    suggestedAction: 'This action requires admin privileges.'
  },
  'CallerNotOwner': {
    message: 'Owner permission required',
    category: ContractErrorCategory.PERMISSION_ERROR,
    retryable: false,
    suggestedAction: 'This action requires owner privileges.'
  },
  'NotAuthorized': {
    message: 'Not authorized',
    category: ContractErrorCategory.PERMISSION_ERROR,
    retryable: false,
    suggestedAction: 'You do not have permission to perform this action.'
  },
  'ProposalNotFound': {
    message: 'Proposal not found',
    category: ContractErrorCategory.DATA_ERROR,
    retryable: false,
    suggestedAction: 'This proposal may have been removed or never existed.'
  },
  'ProposalAlreadyExecuted': {
    message: 'Proposal already executed',
    category: ContractErrorCategory.DATA_ERROR,
    retryable: false,
    suggestedAction: 'This proposal has already been processed.'
  },
  'QuorumNotReached': {
    message: 'Quorum not reached',
    category: ContractErrorCategory.DATA_ERROR,
    retryable: false,
    suggestedAction: 'The proposal needs more votes before it can be executed.'
  },
  'MajorityNotReached': {
    message: 'Majority not reached',
    category: ContractErrorCategory.DATA_ERROR,
    retryable: false,
    suggestedAction: 'The proposal did not receive enough yes votes to pass.'
  },
  'TokenNotWhitelisted': {
    message: 'Token not supported',
    category: ContractErrorCategory.DATA_ERROR,
    retryable: false,
    suggestedAction: 'This token is not supported by the protocol.'
  },
  'VotingPeriodEnded': {
    message: 'Voting period ended',
    category: ContractErrorCategory.DATA_ERROR,
    retryable: false,
    suggestedAction: 'The voting period for this proposal has ended.'
  },
  'VotingPeriodNotEnded': {
    message: 'Voting still in progress',
    category: ContractErrorCategory.DATA_ERROR,
    retryable: false,
    suggestedAction: 'Wait until the voting period ends before executing the proposal.'
  },
  'TimelockPeriodNotElapsed': {
    message: 'Timelock period not elapsed',
    category: ContractErrorCategory.DATA_ERROR,
    retryable: true,
    suggestedAction: 'Wait until the timelock period ends before executing the proposal.'
  },
  
  // Common Ethereum errors
  'user rejected': {
    message: 'Transaction rejected',
    category: ContractErrorCategory.USER_ERROR,
    retryable: true,
    suggestedAction: 'You rejected the transaction request in your wallet.'
  },
  'insufficient funds': {
    message: 'Insufficient funds',
    category: ContractErrorCategory.USER_ERROR,
    retryable: true,
    suggestedAction: 'Add more funds to your wallet to cover transaction costs.'
  },
  'gas required exceeds allowance': {
    message: 'Gas limit too low',
    category: ContractErrorCategory.TRANSACTION_ERROR,
    retryable: true,
    suggestedAction: 'Try increasing the gas limit in your wallet settings.'
  },
  'nonce too high': {
    message: 'Transaction sequence error',
    category: ContractErrorCategory.TRANSACTION_ERROR,
    retryable: true,
    suggestedAction: 'Refresh your browser and try again.'
  },
  'network disconnected': {
    message: 'Network disconnected',
    category: ContractErrorCategory.NETWORK_ERROR,
    retryable: true,
    suggestedAction: 'Check your internet connection and try again.'
  },
  'execution reverted': {
    message: 'Transaction reverted',
    category: ContractErrorCategory.TRANSACTION_ERROR,
    retryable: true,
    suggestedAction: 'The transaction was reverted by the blockchain. Check your inputs and try again.'
  }
};

/**
 * Process a contract error and return a structured, user-friendly response
 * @param error - The contract error object from ethers or other sources
 * @returns A structured error response with user-friendly information
 */
export function handleContractError(error: any): ContractErrorResponse {
  // Get the error message or default to an empty string
  const errorMessage = error?.message || error?.reason || error?.toString() || '';
  const errorCode = error?.code?.toString() || '';
  
  // For debugging purposes
  console.debug('Contract error:', { message: errorMessage, code: errorCode, error });
  
  // Check for specific error codes from providers (common ethers error codes)
  if (errorCode === 'ACTION_REJECTED') {
    return {
      message: 'Transaction rejected',
      details: errorMessage,
      category: ContractErrorCategory.USER_ERROR,
      retryable: true,
      suggestedAction: 'You rejected the transaction in your wallet.'
    };
  }
  
  // Look for known error types in the error message
  for (const [errorKey, errorInfo] of Object.entries(ERROR_CODE_MAP)) {
    if (errorMessage.includes(errorKey)) {
      return {
        message: errorInfo.message,
        details: errorMessage,
        category: errorInfo.category,
        retryable: errorInfo.retryable,
        suggestedAction: errorInfo.suggestedAction
      };
    }
  }
  
  // Network connection issues
  if (
    errorMessage.includes('could not detect network') ||
    errorMessage.includes('network changed') ||
    errorMessage.includes('disconnected') ||
    errorMessage.includes('connection error')
  ) {
    return {
      message: 'Network connection issue',
      details: errorMessage,
      category: ContractErrorCategory.NETWORK_ERROR,
      retryable: true,
      suggestedAction: 'Check your internet connection and wallet connection status.'
    };
  }
  
  // For unknown errors, return a simplified message
  // Remove any lengthy hexadecimal data
  const simplifiedError = errorMessage.replace(/0x[a-fA-F0-9]{8,}/g, '[hex]');
  const truncatedError = simplifiedError.length > 150 
    ? `${simplifiedError.substring(0, 150)}...` 
    : simplifiedError;
  
  return {
    message: 'Transaction failed',
    details: truncatedError,
    category: ContractErrorCategory.UNKNOWN_ERROR,
    retryable: true,
    suggestedAction: 'Please try again or contact support if the issue persists.'
  };
}

/**
 * Legacy function for backward compatibility
 * Handle contract errors from the D-Loop Protocol with descriptive messages
 * @param error The contract error object
 * @returns Formatted error message for user display
 * @deprecated Use handleContractError instead for more comprehensive error handling
 */
export function handleAssetDAOError(error: any): string {
  const result = handleContractError(error);
  return result.suggestedAction ? `${result.message}: ${result.suggestedAction}` : result.message;
}
