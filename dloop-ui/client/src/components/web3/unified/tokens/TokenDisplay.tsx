import React from 'react';
import { BaseComponentProps } from '@/components/Component.interface';
import { cn } from '@/lib/utils';
import { useTokenInfo } from '@/lib/unified-token-utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface TokenDisplayProps extends BaseComponentProps {
  /** Token address */
  tokenAddress: string;
  /** Token amount (raw) */
  amount?: string | bigint;
  /** Whether to show the token icon */
  showIcon?: boolean;
  /** Whether to show the token symbol */
  showSymbol?: boolean;
  /** Whether to show the token name */
  showName?: boolean;
  /** Whether to make the address clickable to block explorer */
  clickableAddress?: boolean;
  /** Size of the display */
  size?: 'sm' | 'md' | 'lg';
  /** Custom formatter for the amount */
  amountFormatter?: (amount: string | bigint) => string;
}

/**
 * TokenDisplay component for showing token information and amounts
 * Uses the unified token utilities to support both implementations
 */
export const TokenDisplay: React.FC<TokenDisplayProps> = ({
  tokenAddress,
  amount,
  showIcon = true,
  showSymbol = true,
  showName = false,
  clickableAddress = false,
  size = 'md',
  className = '',
  amountFormatter,
  ...props
}) => {
  const [copied, setCopied] = React.useState(false);
  const { symbol, name, isLoading } = useTokenInfo(tokenAddress);
  
  // Handle copy address to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(tokenAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Get the block explorer URL
  const getExplorerUrl = () => {
    // This would be configurable based on the network
    return `https://sepolia.etherscan.io/token/${tokenAddress}`;
  };
  
  // Size-based classes
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };
  
  // If loading, show skeleton
  if (isLoading) {
    return (
      <div className={cn("flex items-center space-x-2", className)} {...props}>
        {showIcon && <Skeleton className="h-6 w-6 rounded-full" />}
        <div className="flex flex-col">
          {showSymbol && <Skeleton className="h-4 w-16" />}
          {showName && <Skeleton className="h-3 w-24 mt-1" />}
        </div>
      </div>
    );
  }
  
  // Format amount if provided
  const formattedAmount = React.useMemo(() => {
    if (!amount) return '';
    
    if (amountFormatter) {
      return amountFormatter(amount);
    }
    
    // Default formatting - this would use your token utils
    // Just a placeholder for now
    const numAmount = typeof amount === 'bigint' ? 
      Number(amount) / 10**18 : 
      Number(amount) / 10**18;
    
    return numAmount.toLocaleString(undefined, {
      maximumFractionDigits: 6,
    });
  }, [amount, amountFormatter]);
  
  return (
    <div 
      className={cn(
        "flex items-center", 
        sizeClasses[size],
        className
      )} 
      {...props}
    >
      {showIcon && (
        <div className="mr-2 rounded-full overflow-hidden bg-dark-gray flex-shrink-0">
          {/* This would be replaced with an actual token icon system */}
          <div className={cn(
            "flex items-center justify-center text-white font-medium",
            size === 'sm' ? 'h-5 w-5 text-[10px]' : 
            size === 'md' ? 'h-6 w-6 text-xs' : 
            'h-8 w-8 text-sm'
          )}>
            {symbol?.slice(0, 1)}
          </div>
        </div>
      )}
      
      <div className="flex flex-col">
        <div className="flex items-center">
          {amount && (
            <span className="font-medium text-white mr-1">
              {formattedAmount}
            </span>
          )}
          
          {showSymbol && (
            <span className="text-gray-300">
              {symbol || '???'}
            </span>
          )}
          
          {clickableAddress && (
            <div className="flex items-center ml-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleCopy}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {copied ? (
                        <Check className={cn(
                          "text-green-500",
                          size === 'sm' ? 'h-3 w-3' : 
                          size === 'md' ? 'h-4 w-4' : 
                          'h-5 w-5'
                        )} />
                      ) : (
                        <Copy className={cn(
                          size === 'sm' ? 'h-3 w-3' : 
                          size === 'md' ? 'h-4 w-4' : 
                          'h-5 w-5'
                        )} />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copied ? 'Copied!' : 'Copy address'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <a
                href={getExplorerUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white transition-colors ml-1"
              >
                <ExternalLink className={cn(
                  size === 'sm' ? 'h-3 w-3' : 
                  size === 'md' ? 'h-4 w-4' : 
                  'h-5 w-5'
                )} />
              </a>
            </div>
          )}
        </div>
        
        {showName && name && (
          <span className={cn(
            "text-gray-400",
            size === 'sm' ? 'text-[10px]' : 
            size === 'md' ? 'text-xs' : 
            'text-sm'
          )}>
            {name}
          </span>
        )}
      </div>
    </div>
  );
};
