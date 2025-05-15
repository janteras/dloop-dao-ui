import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { AlertTriangle } from 'lucide-react';

interface PortfolioData {
  dloopBalance: number;
  daiBalance: number;
  delegatedDloop: number;
  pendingRewards: number;
}

interface RageQuitModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolioData: PortfolioData;
}

const RageQuitModal = ({ isOpen, onClose, portfolioData }: RageQuitModalProps) => {
  const { rageQuit, isRageQuitting } = useWallet();
  const [confirmed, setConfirmed] = useState(false);

  const handleRageQuit = async () => {
    await rageQuit();
    onClose();
  };

  const totalReclaim = portfolioData.dloopBalance + portfolioData.delegatedDloop;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            RageQuit Protocol
          </DialogTitle>
          <DialogDescription>
            RageQuit allows you to exit the D-Loop protocol by redeeming your DLOOP tokens for the
            underlying DAI collateral. This action is irreversible.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-border bg-muted p-4">
            <h3 className="mb-2 font-medium">You will receive:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>DLOOP Balance:</span>
                <span className="font-mono">{portfolioData.dloopBalance.toFixed(4)} DLOOP</span>
              </div>
              <div className="flex justify-between">
                <span>Delegated DLOOP:</span>
                <span className="font-mono">{portfolioData.delegatedDloop.toFixed(4)} DLOOP</span>
              </div>
              <div className="border-t border-border my-2" />
              <div className="flex justify-between font-medium">
                <span>Total DLOOP:</span>
                <span className="font-mono">{totalReclaim.toFixed(4)} DLOOP</span>
              </div>
              <div className="flex justify-between text-green-500 font-medium">
                <span>Redeemable for:</span>
                <span className="font-mono">{totalReclaim.toFixed(4)} DAI</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
            <h3 className="mb-2 font-medium">You will forfeit:</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Pending Rewards:</span>
                <span className="font-mono">{portfolioData.pendingRewards.toFixed(4)} DLOOP</span>
              </div>
              <div className="flex justify-between">
                <span>Voting Rights:</span>
                <span>All delegations and votes</span>
              </div>
              <div className="flex justify-between">
                <span>Protocol Access:</span>
                <span>Cannot rejoin for 30 days</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="confirm"
              className="accent-primary h-4 w-4"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <label htmlFor="confirm" className="text-sm">
              I understand that RageQuit is irreversible and I will lose all voting rights and
              pending rewards.
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isRageQuitting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRageQuit}
            disabled={!confirmed || isRageQuitting}
          >
            {isRageQuitting ? 'Processing...' : 'Confirm RageQuit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RageQuitModal;