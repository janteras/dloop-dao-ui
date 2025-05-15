import { useState } from "react";
import { Link } from "wouter";
import { useWallet } from "@/hooks/useWallet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import RageQuitModal from "@/components/modals/RageQuitModal";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

type AssetDistribution = {
  name: string;
  value: number;
  color: string;
};

const Dashboard = () => {
  const { isConnected, balance } = useWallet();
  const { toast } = useToast();
  const [isRageQuitModalOpen, setIsRageQuitModalOpen] = useState(false);

  // Mock data for visualization
  const portfolioValue = 26432.50;
  const daiHoldings = 872.25;
  const daiValue = 8722.50;
  const governanceRewards = 36.4;
  const lastReward = { amount: 2.8, daysAgo: 1 };
  const delegatedAmount = 450;
  const percentageChange = 4.2;

  const assetDistribution: AssetDistribution[] = [
    { name: "USDC", value: 60, color: "#30e6a8" },
    { name: "WBTC", value: 30, color: "#3b82f6" },
    { name: "PAXG", value: 10, color: "#eab308" },
  ];

  const activeProposals = [
    {
      id: 1,
      title: "Increase WBTC Allocation",
      status: "Active",
      percentYes: 70,
      endsIn: "2d 5h"
    },
    {
      id: 2,
      title: "Add LINK Token",
      status: "Active",
      percentYes: 45,
      endsIn: "5d 12h"
    }
  ];

  const handleBuyDloop = () => {
    toast({
      title: "Coming Soon",
      description: "The DLOOP token purchase functionality will be available soon.",
      variant: "default",
    });
  };

  return (
    <section className="page-transition">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        
        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="bg-dark-gray border border-gray text-white hover:border-accent transition-colors"
            onClick={handleBuyDloop}
          >
            Buy DLOOP
          </Button>
          <Button
            variant="outline"
            className="bg-dark-gray border border-warning-red text-warning-red hover:bg-warning-red hover:text-white transition-colors"
            onClick={() => setIsRageQuitModalOpen(true)}
          >
            Rage Quit
          </Button>
        </div>
      </div>
      
      {/* Portfolio Value */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-gray mb-4">Your Portfolio Value</h2>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-white mono">${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="ml-2 text-accent text-sm font-medium">+{percentageChange}%</span>
            </div>
            <div className="mt-2 text-sm text-gray">
              <span>Delegated: </span>
              <span className="text-white font-medium mono">{delegatedAmount} DLOOP</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-gray mb-4">D-AI Holdings</h2>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-white mono">{daiHoldings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} D-AI</span>
            </div>
            <div className="mt-2 text-sm text-gray">
              <span>Value: </span>
              <span className="text-white font-medium mono">${daiValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-gray mb-4">Governance Rewards</h2>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold text-white mono">{governanceRewards.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} DLOOP</span>
            </div>
            <div className="mt-2 text-sm text-gray">
              <span>Last reward: </span>
              <span className="text-white font-medium mono">+{lastReward.amount} DLOOP ({lastReward.daysAgo}d ago)</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Asset Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-gray mb-4">D-AI Asset Distribution</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {assetDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Allocation']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-gray mb-4">Active Proposals</h2>
            <div className="space-y-4">
              {activeProposals.map((proposal) => (
                <div key={proposal.id} className="border border-gray rounded-lg p-3 hover:border-accent transition-colors">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-white">{proposal.title}</span>
                    <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded">{proposal.status}</span>
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                    <Progress value={proposal.percentYes} className="w-2/3 mr-2" />
                    <span className="text-xs text-gray">{proposal.percentYes}% Yes</span>
                  </div>
                  <div className="mt-2 text-xs text-gray">
                    <span>Ends in: </span>
                    <span className="text-white">{proposal.endsIn}</span>
                  </div>
                </div>
              ))}
              
              <Link href="/assetdao" className="block text-center text-accent text-sm mt-4 hover:underline">
                View All Proposals
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RageQuit Modal */}
      <RageQuitModal 
        isOpen={isRageQuitModalOpen} 
        onClose={() => setIsRageQuitModalOpen(false)}
        portfolioData={{
          dloopBalance: balance || 0,
          daiBalance: daiHoldings,
          delegatedDloop: delegatedAmount,
          pendingRewards: governanceRewards
        }}
      />
    </section>
  );
};

export default Dashboard;
