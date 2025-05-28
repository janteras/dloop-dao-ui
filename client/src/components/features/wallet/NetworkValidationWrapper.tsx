
import React from 'react';
import { useNetworkValidation } from '@/hooks/useNetworkValidation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface NetworkValidationWrapperProps {
  children: React.ReactNode;
  showAlert?: boolean;
  className?: string;
}

export default function NetworkValidationWrapper({ 
  children, 
  showAlert = true, 
  className 
}: NetworkValidationWrapperProps) {
  const { isCorrectNetwork, currentNetwork, switchToSepolia } = useNetworkValidation();
  const [isSwitching, setIsSwitching] = React.useState(false);

  const handleSwitchNetwork = async () => {
    setIsSwitching(true);
    try {
      await switchToSepolia();
    } catch (error) {
      console.error('Failed to switch network:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  if (!isCorrectNetwork && showAlert) {
    return (
      <div className={className}>
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Wrong Network Detected</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 mt-2">
            <p>
              You're currently connected to <strong>{currentNetwork}</strong>. 
              This application requires connection to <strong>Sepolia Testnet</strong> to function properly.
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSwitchNetwork}
                disabled={isSwitching}
              >
                {isSwitching ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Switch to Sepolia
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('https://chainlist.org/chain/11155111', '_blank')}
              >
                Add Sepolia Manually
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        {/* Still render children but in a disabled state */}
        <div className="opacity-50 pointer-events-none">
          {children}
        </div>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}
