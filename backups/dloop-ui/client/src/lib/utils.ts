import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names using clsx and twMerge for Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a wallet address to a shorter version
 * @param address The full wallet address
 * @param chars Number of characters to keep at the beginning and end
 * @returns The shortened address
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.substring(0, chars)}...${address.substring(address.length - chars)}`;
}

/**
 * Formats a number to a currency string
 * @param amount The amount to format
 * @param currency The currency code
 * @param decimals The number of decimal places
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'USD', decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Formats a number with commas
 * @param num The number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Returns a date in a readable format
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | number): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Calculate time remaining in a readable format
 * @param endTime End timestamp
 * @returns Formatted time remaining string
 */
export function timeRemaining(endTime: number): string {
  const now = Date.now();
  if (endTime <= now) return 'Ended';

  const diffMillis = endTime - now;
  const diffSeconds = Math.floor(diffMillis / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours % 24}h`;
  } else if (diffHours > 0) {
    return `${diffHours}h ${diffMinutes % 60}m`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}m ${diffSeconds % 60}s`;
  } else {
    return `${diffSeconds}s`;
  }
}

/**
 * Calculate percent completion
 * @param current Current value
 * @param total Total value
 * @returns Percentage (0-100)
 */
export function calculatePercentage(current: number, total: number): number {
  if (total === 0) return 0;
  return Math.min(100, Math.max(0, (current / total) * 100));
}

/**
 * Parse error messages from Web3 errors
 * @param error The error object
 * @returns Readable error message
 */
export function parseErrorMessage(error: any): string {
  if (!error) return 'Unknown error occurred';
  
  // Handle ethers contract errors
  if (error.reason) return error.reason;
  if (error.message) return error.message;
  
  return 'Transaction failed. Please try again.';
}