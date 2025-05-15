import React from 'react';
import { Button } from '@/components/common/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/common/ui/dropdown-menu';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress, formatCurrency } from '@/lib/utils';

/**
 * A button component that handles wallet connection and displays connected wallet information
 */
export function ConnectButton() {
  const { isConnected, address, balance, connect, disconnect, rageQuit, isRageQuitting } = useWallet();

  if (!isConnected) {
    return (
      <Button onClick={connect} variant="default">
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span>{shortenAddress(address)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex justify-between cursor-default">
          <span>Address</span>
          <span className="font-mono text-xs">{shortenAddress(address)}</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="flex justify-between cursor-default">
          <span>Balance</span>
          <span>{balance !== undefined ? `${balance.toFixed(4)} ETH` : 'Loading...'}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={disconnect} className="text-destructive">
          Disconnect
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={rageQuit} 
          disabled={isRageQuitting}
          className="text-destructive"
        >
          {isRageQuitting ? 'Processing...' : 'Rage Quit Protocol'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}