import React, { useState } from 'react';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Wallet, QrCode } from 'lucide-react';
import { shortenAddress } from '@/lib/utils';

interface AdvancedConnectButtonProps {
  className?: string;
}

/**
 * An advanced connect button that offers both MetaMask and WalletConnect options
 */
export function AdvancedConnectButton({ className = '' }: AdvancedConnectButtonProps) {
  // Get MetaMask connection state and functions
  const {
    isConnected: isMetaMaskConnected,
    address: metaMaskAddress,
    connect: connectMetaMask,
    disconnect: disconnectMetaMask
  } = useWallet();

  // Get WalletConnect connection state and functions
  const {
    isConnected: isWalletConnectConnected,
    address: walletConnectAddress,
    isConnecting: isWalletConnectConnecting,
    connect: connectWalletConnect,
    disconnect: disconnectWalletConnect
  } = useWalletConnect();

  // Determine if any wallet is connected
  const isAnyWalletConnected = isMetaMaskConnected || isWalletConnectConnected;
  
  // Get the current connected address (prioritize MetaMask)
  const currentAddress = metaMaskAddress || walletConnectAddress;
  
  // Track which provider is actively connected
  const activeProvider = isMetaMaskConnected ? 'metamask' : isWalletConnectConnected ? 'walletconnect' : null;

  // Handle disconnect based on active provider
  const handleDisconnect = () => {
    if (isMetaMaskConnected) {
      disconnectMetaMask();
    } else if (isWalletConnectConnected) {
      disconnectWalletConnect();
    }
  };

  if (isAnyWalletConnected && currentAddress) {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 px-3 py-1 rounded border border-gray-200 dark:border-gray-800 ${className}`}>
          {activeProvider === 'metamask' ? (
            <img
              src="https://app.uniswap.org/static/media/metamask-fox.9c21bc5f44a9f6d44b08dcda373a6297.svg"
              alt="MetaMask"
              className="h-4 w-4 mr-1"
            />
          ) : (
            <QrCode className="h-4 w-4 mr-1" />
          )}
          <span className="text-sm font-medium">
            {shortenAddress(currentAddress)}
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDisconnect}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="default" className={`flex items-center gap-2 ${className}`}>
          <Wallet className="h-4 w-4" />
          <span>Connect Wallet</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuItem 
          onClick={() => connectMetaMask()}
          disabled={isMetaMaskConnected}
          className="flex items-center gap-2"
        >
          <img
            src="https://app.uniswap.org/static/media/metamask-fox.9c21bc5f44a9f6d44b08dcda373a6297.svg"
            alt="MetaMask"
            className="h-5 w-5"
          />
          <span>MetaMask</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => connectWalletConnect()}
          disabled={isWalletConnectConnected || isWalletConnectConnecting}
          className="flex items-center gap-2"
        >
          <QrCode className="h-5 w-5" />
          <span>WalletConnect</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}