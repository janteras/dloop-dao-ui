import { ReactNode } from 'react';
import toast from 'react-hot-toast';

export type ToastProps = {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: 'default' | 'destructive';
  duration?: number;
};

// This is a custom hook to manage toasts
export function useToast() {
  function dispatch(action: any) {
    const event = new CustomEvent(action.type, {
      detail: action.data,
    });
    document.dispatchEvent(event);
  }

  function generateId() {
    return Math.random().toString(36).substring(2, 9);
  }

  function create(props: Omit<ToastProps, 'id'> & { id?: string }) {
    const id = props.id || generateId();
    const toastData = { ...props, id };
    
    // Use react-hot-toast for actual toast display
    if (props.variant === 'destructive') {
      toast.error(props.title as string || props.description as string || 'Error', {
        id,
        duration: props.duration || 5000,
      });
    } else {
      toast(props.title as string || props.description as string || 'Notification', {
        id,
        duration: props.duration || 5000,
      });
    }

    // Also dispatch an event for our custom toast system
    dispatch({
      type: 'add-toast',
      data: { toast: toastData },
    });

    return id;
  }

  function dismiss(toastId?: string) {
    toast.dismiss(toastId);
    
    dispatch({
      type: 'remove-toast',
      data: { toastId },
    });
  }

  return {
    toast: create,
    dismiss,
  };
}