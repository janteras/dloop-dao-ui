import { ReactNode } from 'react';
import toast from 'react-hot-toast';

/**
 * Toast notification properties
 * @interface ToastProps
 * @property {string} id - Unique identifier for the toast
 * @property {ReactNode} [title] - Optional title content
 * @property {ReactNode} [description] - Optional description content
 * @property {ReactNode} [action] - Optional action button or element
 * @property {'default' | 'destructive'} [variant] - Toast style variant
 * @property {number} [duration] - Duration in milliseconds before auto-dismissal
 */
export type ToastProps = {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: 'default' | 'destructive';
  duration?: number;
};

/**
 * Custom hook for managing toast notifications across the application
 * Provides a consistent interface for creating, updating, and dismissing toasts
 * 
 * @returns {Object} Toast management methods
 * @property {Function} toast - Function to create a new toast notification
 * @property {Function} dismiss - Function to dismiss a specific toast by ID
 * @property {Function} dismissAll - Function to dismiss all active toasts
 */
export function useToast() {
  /**
   * Dispatches a custom event to the document
   * @param {Object} action - The action to dispatch
   * @param {string} action.type - The event type
   * @param {any} action.data - The event data
   * @private
   */
  function dispatch(action: any) {
    const event = new CustomEvent(action.type, {
      detail: action.data,
    });
    document.dispatchEvent(event);
  }

  /**
   * Shows a toast notification
   * @param {Partial<ToastProps>} props - The toast properties
   * @returns {string} The ID of the created toast
   */
  function showToast(props: Partial<ToastProps>) {
    const id = props.id || `toast-${Date.now()}`;
    
    if (props.variant === 'destructive') {
      // Display an error toast with red styling
      return toast.error(props.description as string, {
        id,
        duration: props.duration || 5000,
        position: 'top-right',
      });
    }
    
    // Default toast
    return toast(props.description as string, {
      id,
      duration: props.duration || 3000,
      position: 'top-right',
    });
  }

  /**
   * Dismisses a specific toast by ID
   * @param {string} toastId - The ID of the toast to dismiss
   */
  function dismissToast(toastId: string) {
    toast.dismiss(toastId);
  }

  /**
   * Dismisses all active toasts
   */
  function dismissAllToasts() {
    toast.dismiss();
  }

  return {
    toast: showToast,
    dismiss: dismissToast,
    dismissAll: dismissAllToasts,
  };
}
