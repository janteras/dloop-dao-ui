
import React from 'react';
import { NetworkSwitchPrompt } from './NetworkSwitchPrompt';
import { useUnifiedNetworkSwitching } from '@/hooks/useUnifiedNetworkSwitching';

interface WalletNetworkGuardProps {
  children: React.ReactNode;
  isConnected: boolean;
}

export function WalletNetworkGuard({ children, isConnected }: WalletNetworkGuardProps) {
  const { isCorrectNetwork } = useUnifiedNetworkSwitching();

  return (
    <>
      <NetworkSwitchPrompt 
        isConnected={isConnected}
        onNetworkSwitched={() => window.location.reload()}
      />
      {children}
    </>
  );
}
