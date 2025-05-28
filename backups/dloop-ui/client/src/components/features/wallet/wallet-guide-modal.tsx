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
  
  const walletOptions = [
    {
      name: "MetaMask",
      icon: "/images/metamask-fox.svg",
      description: "Most popular Ethereum wallet, available as browser extension or mobile app",
      benefits: ["Widely used and supported", "Direct browser integration", "Mobile app available"],
      recommended: true,
    },
    {
      name: "WalletConnect",
      icon: "/images/walletconnect.svg",
      description: "Connect with any supported mobile wallet app via QR code",
      benefits: ["Use your existing mobile wallet", "No browser extension needed", "Works across devices"],
      recommended: true,
    },
    {
      name: "Coinbase Wallet",
      icon: "/images/coinbase-wallet.svg",
      description: "Backed by Coinbase, one of the largest crypto exchanges",
      benefits: ["User-friendly interface", "Integrated with Coinbase exchange", "Web and mobile versions"],
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
          {walletOptions.map((wallet, index) => (
            <div 
              key={index}
              className={`border rounded-lg p-4 transition-all ${
                wallet.recommended ? 'border-primary/30 bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white p-1.5 flex items-center justify-center">
                  <img 
                    src={wallet.icon} 
                    alt={wallet.name} 
                    className="h-full w-full object-contain" 
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium flex items-center">
                    {wallet.name}
                    {wallet.recommended && (
                      <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground">{wallet.description}</p>
                </div>
              </div>
              
              <div className="mt-3 grid grid-cols-1 gap-1">
                {wallet.benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-center text-xs text-muted-foreground">
                    <ChevronRight className="h-3 w-3 mr-1 text-primary" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
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