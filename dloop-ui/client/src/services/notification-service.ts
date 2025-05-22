/**
 * Unified Notification Service
 * 
 * Provides a consistent interface for showing toast notifications and feedback
 * across the application. Integrates with the error handler system.
 */

import { ErrorHandler, ErrorCategory, ErrorSeverity, AppError } from '@/lib/error-handler';
import { toast, ToastOptions } from 'react-hot-toast';

// Notification types
export enum NotificationType {
  SUCCESS = 'success',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error'
}

// Notification interface
export interface NotificationOptions extends Omit<ToastOptions, 'icon'> {
  title?: string;
  description: string;
  type?: NotificationType;
  icon?: React.ReactNode;
  autoClose?: boolean;
  closeAfterMs?: number;
}

class NotificationServiceClass {
  private isInitialized: boolean = false;
  
  /**
   * Initialize the notification service and connect it to the error handler
   */
  initialize() {
    if (this.isInitialized) return;
    
    // Register error listener to automatically show notifications for errors
    ErrorHandler.registerErrorListener(this.handleAppError);
    this.isInitialized = true;
  }
  
  /**
   * Error handler callback to show toast notifications for errors
   */
  private handleAppError = (error: AppError) => {
    // Map severity to notification type
    let type: NotificationType;
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.ERROR:
        type = NotificationType.ERROR;
        break;
      case ErrorSeverity.WARNING:
        type = NotificationType.WARNING;
        break;
      case ErrorSeverity.INFO:
      default:
        type = NotificationType.INFO;
        break;
    }
    
    // Customize notification based on error category
    let title = 'Error';
    let closeAfterMs = 5000; // Default 5 seconds
    
    switch (error.category) {
      case ErrorCategory.BLOCKCHAIN:
        title = 'Blockchain Error';
        closeAfterMs = 6000; // Longer for blockchain errors
        break;
      case ErrorCategory.CONTRACT:
        title = 'Smart Contract Error';
        closeAfterMs = 6000;
        break;
      case ErrorCategory.NETWORK:
        title = 'Network Error';
        closeAfterMs = 4000;
        break;
      case ErrorCategory.USER_INPUT:
        title = 'Validation Error';
        closeAfterMs = 4000;
        break;
      case ErrorCategory.AUTHENTICATION:
        title = 'Authentication Error';
        closeAfterMs = 5000;
        break;
      case ErrorCategory.API:
        title = 'API Error';
        closeAfterMs = 5000;
        break;
      default:
        title = 'Error';
        closeAfterMs = 5000;
    }
    
    // Show the notification
    this.notify({
      title,
      description: error.message,
      type,
      closeAfterMs,
      autoClose: true
    });
  };
  
  /**
   * Show a success notification
   * @param description Success message
   * @param options Additional notification options
   */
  success(description: string, options: Partial<NotificationOptions> = {}) {
    this.notify({
      description,
      type: NotificationType.SUCCESS,
      autoClose: true,
      closeAfterMs: 4000,
      ...options
    });
  }
  
  /**
   * Show an info notification
   * @param description Info message
   * @param options Additional notification options
   */
  info(description: string, options: Partial<NotificationOptions> = {}) {
    this.notify({
      description,
      type: NotificationType.INFO,
      autoClose: true,
      closeAfterMs: 4000,
      ...options
    });
  }
  
  /**
   * Show a warning notification
   * @param description Warning message
   * @param options Additional notification options
   */
  warning(description: string, options: Partial<NotificationOptions> = {}) {
    this.notify({
      description,
      type: NotificationType.WARNING,
      autoClose: true,
      closeAfterMs: 5000,
      ...options
    });
  }
  
  /**
   * Show an error notification
   * @param description Error message
   * @param options Additional notification options
   */
  error(description: string, options: Partial<NotificationOptions> = {}) {
    this.notify({
      description,
      type: NotificationType.ERROR,
      autoClose: true,
      closeAfterMs: 6000,
      ...options
    });
  }
  
  /**
   * Show a blockchain transaction notification with status updates
   * @param txHash Transaction hash
   * @param networkId Network ID for explorer link
   * @param options Additional notification options
   * @returns Toast ID for updating the notification
   */
  transaction(txHash: string, networkId: string = 'sepolia', options: Partial<NotificationOptions> = {}) {
    // Create explorer link based on network
    const explorerBaseUrl = networkId === 'mainnet' 
      ? 'https://etherscan.io' 
      : `https://${networkId}.etherscan.io`;
    
    const explorerUrl = `${explorerBaseUrl}/tx/${txHash}`;
    
    // Show initial notification
    const toastId = toast.loading(
      `Transaction pending. Click to view on Etherscan.`,
      {
        duration: Infinity,
        position: 'bottom-right',
        onClick: () => {
          window.open(explorerUrl, '_blank');
        },
        ...options
      }
    );
    
    return toastId;
  }
  
  /**
   * Update a transaction notification
   * @param toastId Toast ID to update
   * @param status Transaction status
   * @param message Optional message override
   */
  updateTransaction(toastId: string, status: 'success' | 'error' | 'loading', message?: string) {
    switch (status) {
      case 'success':
        toast.success(
          message || 'Transaction confirmed!', 
          { id: toastId, duration: 5000 }
        );
        break;
      case 'error':
        toast.error(
          message || 'Transaction failed', 
          { id: toastId, duration: 7000 }
        );
        break;
      case 'loading':
        toast.loading(
          message || 'Transaction in progress...', 
          { id: toastId, duration: Infinity }
        );
        break;
    }
  }
  
  /**
   * Show a custom notification
   * @param options Notification options
   */
  notify(options: NotificationOptions) {
    const { 
      title, 
      description, 
      type = NotificationType.INFO,
      autoClose = true,
      closeAfterMs = 4000,
      ...rest
    } = options;
    
    // Convert type to toast function
    let toastFn;
    switch (type) {
      case NotificationType.SUCCESS:
        toastFn = toast.success;
        break;
      case NotificationType.ERROR:
        toastFn = toast.error;
        break;
      case NotificationType.WARNING:
        // React Hot Toast doesn't have a direct warning type, use custom
        toastFn = (message: string, options?: ToastOptions) => 
          toast(message, { 
            ...options,
            icon: '⚠️' 
          });
        break;
      case NotificationType.INFO:
      default:
        toastFn = toast;
        break;
    }
    
    // Format message with title if provided
    const message = title ? `${title}: ${description}` : description;
    
    // Show the toast
    toastFn(message, {
      duration: autoClose ? closeAfterMs : Infinity,
      position: 'bottom-center',
      ...rest
    });
  }
  
  /**
   * Dismiss all active notifications
   */
  dismissAll() {
    toast.dismiss();
  }
}

// Export singleton instance
export const NotificationService = new NotificationServiceClass();

// Initialize the service during import
NotificationService.initialize();
