import React, { useState, useEffect } from 'react';
import { useWallet } from './wallet-connect-provider';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Wallet, QrCode, ChevronDown, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { shortenAddress } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface MultiWalletConnectButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function MultiWalletConnectButton({ 
  variant = 'default', 
  size = 'default',
  className = ''
}: MultiWalletConnectButtonProps) {
  const { isConnected, address, connect, disconnect } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  const [connectingType, setConnectingType] = useState<'metamask' | 'walletconnect' | null>(null);
  const [connectState, setConnectState] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [animate, setAnimate] = useState(false);
  
  // Subtle attention-grabbing animation every 15 seconds
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      const interval = setInterval(() => {
        setAnimate(true);
        setTimeout(() => setAnimate(false), 1000);
      }, 15000);
      
      return () => clearInterval(interval);
    }
  }, [isConnected, isConnecting]);

  const handleConnect = async (type: 'metamask' | 'walletconnect') => {
    try {
      setIsConnecting(true);
      setConnectingType(type);
      setConnectState('connecting');
      await connect(type);
      setConnectState('success');
      // Reset after showing success state briefly
      setTimeout(() => {
        setConnectState('idle');
        setConnectingType(null);
      }, 1500);
    } catch (error) {
      console.error(`Error connecting with ${type}:`, error);
      setConnectState('error');
      // Reset after showing error state
      setTimeout(() => {
        setConnectState('idle');
        setConnectingType(null);
        setIsConnecting(false);
      }, 2000);
    } finally {
      if (connectState !== 'error') {
        setIsConnecting(false);
      }
    }
  };

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size={size}
            className={cn(
              "flex items-center gap-2 transition-all duration-300 relative overflow-hidden",
              "hover:shadow-md hover:border-accent/60 group",
              className
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="z-10 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-accent-foreground transition-transform duration-300 group-hover:scale-110" />
              <span className="hidden md:inline relative">
                {shortenAddress(address)}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/50 transition-all duration-500 group-hover:w-full"></span>
              </span>
              <span className="inline md:hidden">{shortenAddress(address, 3)}</span>
              <ChevronDown className="h-4 w-4 transition-transform duration-300 group-hover:rotate-180" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="border-accent/20 animate-in fade-in-80 duration-200">
          <DropdownMenuItem 
            onClick={() => disconnect()}
            className="group focus:bg-destructive/10 transition-all duration-300 hover:pl-4"
          >
            <span className="relative flex items-center">
              <XCircle className="h-4 w-4 mr-2 transition-all duration-300 group-hover:text-destructive" />
              <span>Disconnect</span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-destructive/50 transition-all duration-500 group-hover:w-full"></span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={cn(
            "flex items-center gap-2 transition-all duration-300 relative overflow-hidden", 
            animate ? "scale-105" : "",
            isConnecting ? "bg-primary/90" : "",
            "hover:shadow-md group",
            className
          )}
          disabled={isConnecting}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/15 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="z-10 flex items-center gap-2">
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin text-accent-foreground" />
            ) : (
              <Wallet className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
            )}
            <span className="hidden md:inline relative">
              Connect Wallet
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/60 transition-all duration-500 group-hover:w-full"></span>
            </span>
            <span className="inline md:hidden">Connect</span>
            <ChevronDown className={cn(
              "h-4 w-4 transition-transform duration-300",
              isConnecting ? "opacity-0" : "group-hover:rotate-180"
            )} />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-accent/20 animate-in fade-in-80 duration-200">
        <DropdownMenuItem 
          onClick={() => handleConnect('metamask')}
          disabled={connectingType === 'walletconnect'}
          className={cn(
            "group transition-all duration-300 hover:pl-4 relative",
            connectingType === 'metamask' ? 'cursor-not-allowed bg-muted' : ''
          )}
        >
          <div className="flex items-center relative">
            {connectingType === 'metamask' ? (
              <>
                {connectState === 'connecting' && (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin text-accent" />
                )}
                {connectState === 'success' && (
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                )}
                {connectState === 'error' && (
                  <XCircle className="h-5 w-5 mr-2 text-destructive" />
                )}
              </>
            ) : (
              <img 
                src="https://app.uniswap.org/static/media/metamask-fox.9c21bc5f44a9f6d44b08dcda373a6297.svg" 
                alt="MetaMask"
                className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:scale-110"
              />
            )}
            <span className="relative">
              MetaMask
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/60 transition-all duration-300 group-hover:w-full"></span>
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleConnect('walletconnect')}
          disabled={connectingType === 'metamask'}
          className={cn(
            "group transition-all duration-300 hover:pl-4 relative",
            connectingType === 'walletconnect' ? 'cursor-not-allowed bg-muted' : ''
          )}
        >
          <div className="flex items-center relative">
            {connectingType === 'walletconnect' ? (
              <>
                {connectState === 'connecting' && (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin text-accent" />
                )}
                {connectState === 'success' && (
                  <CheckCircle2 className="h-5 w-5 mr-2 text-green-500" />
                )}
                {connectState === 'error' && (
                  <XCircle className="h-5 w-5 mr-2 text-destructive" />
                )}
              </>
            ) : (
              <QrCode className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
            )}
            <span className="relative">
              WalletConnect
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent/60 transition-all duration-300 group-hover:w-full"></span>
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}