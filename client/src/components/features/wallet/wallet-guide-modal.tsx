import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  Info, 
  ChevronRight, 
  Shield, 
  Smartphone, 
  Laptop, 
  ExternalLink 
} from "lucide-react";
import { useState } from "react";
import { ConnectWalletButton } from "./connect-wallet-button";

interface WalletGuideModalProps {
  triggerClassName?: string;
  children?: React.ReactNode;
}

export function WalletGuideModal({ triggerClassName, children }: WalletGuideModalProps) {
  const [open, setOpen] = useState(false);

  // Check if user is on mobile device
  const isMobile = typeof window !== 'undefined' ? 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : 
    false;

  const walletOptions = [
    {
      name: "MetaMask",
      icon: "/images/metamask-fox.svg",
      fallbackIcon: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg",
      description: isMobile 
        ? "Connect using the MetaMask mobile app (will open automatically if installed)" 
        : "Most popular Ethereum wallet, available as browser extension",
      benefits: isMobile 
        ? ["Install from App Store/Play Store", "Open wallet directly from browser", "Secure key management"] 
        : ["Widely used and supported", "Direct browser integration", "Easy to set up"],
      deviceIcon: isMobile ? <Smartphone className="h-4 w-4 mr-1 text-green-500" /> : <Laptop className="h-4 w-4 mr-1 text-blue-500" />,
      deepLink: "https://metamask.app.link/",
      recommended: true,
    },
    {
      name: "WalletConnect",
      icon: "/images/walletconnect.svg", 
      fallbackIcon: "https://avatars.githubusercontent.com/u/37784886",
      description: isMobile 
        ? "Use your favorite mobile wallet app by scanning a QR code" 
        : "Connect with any supported mobile wallet app via QR code",
      benefits: isMobile 
        ? ["Works with most crypto wallets", "No need to switch apps", "Fast connection"]
        : ["Use your existing mobile wallet", "No browser extension needed", "Works across devices"],
      deviceIcon: <Smartphone className="h-4 w-4 mr-1 text-green-500" />,
      recommended: true,
    },
    {
      name: "Coinbase Wallet",
      icon: "/images/coinbase-wallet.svg",
      fallbackIcon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiByeD0iMTUwIiBmaWxsPSIjMDA1MkZGIi8+CjxwYXRoIGQ9Ik0xNTAgMjAwYzI3LjYxIDAgNTAtMjIuMzkgNTAtNTBzLTIyLjM5LTUwLTUwLTUwLTUwIDIyLjM5LTUwIDUwIDIyLjM5IDUwIDUwIDUweiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+",
      description: isMobile
        ? "Connect using Coinbase Wallet mobile app (will open if installed)"
        : "Backed by Coinbase, one of the largest crypto exchanges",
      benefits: isMobile
        ? ["Easy to use interface", "Install from app stores", "Integrated with Coinbase"]
        : ["User-friendly interface", "Integrated with Coinbase exchange", "Web and mobile versions"],
      deviceIcon: isMobile ? <Smartphone className="h-4 w-4 mr-1 text-green-500" /> : <Laptop className="h-4 w-4 mr-1 text-blue-500" />,
      deepLink: "https://go.cb-w.com/",
      recommended: false,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className={triggerClassName}>
          {children || (
            <>
              <Info className="h-4 w-4 mr-2" />
              <span>Wallet Guide</span>
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Wallet className="mr-2 h-5 w-5" />
            Connect to D-Loop Protocol
          </DialogTitle>
          <DialogDescription>
            Select your preferred wallet to interact with the D-Loop protocol on Sepolia testnet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Mobile specific instructions */}
          {isMobile && (
            <div className="bg-muted/50 rounded-lg p-3 mb-4 border border-border">
              <h4 className="text-sm font-medium flex items-center mb-1">
                <Smartphone className="h-4 w-4 mr-2 text-primary" />
                Mobile Connection Tips
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-start">
                  <ChevronRight className="h-3 w-3 mr-1 text-primary flex-shrink-0 mt-0.5" />
                  <span>Wallet apps will open automatically if installed on your device</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-3 w-3 mr-1 text-primary flex-shrink-0 mt-0.5" />
                  <span>For best experience, install wallet apps before connecting</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-3 w-3 mr-1 text-primary flex-shrink-0 mt-0.5" />
                  <span>Make sure your wallet is set to Sepolia testnet</span>
                </li>
              </ul>
            </div>
          )}

          {walletOptions.map((wallet, index) => (
            <div 
              key={index}
              className={`border rounded-lg p-4 transition-all ${
                wallet.recommended ? 'border-primary/30 bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-white p-1.5 flex items-center justify-center shadow-sm"> {/* Larger icons on mobile */}
                  <img 
                    src={wallet.icon} 
                    alt={wallet.name} 
                    className="h-full w-full object-contain" 
                    onError={(e) => {
                      e.currentTarget.src = wallet.fallbackIcon;
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium flex items-center text-base sm:text-sm"> {/* Larger font on mobile */}
                    {wallet.name}
                    {wallet.deviceIcon && (
                      <span className="ml-2">{wallet.deviceIcon}</span>
                    )}
                    {wallet.recommended && (
                      <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{wallet.description}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2"> {/* Increased spacing between items */}
                {wallet.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center text-xs text-muted-foreground">
                    <ChevronRight className="h-4 w-4 mr-1 text-primary" /> {/* Slightly larger icons */}
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Add deep link button for mobile apps */}
              {isMobile && wallet.deepLink && (
                <div className="mt-3 pt-2 border-t border-border">
                  <a 
                    href={wallet.deepLink}
                    className="text-xs text-primary flex items-center hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open in {wallet.name} App
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center">
            <Shield className="h-3 w-3 mr-1" />
            <span>Connecting is secure and does not share your private keys</span>
          </div>
          <a 
            href="https://ethereum.org/en/wallets/" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center hover:text-foreground transition-colors"
          >
            <span>Learn more</span>
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3 sm:justify-between">
          <ConnectWalletButton 
            variant="default" 
            showTooltip={false} 
            className="w-full sm:w-auto"
          />
          <DialogClose asChild>
            <Button variant="outline" className="w-full sm:w-auto">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}