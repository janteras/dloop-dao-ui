import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Wifi, WifiOff, ExternalLink } from "lucide-react";
import { shortenAddress } from "@/lib/utils";
import { useWallet } from "./simplified-wallet-provider";

export function ConnectionIndicator() {
  const { isConnected, address } = useWallet();
  
  if (!isConnected || !address) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="flex gap-1 items-center border-destructive/50 text-destructive">
              <WifiOff className="h-3 w-3" />
              <span>Not Connected</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">Connect a wallet to interact with the D-Loop protocol</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="flex gap-1 items-center border-primary/50 text-primary bg-primary/10">
            <Wifi className="h-3 w-3" />
            <span>{shortenAddress(address)}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="flex flex-col gap-2">
          <p className="text-sm">Connected to Sepolia Testnet</p>
          <div className="flex items-center text-xs text-muted-foreground">
            <ExternalLink className="h-3 w-3 mr-1" />
            <span>Full address: {address}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}