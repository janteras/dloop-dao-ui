import { Card, CardContent } from '@/components/ui/card';
import { Wallet, ExternalLink, CheckCircle, Shield, HelpCircle } from 'lucide-react';
import { ConnectWalletButton } from './connect-wallet-button';
import { WalletGuideModal } from './wallet-guide-modal';
import { useWallet } from './simplified-wallet-provider';
import { useState } from 'react';

export function WalletConnectBanner() {
  const { isConnected } = useWallet();

  // SVG images with fallbacks
  const logos = [
    { 
      src: '/images/metamask-fox.svg', 
      alt: 'MetaMask',
      fallback: 'https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg'
    },
    { 
      src: '/images/coinbase-wallet.svg', 
      alt: 'Coinbase Wallet',
      fallback: '/images/coinbase-wallet.svg'
    },
    { 
      src: '/images/walletconnect.svg', 
      alt: 'WalletConnect',
      fallback: 'https://avatars.githubusercontent.com/u/37784886'
    },
  ];

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
                Access the D-Loop governance protocol with WalletConnect, MetaMask, or Coinbase Wallet
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
          
          <div className="flex flex-col items-center gap-4"> {/* Increased gap for mobile */}
            {/* Show supported wallet logos with larger targets for mobile */}
            <div className="flex items-center gap-3 mb-2"> {/* Wallet logos */}
              {logos.map((l, i) => (
                <div key={i} className="h-10 w-10 sm:h-8 sm:w-8 rounded-full overflow-hidden bg-white p-1 shadow-sm">
                  <img 
                    src={l.src} 
                    alt={l.alt} 
                    className="h-full w-full object-contain" 
                    onError={(e) => {
                      e.currentTarget.src = l.fallback;
                    }}
                  />
                </div>
              ))}
            </div>
            
            {/* Mobile-friendly instructions */}
            <div className="text-xs text-center text-muted-foreground mb-2 md:hidden">
              <p>Tap the button below to scan QR code or connect with your mobile wallet app</p>
            </div>
            
            <div className="flex gap-3 w-full"> {/* Always full width on mobile */}
              <ConnectWalletButton 
                variant="default" 
                showTooltip={false}
                className="w-full h-12 whitespace-nowrap gap-2 font-medium shadow-md text-base" /* Taller button with larger text */
              />
              <WalletGuideModal triggerClassName="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md border bg-muted/50 hover:bg-muted"> {/* Larger touch target */}
                  <HelpCircle className="h-5 w-5" /> {/* Larger icon */}
                </div>
              </WalletGuideModal>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}