import { useWagmiWallet } from "./wagmi-wallet-provider";
import { ConnectWalletButton } from "./connect-wallet-button";
import { ConnectionIndicator } from "./connection-indicator";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { shortenAddress } from "@/lib/utils";
import { WalletWizardDialog } from "./wallet-wizard-dialog";

export function WalletStatus() {
  const { isConnected, disconnect } = useWagmiWallet();
  const { address } = useAccount();
  // Placeholders for future functionality
  const rageQuit = () => console.log('Rage quit feature not implemented yet');
  const isRageQuitting = false;
  const [ethBalance, setEthBalance] = useState<string | null>(null);
  
  // Simulate balance data since we're on testnet
  useEffect(() => {
    const randomBalance = Math.random() * 5;
    setEthBalance(randomBalance.toFixed(4));
  }, [address]);
  
  if (!isConnected) {
    return (
      <div className="flex gap-2">
        <ConnectionIndicator />
        <ConnectWalletButton size="sm" variant="default" />
        <WalletWizardDialog trigger={
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Wizard
          </Button>
        } />
      </div>
    );
  }
  
  return (
    <div className="flex gap-2 items-center">
      <ConnectionIndicator />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {ethBalance ? (
              <span className="font-mono">{ethBalance} ETH</span>
            ) : (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Connected Wallet</DropdownMenuLabel>
          <DropdownMenuItem className="flex justify-between font-mono">
            {address ? shortenAddress(address, 6) : 'Loading...'}
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Balance</DropdownMenuLabel>
          <DropdownMenuItem className="flex gap-2 items-center">
            <div className="rounded-full h-3 w-3 bg-blue-500"></div>
            {ethBalance ? (
              <span className="font-mono">{ethBalance} ETH</span>
            ) : (
              <Loader2 className="h-3 w-3 animate-spin" />
            )}
          </DropdownMenuItem>
          
          <Separator className="my-2" />
          
          <DropdownMenuItem
            onClick={disconnect}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={rageQuit}
            disabled={isRageQuitting}
            className="text-destructive focus:text-destructive"
          >
            {isRageQuitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            <span>Rage Quit (Withdraw All)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}