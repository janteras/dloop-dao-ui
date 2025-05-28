import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { rageQuit } from "@/services/rageQuitService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function RageQuitButton() {
  const { isConnected, address, signer } = useWallet();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; amount?: string } | null>(null);

  const handleRageQuit = async () => {
    if (!isConnected || !signer || !address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to use this feature.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // Execute RageQuit using the service
      const result = await rageQuit(signer, address);
      setResult(result);
      toast({
        title: "RageQuit Successful",
        description: result.amount 
          ? `Successfully claimed ${result.amount} DLOOP tokens.`
          : "RageQuit successful, check your wallet for tokens.",
      });
    } catch (error: any) {
      console.error("RageQuit error:", error);
      setError(error.message || "An unknown error occurred during RageQuit.");
      toast({
        title: "RageQuit Failed",
        description: error.message || "Failed to execute RageQuit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button 
        variant="destructive" 
        onClick={() => setIsModalOpen(true)} 
        disabled={!isConnected}
      >
        Emergency Exit (RageQuit)
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emergency Exit (RageQuit)</DialogTitle>
            <DialogDescription>
              RageQuit allows you to exit your positions and reclaim locked DLOOP tokens under
              certain conditions (e.g., governance disputes or emergency exit). 
              This action cannot be reversed.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && result.success && (
            <Alert>
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                {result.amount 
                  ? `You have successfully received ${result.amount} DLOOP tokens.`
                  : "RageQuit successful. Check your wallet for tokens."}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRageQuit} 
              disabled={isSubmitting || !isConnected || !!result?.success}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? "Processing..." : "Confirm RageQuit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
