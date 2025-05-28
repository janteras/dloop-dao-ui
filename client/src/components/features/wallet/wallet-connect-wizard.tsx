import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConnectWalletButton } from "./connect-wallet-button";
import { useWagmiWallet } from "@/hooks/useWagmiWallet";
import { 
  Smartphone, 
  Laptop, 
  HelpCircle, 
  CheckCircle2, 
  ArrowRight,
  Wallet
} from "lucide-react";
import { NetworkSwitchPrompt } from "./NetworkSwitchPrompt";

interface WalletConnectWizardProps {
  onClose?: () => void;
}

export function WalletConnectWizard({ onClose }: WalletConnectWizardProps) {
  const { isConnected } = useWagmiWallet();
  const [activeTab, setActiveTab] = useState<string>("desktop");

  if (isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto bg-primary/20 h-12 w-12 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Connected Successfully</CardTitle>
          <CardDescription>
            Your wallet is now connected to the D-Loop protocol
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center pt-2 pb-6">
          <Button onClick={onClose}>
            Continue to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
    <NetworkSwitchPrompt />
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wallet className="mr-2 h-5 w-5" />
          Connect Your Wallet
        </CardTitle>
        <CardDescription>
          Choose your preferred connection method
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="desktop" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="desktop" className="flex items-center">
              <Laptop className="mr-2 h-4 w-4" />
              Desktop Wallet
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center">
              <Smartphone className="mr-2 h-4 w-4" />
              Mobile Wallet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="desktop">
            <div className="space-y-3">
              <div className="border rounded-lg p-3 border-border">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white p-1">
                    <img 
                      src="/images/metamask-fox.svg" 
                      onError={(e) => {
                        e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg";
                      }}
                      alt="MetaMask" 
                      className="h-full w-full object-contain" 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">
                      MetaMask
                      <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground">Popular browser extension wallet</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3 border-border">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white p-1 flex items-center justify-center">
                    <img 
                      src="/images/coinbase-wallet.svg" 
                      onError={(e) => {
                        console.log('Coinbase Wallet icon failed to load, using fallback');
                        e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDMwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIiByeD0iMTUwIiBmaWxsPSIjMDA1MkZGIi8+CjxwYXRoIGQ9Ik0xNTAgMjAwYzI3LjYxIDAgNTAtMjIuMzkgNTAtNTBzLTIyLjM5LTUwLTUwLTUwLTUwIDIyLjM5LTUwIDUwIDIyLjM5IDUwIDUwIDUweiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+";
                      }}
                      alt="Coinbase Wallet" 
                      className="h-full w-full object-contain" 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">Coinbase Wallet</h3>
                    <p className="text-xs text-muted-foreground">Connect with Coinbase's browser extension</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Connect with your browser wallet extension. If you don't have one installed, you'll be prompted to install it.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="mobile">
            <div className="space-y-3">
              <div className="border rounded-lg p-3 border-border">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white p-1">
                    <img 
                      src="/images/walletconnect.svg" 
                      onError={(e) => {
                        e.currentTarget.src = "https://avatars.githubusercontent.com/u/37784886";
                      }}
                      alt="WalletConnect" 
                      className="h-full w-full object-contain" 
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">
                      WalletConnect
                      <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground">Connect any supported mobile wallet via QR code</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Scan a QR code with your mobile wallet app to connect. Works with MetaMask Mobile, Rainbow, Trust Wallet and many others.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between gap-2">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <ConnectWalletButton 
          variant="default" 
          showTooltip={false}
          className="flex-1"
        />
      </CardFooter>
    </Card>
    </>
  );
}