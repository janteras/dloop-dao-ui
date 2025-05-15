import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { WalletConnectWizard } from "./wallet-connect-wizard";
import { useWagmiWallet } from "./wagmi-wallet-provider";

interface WalletWizardDialogProps {
  children?: React.ReactNode;
  trigger?: React.ReactNode;
  className?: string;
}

export function WalletWizardDialog({ children, trigger, className }: WalletWizardDialogProps) {
  const [open, setOpen] = useState(false);
  const { isConnected } = useWagmiWallet();
  
  // Close dialog automatically when wallet connects
  if (isConnected && open) {
    setOpen(false);
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button 
            variant="default" 
            size="lg" 
            className={`${className} wallet-btn-glow`}
          >
            {children || "Connect with Wallet Wizard"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] p-0">
        <WalletConnectWizard onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}