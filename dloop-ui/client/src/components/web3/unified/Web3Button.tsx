import React from 'react';
import { Button, ButtonProps } from '@/components/atoms/Button/Button';
import { Web3ComponentProps } from '@/components/Component.interface';
import { useFeatureFlag } from '@/config/feature-flags';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { 
  Wallet, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown 
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface Web3ButtonProps extends Web3ComponentProps, Omit<ButtonProps, 'onClick'> {
  /** Whether to show full address on button */
  showFullAddress?: boolean;
  /** Whether to show balance on button */
  showBalance?: boolean;
  /** Whether to show network name */
  showNetwork?: boolean;
  /** Custom actions to add to dropdown */
  customActions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  }[];
}

/**
 * Web3Button component that handles wallet connection
 * Works with both Ethers and Wagmi implementations
 */
export const Web3Button: React.FC<Web3ButtonProps> = ({ 
  showFullAddress = false,
  showBalance = false,
  showNetwork = false,
  customActions = [],
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  // Use the unified wallet hook that supports both implementations
  const { 
    isConnected, 
    address, 
    balance, 
    connect, 
    disconnect,
    isLoading,
    implementation
  } = useUnifiedWallet();
  
  // Format the address for display
  const displayAddress = React.useMemo(() => {
    if (!address) return '';
    
    if (showFullAddress) {
      return address;
    }
    
    // Format as 0x1234...5678
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address, showFullAddress]);
  
  // Format the balance for display
  const displayBalance = React.useMemo(() => {
    if (!balance) return '';
    
    // Parse the balance and limit to 4 decimal places
    const numBalance = parseFloat(balance);
    return numBalance.toFixed(4);
  }, [balance]);
  
  // Handle wallet connection
  const handleConnect = () => {
    connect();
  };
  
  // Handle wallet disconnection
  const handleDisconnect = () => {
    disconnect();
  };
  
  // Not connected state - show connect button
  if (!isConnected) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        isLoading={isLoading}
        onClick={handleConnect}
        {...props}
      >
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }
  
  // Connected state - show address with dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={className}
          {...props}
        >
          <div className="flex items-center">
            <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
            <span>{displayAddress}</span>
            {showBalance && (
              <span className="ml-2 text-gray-400">{displayBalance} ETH</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span>Connected Wallet</span>
            <span className="text-xs text-gray-400">
              Using {implementation === 'wagmi' ? 'Wagmi' : 'Ethers'} implementation
            </span>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer" onClick={() => {
          navigator.clipboard.writeText(address || '');
        }}>
          Copy Address
        </DropdownMenuItem>
        
        {showBalance && (
          <DropdownMenuItem className="cursor-default">
            Balance: {displayBalance} ETH
          </DropdownMenuItem>
        )}
        
        {showNetwork && (
          <DropdownMenuItem className="cursor-default">
            Network: Sepolia
          </DropdownMenuItem>
        )}
        
        {customActions.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {customActions.map((action, index) => (
              <DropdownMenuItem 
                key={index}
                className="cursor-pointer"
                onClick={action.onClick}
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer text-red-500" onClick={handleDisconnect}>
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
