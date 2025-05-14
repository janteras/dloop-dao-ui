import React from 'react';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { Button } from '@/components/ui/button';
import { shortenAddress } from '@/lib/utils';
import { QrCode, Loader2 } from 'lucide-react';

interface WalletConnectButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * A button component that allows users to connect via WalletConnect
 */
export function WalletConnectButton({
  variant = 'default',
  size = 'default',
  className = ''
}: WalletConnectButtonProps) {
  const {
    address,
    isConnected,
    isConnecting,
    connect,
    disconnect
  } = useWalletConnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">
          {shortenAddress(address)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className={className}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => connect()}
      disabled={isConnecting}
      className={`flex items-center space-x-2 ${className}`}
    >
      {isConnecting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <QrCode className="h-4 w-4" />
      )}
      <span>WalletConnect</span>
    </Button>
  );
}