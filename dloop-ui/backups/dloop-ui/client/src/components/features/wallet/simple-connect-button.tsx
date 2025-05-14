import React from 'react';
import { Button } from '@/components/ui/button';
import { useWallet } from './simplified-wallet-provider';
import { shortenAddress } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Wallet, LogOut } from 'lucide-react';

export function SimpleConnectButton() {
  const { isConnected, address, balance, connect, disconnect } = useWallet();

  const handleConnectClick = async () => {
    if (isConnected) {
      disconnect();
    } else {
      await connect();
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isConnected ? "outline" : "default"}
            className="flex items-center gap-2"
            onClick={handleConnectClick}
          >
            {isConnected ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="mr-1 hidden sm:inline">
                    {shortenAddress(address || '')}
                  </span>
                  <span className="hidden md:inline text-muted-foreground">
                    {balance ? `${(+balance).toFixed(4)} ETH` : ''}
                  </span>
                  <LogOut className="h-4 w-4" />
                </div>
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isConnected
            ? 'Connected to Ethereum. Click to disconnect.'
            : 'Connect to Ethereum with MetaMask'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}