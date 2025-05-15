import { useContext } from 'react';
import { WalletContext, WalletContextProps } from '@/components/features/wallet/wagmi-wallet-provider';

export function useWallet(): WalletContextProps {
  const context = useContext(WalletContext);
  
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  
  return context;
}