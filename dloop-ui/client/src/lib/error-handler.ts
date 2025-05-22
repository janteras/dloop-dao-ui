/**
 * Centralized Error Handling System
 * 
 * This file provides a consistent approach to handling errors throughout the application,
 * with specific handling for blockchain-related errors, form validation errors, and API errors.
 */

import { parseEthersError } from './ethers-utils';

// Error severity levels
export enum ErrorSeverity {
  INFO = 'info',       // Informational errors that don't disrupt the app
  WARNING = 'warning', // Warnings that might need attention
  ERROR = 'error',     // Standard errors that disrupt operation
  CRITICAL = 'critical' // Critical errors that block functionality
}

// Error categories for better grouping and analysis
export enum ErrorCategory {
  BLOCKCHAIN = 'blockchain',
  CONTRACT = 'contract',
  NETWORK = 'network',
  USER_INPUT = 'user_input',
  AUTHENTICATION = 'authentication',
  API = 'api',
  NAVIGATION = 'navigation',
  UI = 'ui',
  UNKNOWN = 'unknown'
}

// Structured error type
export interface AppError {
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: number;
  code?: string;
  details?: any;
  originalError?: any;
}

/**
 * Centralized error handler class
 */
class ErrorHandlerClass {
  // Keep a log of recent errors
  private errorLog: AppError[] = [];
  private maxLogSize = 50;

  // Error handling callbacks
  private errorListeners: ((error: AppError) => void)[] = [];

  /**
   * Register a callback to be notified of errors
   * @param callback Function to call when an error occurs
   * @returns Function to unregister the listener
   */
  public registerErrorListener(callback: (error: AppError) => void): () => void {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all registered listeners about an error
   * @param error The error to notify about
   */
  private notifyListeners(error: AppError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }

  /**
   * Log an error to the internal error log
   * @param error The error to log
   */
  private logError(error: AppError): void {
    this.errorLog.unshift(error);
    
    // Trim log to maximum size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${error.category}] ${error.message}`, error.details || error.originalError || '');
    }
  }

  /**
   * Get all logged errors
   * @returns Array of recent errors
   */
  public getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  /**
   * Clear the error log
   */
  public clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Create a standardized error object
   * @param message User-friendly error message
   * @param category Error category
   * @param severity Error severity level
   * @param details Additional error details
   * @param originalError Original error object
   * @param code Optional error code
   * @returns Structured AppError object
   */
  public createError(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    details?: any,
    originalError?: any,
    code?: string
  ): AppError {
    return {
      message,
      category,
      severity,
      timestamp: Date.now(),
      details,
      originalError,
      code
    };
  }

  /**
   * Handle any type of error with standard processing
   * @param error The error to handle
   * @param defaultMessage Default message to show if error can't be parsed
   * @param category Error category
   * @param severity Error severity
   * @returns Processed AppError
   */
  public handleError(
    error: any,
    defaultMessage: string = 'An unexpected error occurred',
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.ERROR
  ): AppError {
    let processedError: AppError;

    // Handle different error types
    if (error instanceof Error) {
      processedError = this.createError(
        error.message || defaultMessage,
        category,
        severity,
        { stack: error.stack },
        error
      );
    } else if (typeof error === 'string') {
      processedError = this.createError(error, category, severity);
    } else if (error && typeof error === 'object') {
      // Try to extract a meaningful message
      const message = error.message || error.reason || error.error || defaultMessage;
      processedError = this.createError(
        message,
        category,
        severity,
        error,
        error
      );
    } else {
      processedError = this.createError(defaultMessage, category, severity);
    }

    // Log and notify
    this.logError(processedError);
    this.notifyListeners(processedError);

    return processedError;
  }

  /**
   * Handle blockchain-related errors (specialized handling)
   * @param error Blockchain-related error
   * @param defaultMessage Default message to show
   * @returns Processed AppError
   */
  public handleBlockchainError(
    error: any,
    defaultMessage: string = 'Blockchain transaction failed'
  ): AppError {
    // Parse ethers error to get a cleaner message
    const { message, originalError } = parseEthersError(error);
    
    // Determine severity based on error type
    let severity = ErrorSeverity.ERROR;
    
    // User rejections are just warnings
    if (message.includes('reject') || message.includes('denied') || message.includes('canceled')) {
      severity = ErrorSeverity.WARNING;
    }
    
    const processedError = this.createError(
      message || defaultMessage,
      ErrorCategory.BLOCKCHAIN,
      severity,
      { originalMessage: error.message },
      originalError
    );

    this.logError(processedError);
    this.notifyListeners(processedError);

    return processedError;
  }

  /**
   * Handle contract interaction errors
   * @param error Contract error
   * @param contractName Name of the contract for better errors
   * @param methodName Method name for better errors
   * @returns Processed AppError
   */
  public handleContractError(
    error: any,
    contractName: string = 'Contract',
    methodName: string = 'interaction'
  ): AppError {
    const defaultMessage = `Error during ${contractName} ${methodName}`;
    
    // Parse ethers error to get a cleaner message
    const { message, originalError } = parseEthersError(error);
    
    const processedError = this.createError(
      message || defaultMessage,
      ErrorCategory.CONTRACT,
      ErrorSeverity.ERROR,
      { contract: contractName, method: methodName },
      originalError
    );

    this.logError(processedError);
    this.notifyListeners(processedError);

    return processedError;
  }

  /**
   * Handle user input validation errors
   * @param error Validation error
   * @param fieldName Name of the field with error
   * @returns Processed AppError
   */
  public handleValidationError(
    error: any,
    fieldName: string = 'input'
  ): AppError {
    let message = `Invalid ${fieldName}`;
    
    if (typeof error === 'string') {
      message = error;
    } else if (error?.message) {
      message = error.message;
    }
    
    const processedError = this.createError(
      message,
      ErrorCategory.USER_INPUT,
      ErrorSeverity.WARNING,
      { field: fieldName },
      error
    );

    this.logError(processedError);
    this.notifyListeners(processedError);

    return processedError;
  }

  /**
   * Handle network-related errors
   * @param error Network error
   * @returns Processed AppError
   */
  public handleNetworkError(error: any): AppError {
    let message = 'Network connection issue';
    const severity = ErrorSeverity.ERROR;
    
    // Check for specific network error types
    if (error?.message) {
      if (error.message.includes('timeout')) {
        message = 'Request timed out. Please check your connection.';
      } else if (error.message.includes('Network Error')) {
        message = 'Network connection lost. Please check your internet connection.';
      } else if (error.message.includes('Failed to fetch')) {
        message = 'Failed to connect to server. Please try again later.';
      } else {
        message = error.message;
      }
    }
    
    const processedError = this.createError(
      message,
      ErrorCategory.NETWORK,
      severity,
      {},
      error
    );

    this.logError(processedError);
    this.notifyListeners(processedError);

    return processedError;
  }
}

// Export singleton instance
export const ErrorHandler = new ErrorHandlerClass();

// Export error utility
export function captureError(
  error: any, 
  category: ErrorCategory = ErrorCategory.UNKNOWN,
  message?: string
): AppError {
  // Handle different categories with specialized handlers
  switch (category) {
    case ErrorCategory.BLOCKCHAIN:
      return ErrorHandler.handleBlockchainError(error, message);
    case ErrorCategory.CONTRACT:
      return ErrorHandler.handleContractError(error);
    case ErrorCategory.NETWORK:
      return ErrorHandler.handleNetworkError(error);
    case ErrorCategory.USER_INPUT:
      return ErrorHandler.handleValidationError(error);
    default:
      return ErrorHandler.handleError(error, message, category);
  }
}
