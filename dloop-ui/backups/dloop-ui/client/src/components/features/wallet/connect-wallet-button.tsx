import { Button } from '@/components/ui/button';
import { useWallet } from './simplified-wallet-provider';
import { Loader2, Wallet, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';

interface ConnectWalletButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showTooltip?: boolean;
}

export function ConnectWalletButton({ 
  className = '', 
  variant = 'default',
  size = 'default',
  showTooltip = true
}: ConnectWalletButtonProps) {
  const { isConnected, connect } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [animate, setAnimate] = useState(false);
  
  // Subtle attention-grabbing animation every 10 seconds
  useEffect(() => {
    if (!isConnected && !isLoading) {
      const interval = setInterval(() => {
        setAnimate(true);
        setTimeout(() => setAnimate(false), 1000);
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [isConnected, isLoading]);
  
  if (isConnected) {
    return null;
  }
  
  const buttonContent = (
    <Button 
      size={size} 
      variant={variant}
      onClick={async () => {
        try {
          setIsLoading(true);
          await connect();
        } finally {
          setIsLoading(false);
        }
      }} 
      disabled={isLoading}
      className={`relative flex items-center gap-2 transition-all wallet-connect-btn wallet-btn-glow ${animate ? 'scale-105' : ''} ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Connecting...</span>
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
          {/* Subtle glow effect when not connected */}
          <span className="absolute inset-0 rounded-md bg-primary/20 blur-sm -z-10"></span>
        </>
      )}
    </Button>
  );
  
  // Wrap in tooltip only if showTooltip is true
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent align="end" className="max-w-xs">
            <div className="flex flex-col gap-2">
              <p>Connect with MetaMask, WalletConnect, or Coinbase Wallet</p>
              <div className="flex items-center text-xs text-muted-foreground">
                <ExternalLink className="h-3 w-3 mr-1" />
                <span>Connects to Sepolia Testnet</span>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return buttonContent;
}