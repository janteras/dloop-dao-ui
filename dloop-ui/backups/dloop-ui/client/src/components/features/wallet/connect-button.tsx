import { Button } from '@/components/ui/button';
import { useWagmiWallet } from './wagmi-wallet-provider';
import { Loader2 } from 'lucide-react';

interface ConnectButtonProps {
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ConnectButton({ size = 'default', className = '' }: ConnectButtonProps) {
  const { isConnected, isLoading, connect } = useWagmiWallet();
  
  if (isConnected) {
    return null;
  }
  
  return (
    <Button 
      size={size} 
      onClick={connect} 
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : (
        'Connect Wallet'
      )}
    </Button>
  );
}