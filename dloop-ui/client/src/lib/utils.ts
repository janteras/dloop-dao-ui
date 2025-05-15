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
 * @param startChars Number of characters to keep at the beginning
 * @param endChars Number of characters to keep at the end
 * @param separator The separator between start and end parts
 * @returns The shortened address
 */
export function shortenAddress(
  address: string, 
  startChars = 4, 
  endChars = 4, 
  separator = '...'
): string {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;
  return `${address.substring(0, startChars)}${separator}${address.substring(address.length - endChars)}`;
}

/**
 * Copies text to clipboard
 * @param text The text to copy
 * @returns Promise that resolves when copying is done
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
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
  const dt = new Date(date);
  if (isNaN(dt.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dt);
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
 * Format a timestamp to a relative time string (e.g., "2 hours ago")
 * @param timestamp The timestamp to format
 * @returns A string representing the relative time
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMillis = now - timestamp;
  const diffSeconds = Math.floor(diffMillis / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return diffSeconds <= 5 ? 'just now' : `${diffSeconds} seconds ago`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`;
  } else {
    return `${diffYears} ${diffYears === 1 ? 'year' : 'years'} ago`;
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