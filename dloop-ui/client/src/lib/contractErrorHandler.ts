/**
 * Handle contract errors from the D-Loop Protocol with descriptive messages
 * @param error The contract error object
 * @returns Formatted error message for user display
 */
export function handleAssetDAOError(error: any): string {
  // Parse error message
  const errorMessage = error?.message || '';
  
  // Check for known error types from the integration guide
  if (errorMessage.includes('ZeroAddress')) {
    return 'Invalid address provided. Please check the token address.';
  } else if (errorMessage.includes('InvalidAmount')) {
    return 'Invalid amount specified. Amount must be greater than zero.';
  } else if (errorMessage.includes('Unauthorized')) {
    return 'You do not have permission to perform this action.';
  } else if (errorMessage.includes('ProposalNotFound')) {
    return 'This proposal does not exist.';
  } else if (errorMessage.includes('ProposalAlreadyExecuted')) {
    return 'This proposal has already been executed.';
  } else if (errorMessage.includes('user rejected')) {
    return 'Transaction was rejected by the user.';
  } else if (errorMessage.includes('insufficient funds')) {
    return 'Insufficient funds to complete this transaction.';
  }
  
  // Check for general transaction errors
  if (errorMessage.includes('gas required exceeds allowance')) {
    return 'Transaction requires more gas than allowed. Try increasing the gas limit.';
  } else if (errorMessage.includes('nonce too high')) {
    return 'Transaction nonce issue. Please refresh your browser and try again.';
  }
  
  // Return a simplified version of the original error for unknown cases
  // Strip out any lengthy hexadecimal data that might be in the error
  const simplifiedError = errorMessage.replace(/0x[a-fA-F0-9]{8,}/g, '[hex]');
  return `Transaction error: ${simplifiedError.substring(0, 100)}${simplifiedError.length > 100 ? '...' : ''}`;
}
