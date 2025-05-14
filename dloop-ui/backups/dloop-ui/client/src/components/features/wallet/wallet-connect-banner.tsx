import { Card, CardContent } from '@/components/ui/card';
import { Wallet, ExternalLink, CheckCircle, Shield, HelpCircle } from 'lucide-react';
import { ConnectWalletButton } from './connect-wallet-button';
import { WalletGuideModal } from './wallet-guide-modal';
import { useWallet } from './simplified-wallet-provider';
import { useState, useEffect } from 'react';

export function WalletConnectBanner() {
  const { isConnected } = useWallet();
  const [walletLogos, setWalletLogos] = useState<string[]>([]);
  
  // Load wallet logos
  useEffect(() => {
    // Use locally stored wallet logos to avoid external dependencies
    setWalletLogos([
      '/images/metamask-fox.svg',
      '/images/coinbase-wallet.svg',
      '/images/walletconnect.svg'
    ]);
  }, []);
  
  // Only show this banner if user is not connected
  if (isConnected) {
    return null;
  }
  
  return (
    <Card className="overflow-hidden border-none shadow-lg wallet-card-shadow">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 animate-gradient"></div>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
              <Wallet size={32} />
            </div>
            
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold">Connect Your Wallet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-md">
                Access the D-Loop governance protocol with WalletConnect v2, MetaMask, or Coinbase Wallet
              </p>
              
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center text-xs text-muted-foreground">
                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                  <span>Sepolia Testnet</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Shield className="h-3 w-3 mr-1 text-blue-500" />
                  <span>Secure Connection</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            {/* Show supported wallet logos */}
            <div className="flex items-center gap-2 mb-1">
              {walletLogos.map((logo, index) => (
                <div key={index} className="h-6 w-6 rounded-full overflow-hidden bg-white p-0.5">
                  <img src={logo} alt="Wallet" className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <ConnectWalletButton 
                variant="default" 
                showTooltip={false}
                className="w-full md:w-auto whitespace-nowrap gap-2 font-medium shadow-md"
              />
              <WalletGuideModal triggerClassName="flex-shrink-0">
                <HelpCircle className="h-4 w-4" />
              </WalletGuideModal>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}