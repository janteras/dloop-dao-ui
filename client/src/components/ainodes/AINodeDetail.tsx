import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAINodes } from "@/hooks/useAINodes";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { AINode } from "@/types";

interface AINodeDetailProps {
  node: AINode;
}

const AINodeDetail = ({ node }: AINodeDetailProps) => {
  const { isConnected, balance } = useWallet();
  const { delegateToNode, isDelegating } = useAINodes();
  const { toast } = useToast();
  const [delegateAmount, setDelegateAmount] = useState("");
  const [agreement, setAgreement] = useState(false);

  const handleMaxAmount = () => {
    if (balance !== undefined) {
      setDelegateAmount(balance.toString());
    }
  };

  const handleDelegate = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to delegate tokens.",
        variant: "destructive",
      });
      return;
    }

    if (!delegateAmount || parseFloat(delegateAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to delegate.",
        variant: "destructive",
      });
      return;
    }

    if (balance !== undefined && parseFloat(delegateAmount) > balance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough DLOOP tokens to delegate this amount.",
        variant: "destructive",
      });
      return;
    }

    if (!agreement) {
      toast({
        title: "Agreement Required",
        description: "Please confirm that you understand the delegation conditions.",
        variant: "destructive",
      });
      return;
    }

    try {
      await delegateToNode(node.id, parseFloat(delegateAmount));
      toast({
        title: "Delegation Successful",
        description: `Successfully delegated ${delegateAmount} DLOOP to ${node.name}`,
      });
      setDelegateAmount("");
      setAgreement(false);
    } catch (error) {
      toast({
        title: "Delegation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="flex items-center mb-6">
          <div className="h-12 w-12 rounded-full bg-blue-500 mr-4 flex items-center justify-center">
            <span className="text-white font-medium">AI</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{node.name}</h2>
            <p className="text-gray">{node.strategy} Strategy</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray">Voting Accuracy</span>
                <span className="text-white font-medium">{node.accuracy}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray">30-Day Return</span>
                <span className={`font-medium ${node.performance >= 0 ? 'text-accent' : 'text-warning-red'}`}>
                  {node.performance >= 0 ? '+' : ''}{node.performance}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray">90-Day Return</span>
                <span className={`font-medium ${node.performance90d >= 0 ? 'text-accent' : 'text-warning-red'}`}>
                  {node.performance90d >= 0 ? '+' : ''}{node.performance90d}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray">Total Delegated</span>
                <span className="text-white font-medium mono">{node.delegatedAmount.toLocaleString()} DLOOP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray">Proposals Created</span>
                <span className="text-white font-medium">{node.proposalsCreated}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray">Proposals Passed</span>
                <span className="text-white font-medium">
                  {node.proposalsPassed} ({node.proposalsCreated > 0 ? Math.round((node.proposalsPassed / node.proposalsCreated) * 100) : 0}%)
                </span>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <h3 className="text-lg font-medium text-white mb-4">Trading Thesis</h3>
            <div className="bg-dark-bg rounded-lg p-4 text-gray leading-relaxed">
              <p>{node.tradingThesis.description}</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {node.tradingThesis.points.map((point, index) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
              <p className="mt-2">{node.tradingThesis.conclusion}</p>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-medium text-white mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {node.recentActivity.map((activity, index) => (
                  <div key={index} className="flex justify-between items-center p-3 border border-gray rounded-lg">
                    <div>
                      <div className="text-white font-medium">{activity.title}</div>
                      <div className="text-sm text-gray">{activity.date}</div>
                    </div>
                    <span className={`text-xs ${
                      activity.status === 'Active' ? 'bg-accent/20 text-accent' :
                      activity.status === 'Executed' ? 'bg-green-500/20 text-green-500' :
                      'bg-gray/20 text-gray'
                    } px-2 py-0.5 rounded`}>
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Delegate to This Node Form */}
        <div className="mt-6 p-5 border border-accent rounded-lg bg-accent/5">
          <h3 className="text-lg font-medium text-white mb-3">Delegate to {node.name}</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="delegateAmount" className="text-gray">Amount to Delegate</Label>
              <div className="flex delegate-input border border-gray rounded-lg focus-within:border-accent">
                <Input
                  id="delegateAmount"
                  type="number"
                  value={delegateAmount}
                  onChange={(e) => setDelegateAmount(e.target.value)}
                  className="bg-dark-bg border-0 text-white focus-visible:ring-0 focus-visible:ring-offset-0 rounded-r-none"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={isDelegating || !isConnected}
                />
                <div className="bg-dark-bg border-l border-gray rounded-r-lg px-4 flex items-center">
                  <span className="text-white font-medium">DLOOP</span>
                </div>
              </div>
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-gray">Available: {balance?.toLocaleString() || 0} DLOOP</span>
                <button 
                  className="text-accent hover:underline"
                  onClick={handleMaxAmount}
                  disabled={isDelegating || !isConnected}
                >
                  MAX
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="agreement" 
                checked={agreement}
                onCheckedChange={(checked) => setAgreement(checked as boolean)}
                disabled={isDelegating || !isConnected}
              />
              <Label htmlFor="agreement" className="text-sm text-gray">
                I understand this delegation can be undone at any time
              </Label>
            </div>
            
            <Button
              className="w-full bg-accent text-dark-bg font-medium hover:bg-darker-accent btn-hover-effect btn-active-effect"
              onClick={handleDelegate}
              disabled={isDelegating || !isConnected}
            >
              {isDelegating ? "Delegating..." : `Delegate to ${node.name}`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AINodeDetail;
