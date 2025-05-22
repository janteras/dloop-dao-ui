import React from 'react';
import { BaseComponentProps } from '@/components/Component.interface';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

export type ButtonVariant = 
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'link'
  | 'destructive'
  | 'success';

export type ButtonSize = 
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'icon';

export interface ButtonProps extends BaseComponentProps {
  /** Button variant style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Button content */
  children: React.ReactNode;
  /** Button click handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Button type */
  type?: 'button' | 'submit' | 'reset';
  /** Additional props */
  [x: string]: any;
}

/**
 * Button component that follows the design system
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      className = '',
      children,
      onClick,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Base classes that are always applied
    const baseClasses = 'font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50';
    
    // Classes that vary based on variant
    const variantClasses = {
      primary: 'bg-accent hover:bg-accent/90 text-white',
      secondary: 'bg-dark-gray hover:bg-dark-gray/90 text-white',
      outline: 'border border-dark-gray hover:bg-dark-bg/50 text-white',
      ghost: 'hover:bg-dark-bg text-gray-400 hover:text-white',
      link: 'text-accent underline-offset-4 hover:underline hover:text-accent/90',
      destructive: 'bg-red-900/80 text-white hover:bg-red-900/90',
      success: 'bg-green-900/80 text-white hover:bg-green-900/90',
    };
    
    // Classes that vary based on size
    const sizeClasses = {
      xs: 'h-7 px-2 text-xs rounded-md',
      sm: 'h-9 px-3 text-sm rounded-md',
      md: 'h-10 px-4 py-2 rounded-md',
      lg: 'h-12 px-6 py-3 text-lg rounded-md',
      icon: 'h-10 w-10 rounded-full flex items-center justify-center',
    };
    
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        onClick={onClick}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Spinner size={size === 'xs' || size === 'sm' ? 'sm' : 'md'} />
            <span className="ml-2">{children}</span>
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);
