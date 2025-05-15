'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/common/ui/card';
import { Button } from '@/components/common/ui/button';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { ArrowUpRight, Coins, DollarSign, Gift, Wallet } from 'lucide-react';
import { useWallet } from '@/components/features/wallet/wallet-provider';
import { useToast } from '@/hooks/use-toast';

interface PortfolioData {
  dloopBalance: number;
  daiBalance: number;
  delegatedDloop: number;
  pendingRewards: number;
}

// This would typically be fetched from an API
const defaultPortfolio: PortfolioData = {
  dloopBalance: 1250.5,
  daiBalance: 2500.75,
  delegatedDloop: 750.25,
  pendingRewards: 45.3,
};

export function UserPortfolio({ portfolio = defaultPortfolio }: { portfolio?: PortfolioData }) {
  const { isRageQuitting, rageQuit } = useWallet();
  const { toast } = useToast();
  
  const handleRageQuit = async () => {
    try {
      await rageQuit();
      toast({
        title: 'RageQuit Successful',
        description: 'You have successfully exited the D-Loop protocol and reclaimed your tokens.',
      });
    } catch (error) {
      console.error('RageQuit error:', error);
      toast({
        title: 'RageQuit Failed',
        description: 'There was an error processing your request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">My Portfolio</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="font-medium">My Balance</span>
            </div>
            <span className="font-semibold text-xl">${formatNumber(portfolio.dloopBalance + portfolio.daiBalance, 2)}</span>
          </div>
          
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Coins className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">DLOOP</div>
                    <div className="font-medium">{formatNumber(portfolio.dloopBalance)}</div>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </div>
              
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">DAI</div>
                    <div className="font-medium">{formatNumber(portfolio.daiBalance)}</div>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <span className="font-medium">Delegations & Rewards</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-xs text-muted-foreground">Delegated</div>
                  <div className="font-medium">{formatNumber(portfolio.delegatedDloop)} DLOOP</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-xs text-muted-foreground">Pending Rewards</div>
                  <div className="font-medium">{formatNumber(portfolio.pendingRewards)} DLOOP</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="flex justify-between w-full">
          <Button variant="outline" size="sm">Claim Rewards</Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleRageQuit}
            disabled={isRageQuitting}
          >
            {isRageQuitting ? 'Processing...' : 'Rage Quit'}
          </Button>
        </div>
        
        <div className="w-full">
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={() => 
              toast({
                title: "Delegation",
                description: "Open delegation interface to delegate your DLOOP to AI Governance Nodes or other users.",
              })
            }
          >
            Delegate DLOOP
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}