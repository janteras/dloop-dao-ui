import { Button } from '@/components/ui/button';
import { useWallet } from './simplified-wallet-provider';
import { Loader2, Wallet, ExternalLink, Shield, CheckCircle2, XCircle, QrCode } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

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
  const [connectionPhase, setConnectionPhase] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [hovered, setHovered] = useState(false);
  
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
          setConnectionPhase('connecting');
          
          // Simulate connection phases for better UX feedback
          await connect();
          
          setConnectionPhase('success');
          // Reset after successful connection animation
          setTimeout(() => {
            setConnectionPhase('idle');
          }, 1000);
          
        } catch (error) {
          console.error("Connection error:", error);
          setConnectionPhase('error');
          // Reset after error animation
          setTimeout(() => {
            setConnectionPhase('idle');
            setIsLoading(false);
          }, 2000);
        } finally {
          if (connectionPhase !== 'error') {
            setIsLoading(false);
          }
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={isLoading}
      className={cn(
        "relative flex items-center gap-2 transition-all duration-300",
        "hover:shadow-md group overflow-hidden",
        animate ? "scale-105" : "",
        connectionPhase === 'connecting' ? "bg-primary/90" : "",
        connectionPhase === 'success' ? "bg-green-500/90 border-green-400" : "",
        connectionPhase === 'error' ? "bg-destructive/90 border-destructive/80" : "",
        className
      )}
    >
      {/* Background gradient effect */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/15 to-primary/0",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        connectionPhase === 'connecting' ? "animate-pulse" : "",
        connectionPhase === 'success' ? "from-green-500/0 via-green-500/30 to-green-500/0" : "",
        connectionPhase === 'error' ? "from-destructive/0 via-destructive/30 to-destructive/0" : ""
      )}></div>
      
      {/* Button content with icon */}
      <div className="z-10 flex items-center gap-2">
        {connectionPhase === 'connecting' && (
          <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" />
        )}
        {connectionPhase === 'success' && (
          <CheckCircle2 className="h-4 w-4 text-white animate-in zoom-in duration-300" />
        )}
        {connectionPhase === 'error' && (
          <XCircle className="h-4 w-4 text-white animate-in zoom-in duration-300" />
        )}
        {connectionPhase === 'idle' && (
          <Wallet className={cn(
            "h-4 w-4 transition-all duration-300",
            hovered ? "rotate-12 scale-110" : ""
          )} />
        )}
        
        {/* Text content with animation */}
        <span className="relative">
          {connectionPhase === 'connecting' && "Connecting..."}
          {connectionPhase === 'success' && "Connected!"}
          {connectionPhase === 'error' && "Connection Failed"}
          {connectionPhase === 'idle' && "Connect Wallet"}
          
          {/* Animated underline on hover */}
          {connectionPhase === 'idle' && (
            <span className={cn(
              "absolute -bottom-1 left-0 h-0.5 bg-accent/60",
              "transition-all duration-500",
              "w-0 group-hover:w-full"
            )}></span>
          )}
        </span>
        
        {/* Glow effect in background */}
        {connectionPhase === 'idle' && (
          <span className={cn(
            "absolute inset-0 rounded-md bg-primary/20 blur-sm -z-10",
            "transition-opacity duration-300",
            hovered ? "opacity-100" : "opacity-70"
          )}></span>
        )}
        
        {/* Secure connection visual indicator */}
        {hovered && connectionPhase === 'idle' && (
          <Shield className="h-4 w-4 ml-1 animate-in fade-in zoom-in duration-300" />
        )}
      </div>
    </Button>
  );
  
  // Wrap in tooltip only if showTooltip is true
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent 
            align="end" 
            side="bottom"
            className="max-w-xs p-4 animate-in fade-in-50 slide-in-from-top-5 duration-300 border-accent/20 shadow-md"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-primary animate-pulse" />
                </div>
                <p className="font-medium">Connect your crypto wallet</p>
              </div>
              
              <div className="grid grid-cols-3 gap-2 my-1">
                <div className="flex flex-col items-center gap-1 group">
                  <img 
                    src="https://app.uniswap.org/static/media/metamask-fox.9c21bc5f44a9f6d44b08dcda373a6297.svg" 
                    alt="MetaMask"
                    className="h-6 w-6 transition-transform duration-300 group-hover:scale-110"
                  />
                  <span className="text-xs text-muted-foreground">MetaMask</span>
                </div>
                <div className="flex flex-col items-center gap-1 group">
                  <QrCode className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                  <span className="text-xs text-muted-foreground">WalletConnect</span>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                  <Shield className="h-6 w-6" />
                  <span className="text-xs text-muted-foreground">Web3</span>
                </div>
              </div>
              
              <div className="bg-muted/40 rounded p-2 mt-1">
                <div className="flex items-center text-xs text-muted-foreground">
                  <ExternalLink className="h-3 w-3 mr-1.5 flex-shrink-0" />
                  <span className="relative group">
                    Connects to Sepolia Testnet for D-Loop governance
                    <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-accent/40 transition-all duration-500 group-hover:w-full"></span>
                  </span>
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return buttonContent;
}