import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { useUnifiedNetworkSwitching } from '@/hooks/useUnifiedNetworkSwitching';

interface NetworkSwitchPromptProps {
  isConnected: boolean;
  onNetworkSwitched?: () => void;
}

export function NetworkSwitchPrompt({ isConnected, onNetworkSwitched }: NetworkSwitchPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasPrompted, setHasPrompted] = useState(false);
  const { 
    isSwitching, 
    isCorrectNetwork, 
    currentChainId, 
    switchToSepolia, 
    validateNetwork 
  } = useUnifiedNetworkSwitching();

  // Validate network when connection status changes
  useEffect(() => {
    if (isConnected) {
      validateNetwork().then((isCorrect) => {
        if (!isCorrect && !hasPrompted) {
          setShowPrompt(true);
          setHasPrompted(true);
        }
      });
    }
  }, [isConnected, validateNetwork, hasPrompted]);

  // Listen for network changes
  useEffect(() => {
    if (window.ethereum) {
      const handleChainChanged = () => {
        setTimeout(() => {
          validateNetwork().then((isCorrect) => {
            if (!isCorrect && isConnected) {
              setShowPrompt(true);
            } else if (isCorrect) {
              setShowPrompt(false);
              onNetworkSwitched?.();
            }
          });
        }, 100);
      };

      window.ethereum.on('chainChanged', handleChainChanged);
      return () => {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [isConnected, validateNetwork, onNetworkSwitched]);

  const handleSwitchNetwork = async () => {
    const success = await switchToSepolia();
    if (success) {
      setShowPrompt(false);
      onNetworkSwitched?.();
    }
  };

  const getNetworkName = (chainId: string | null): string => {
    const networks: Record<string, string> = {
      '0x1': 'Ethereum Mainnet',
      '0xaa36a7': 'Sepolia Testnet',
      '0x89': 'Polygon',
      '0x38': 'BNB Chain',
    };
    return networks[chainId || ''] || 'Unknown Network';
  };

  // Show prompt if wrong network is detected, even without explicit user prompt
  if (!isConnected) {
    return null;
  }

  // Always show if on wrong network
  if (!isCorrectNetwork && currentChainId === '0x1') {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">
            You're on Ethereum Mainnet. D-Loop contracts are on Sepolia Testnet.
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              const success = await switchToSepolia();
              if (success) setShowPrompt(false);
            }}
            disabled={isSwitching}
            className="ml-2 bg-white text-red-600 hover:bg-gray-100"
          >
            {isSwitching ? "Switching..." : "Switch to Sepolia"}
          </Button>
        </div>
      </div>
    );
  }

  if (!showPrompt) {
    return null;
  }

  return (
    <>
      {/* Persistent Warning Banner */}
      {!isCorrectNetwork && isConnected && (
        <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-yellow-800 dark:text-yellow-200">
              Wrong network detected: {getNetworkName(currentChainId)}. 
              Switch to Sepolia Testnet to use D-Loop.
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowPrompt(true)}
              className="ml-2"
            >
              Switch Network
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Network Switch Dialog */}
      <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-yellow-500" />
              Wrong Network Detected
            </DialogTitle>
            <DialogDescription>
              D-Loop requires Sepolia Testnet to function properly. 
              You're currently connected to {getNetworkName(currentChainId)}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert>
              <Wifi className="h-4 w-4" />
              <AlertDescription>
                <strong>Required Network:</strong> Sepolia Testnet<br />
                <strong>Current Network:</strong> {getNetworkName(currentChainId)}
              </AlertDescription>
            </Alert>

            <div className="text-sm text-muted-foreground">
              <p>Benefits of switching to Sepolia:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Access all D-Loop protocol features</li>
                <li>Participate in governance and voting</li>
                <li>Manage AI nodes and delegations</li>
                <li>Test with free Sepolia ETH</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPrompt(false)}
              disabled={isSwitching}
            >
              Later
            </Button>
            <Button 
              onClick={handleSwitchNetwork}
              disabled={isSwitching}
              className="min-w-[100px]"
            >
              {isSwitching ? 'Switching...' : 'Switch to Sepolia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}