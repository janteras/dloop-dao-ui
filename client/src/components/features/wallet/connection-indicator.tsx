import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";
import { shortenAddress } from "@/lib/utils";
import { useWallet } from "./simplified-wallet-provider";

export function ConnectionIndicator() {
  const { isConnected, address } = useWallet();
  
  if (!isConnected || !address) {
    return (
      <Badge 
        variant="outline" 
        className="flex gap-1 items-center border-destructive/50 text-destructive"
        title="Connect a wallet to interact with the D-Loop protocol"
      >
        <WifiOff className="h-3 w-3" />
        <span>Not Connected</span>
      </Badge>
    );
  }
  
  return (
    <Badge 
      variant="outline" 
      className="flex gap-1 items-center border-primary/50 text-primary bg-primary/10"
      title={`Connected to Sepolia Testnet with address: ${address}`}
    >
      <Wifi className="h-3 w-3" />
      <span>{shortenAddress(address)}</span>
    </Badge>
  );
}