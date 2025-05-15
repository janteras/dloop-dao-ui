'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import { ArrowUpRight, Coins, Gift, Wallet, PieChart, Clock, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DashboardDelegateModal } from './dashboard-delegate-modal';

// Define our interfaces
interface AssetAllocation {
  token: string;
  amount: number;
  value: number;
  percentChange24h: number;
  color: string;
}

interface Activity {
  type: string;
  token: string;
  amount: number;
  time: string;
  target: string;
}

interface PortfolioData {
  dloopBalance: number;
  daiBalance: number;
  delegatedDloop: number;
  pendingRewards: number;
  totalVotingPower: number;
}

export function EnhancedUserPortfolio() {
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  const [isRageQuitting, setIsRageQuitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false);
  
  // Simulated portfolio data - in a real app, this would come from an API call
  const portfolioData: PortfolioData = {
    dloopBalance: 1250.5,
    daiBalance: 2500.75,
    delegatedDloop: 750.25,
    pendingRewards: 45.3,
    totalVotingPower: 2000.75
  };
  
  // Asset allocation data based on the portfolio
  const assetAllocation: AssetAllocation[] = [
    { token: 'DLOOP', amount: portfolioData.dloopBalance, value: portfolioData.dloopBalance * 2.5, percentChange24h: 4.2, color: 'bg-teal-500' },
    { token: 'DAI', amount: portfolioData.daiBalance, value: portfolioData.daiBalance, percentChange24h: 0.1, color: 'bg-amber-500' },
    { token: 'USDC', amount: 1845.60, value: 1845.60, percentChange24h: 0.05, color: 'bg-blue-500' },
    { token: 'WBTC', amount: 0.025, value: 812.50, percentChange24h: -2.7, color: 'bg-orange-500' },
  ];
  
  // Calculate total portfolio value
  const totalValue = assetAllocation.reduce((sum, asset) => sum + asset.value, 0);
  
  // Activity history data
  const activityHistory: Activity[] = [
    { type: 'Delegation', token: 'DLOOP', amount: 200, time: '2 hours ago', target: 'Alpha AI Node' },
    { type: 'Claim', token: 'DLOOP', amount: 25.5, time: '1 day ago', target: 'Rewards' },
    { type: 'Vote', token: 'DLOOP', amount: 450, time: '3 days ago', target: 'Asset DAO Proposal #12' },
    { type: 'Deposit', token: 'DAI', amount: 500, time: '5 days ago', target: 'Treasury' },
    { type: 'Claim', token: 'DLOOP', amount: 32.7, time: '1 week ago', target: 'Rewards' },
  ];
  
  const handleRageQuit = async () => {
    try {
      setIsRageQuitting(true);
      // In a real implementation, this would call the smart contract
      // await contract.rageQuit();
      
      // Simulate some delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
    } finally {
      setIsRageQuitting(false);
    }
  };
  
  const handleClaimRewards = () => {
    toast({
      title: 'Claiming Rewards',
      description: `Claiming ${formatNumber(portfolioData.pendingRewards)} DLOOP rewards. Please confirm the transaction in your wallet.`,
    });
  };
  
  const handleDelegateTokens = () => {
    setIsDelegateModalOpen(true);
  };
  
  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">My Portfolio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-lg">My Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-destructive/10 text-center">
            <p className="text-destructive font-medium">Error loading portfolio data</p>
            <p className="text-sm text-muted-foreground mt-1">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!isConnected) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-lg">My Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-6 rounded-lg border border-dashed text-center">
            <Wallet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-2">Wallet Not Connected</p>
            <p className="text-sm text-muted-foreground mb-4">Connect your wallet to view your portfolio</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="text-lg">My Portfolio</CardTitle>
        <Tabs defaultValue={activeTab} className="w-[240px]">
          <TabsList className="grid grid-cols-3 h-8">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="assets" className="text-xs">Assets</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <TabsContent value="overview" className="m-0 p-0">
          <div className="space-y-4">
            {/* Portfolio Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="font-medium">Total Value</span>
              </div>
              <span className="font-semibold text-xl">${formatNumber(totalValue, 2)}</span>
            </div>
            
            {/* Asset Distribution */}
            <div className="space-y-3">
              <div className="flex gap-2 mb-1">
                <div className="flex flex-col flex-grow">
                  <div className="flex items-center gap-2 mb-2">
                    <PieChart className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Asset Distribution</span>
                  </div>
                  <div className="flex gap-1 h-2">
                    {assetAllocation.map((asset) => (
                      <div
                        key={asset.token}
                        className={`${asset.color} rounded-full`}
                        style={{ width: `${(asset.value / totalValue) * 100}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
              
              {/* Top Assets */}
              {showDetails && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {assetAllocation.slice(0, 4).map((asset) => (
                    <div key={asset.token} className="flex items-center gap-2 rounded-lg border p-3">
                      <div className={`h-8 w-8 rounded-full ${asset.color} flex items-center justify-center`}>
                        <span className="text-white text-xs font-medium">{asset.token.slice(0, 1)}</span>
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="text-xs text-muted-foreground">{asset.token}</div>
                        <div className="font-medium truncate">${formatNumber(asset.value)}</div>
                      </div>
                      <div className={`text-xs font-medium ${asset.percentChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {asset.percentChange24h >= 0 ? '+' : ''}{asset.percentChange24h}%
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Separator />
            
            {/* Voting Power */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">Voting Power</span>
                </div>
                <span className="text-sm">
                  <span className="font-medium">{formatNumber(portfolioData.totalVotingPower)}</span> DLOOP
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>DLOOP Tokens</span>
                  <span>{formatNumber(portfolioData.dloopBalance)} ({formatNumber((portfolioData.dloopBalance / portfolioData.totalVotingPower) * 100)}%)</span>
                </div>
                <Progress value={(portfolioData.dloopBalance / portfolioData.totalVotingPower) * 100} className="h-2" />
                
                <div className="flex items-center justify-between text-sm">
                  <span>Delegated</span>
                  <span>{formatNumber(portfolioData.delegatedDloop)} ({formatNumber((portfolioData.delegatedDloop / portfolioData.totalVotingPower) * 100)}%)</span>
                </div>
                <Progress value={(portfolioData.delegatedDloop / portfolioData.totalVotingPower) * 100} className="h-2" />
              </div>
            </div>
            
            <Separator />
            
            {/* Rewards */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-primary" />
                  <span className="font-medium">Governance Rewards</span>
                </div>
                <Badge variant="secondary" className="font-normal">
                  <Clock className="h-3 w-3 mr-1" />
                  Updated Daily
                </Badge>
              </div>
              
              <div className="flex items-center justify-between rounded-lg border p-3 bg-primary/5">
                <div>
                  <div className="text-xs text-muted-foreground">Pending Rewards</div>
                  <div className="font-medium">{formatNumber(portfolioData.pendingRewards)} DLOOP</div>
                </div>
                <Button size="sm" variant="outline" onClick={handleClaimRewards}>
                  Claim
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="assets" className="m-0 p-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <span className="font-medium">My Assets</span>
              </div>
              <span className="font-semibold text-xl">${formatNumber(totalValue, 2)}</span>
            </div>
            
            <div className="space-y-3">
              {assetAllocation.map((asset) => (
                <div key={asset.token} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full ${asset.color} flex items-center justify-center`}>
                      <span className="text-white font-medium">{asset.token.slice(0, 1)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{asset.token}</div>
                      <div className="text-xs text-muted-foreground">{formatNumber(asset.amount)} tokens</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${formatNumber(asset.value)}</div>
                    <div className={`text-xs ${asset.percentChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {asset.percentChange24h >= 0 ? '+' : ''}{asset.percentChange24h}% (24h)
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button variant="outline" size="sm" className="w-full">
                Buy DLOOP
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Swap Assets
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="activity" className="m-0 p-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium">Recent Activity</span>
              </div>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                View All
              </Button>
            </div>
            
            <div className="space-y-3">
              {activityHistory.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center`}>
                      {activity.type === 'Delegation' && <Gift className="h-5 w-5 text-primary" />}
                      {activity.type === 'Claim' && <Coins className="h-5 w-5 text-primary" />}
                      {activity.type === 'Vote' && <BarChart2 className="h-5 w-5 text-primary" />}
                      {activity.type === 'Deposit' && <ArrowUpRight className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <div className="font-medium">{activity.type}</div>
                      <div className="text-xs text-muted-foreground">{activity.target}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatNumber(activity.amount)} {activity.token}</div>
                    <div className="text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </CardContent>
      
      <CardFooter className="flex flex-col gap-4">
        <div className="flex justify-between w-full">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClaimRewards}
          >
            Claim Rewards
          </Button>
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
            onClick={handleDelegateTokens}
          >
            Delegate DLOOP
          </Button>
        </div>
      </CardFooter>
    </Card>
    
    {/* Dashboard-specific Delegation Modal */}
    <DashboardDelegateModal 
      isOpen={isDelegateModalOpen}
      onClose={() => setIsDelegateModalOpen(false)}
      availableBalance={portfolioData.dloopBalance}
      onSuccess={() => {
        // Refresh portfolio data after successful delegation
        // In a real implementation, you would refetch the portfolio data here
      }}
    />
    </>
  );
}