import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useWallet } from "@/hooks/useWallet";
import { useToast } from "@/hooks/use-toast";
import { shortenAddress } from "@/lib/utils";
import { ParticipantType } from "@/types";

const Leaderboard = () => {
  const { isConnected, address, balance } = useWallet();
  const { participants, delegations, isLoading, error, delegateTokens, undelegateTokens } = useLeaderboard();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"all" | "human" | "ai">("all");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [delegateAmount, setDelegateAmount] = useState("");
  const [isDelegating, setIsDelegating] = useState(false);
  const [undelegateId, setUndelegateId] = useState<string | null>(null);

  const filteredParticipants = participants.filter(p => {
    if (activeTab === "all") return true;
    return p.type.toLowerCase() === activeTab;
  });

  const handleMaxAmount = () => {
    if (balance !== undefined) {
      setDelegateAmount(balance.toString());
    }
  };

  const handleDelegateTokens = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to delegate tokens.",
        variant: "destructive",
      });
      return;
    }

    if (!recipientAddress) {
      toast({
        title: "Missing Recipient",
        description: "Please enter a recipient address or select from the leaderboard.",
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

    setIsDelegating(true);
    try {
      await delegateTokens(recipientAddress, parseFloat(delegateAmount));
      toast({
        title: "Delegation Successful",
        description: `Successfully delegated ${delegateAmount} DLOOP to ${shortenAddress(recipientAddress)}`,
      });
      setRecipientAddress("");
      setDelegateAmount("");
    } catch (error) {
      toast({
        title: "Delegation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsDelegating(false);
    }
  };

  const handleUndelegate = async (delegationId: string, to: string, amount: number) => {
    setUndelegateId(delegationId);
    try {
      await undelegateTokens(to, amount);
      toast({
        title: "Undelegation Successful",
        description: `Successfully undelegated ${amount} DLOOP from ${shortenAddress(to)}`,
      });
    } catch (error) {
      toast({
        title: "Undelegation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setUndelegateId(null);
    }
  };

  const handleSelectParticipant = (participantAddress: string) => {
    setRecipientAddress(participantAddress);
  };

  const getParticipantIconClass = (type: ParticipantType) => {
    return type === "AI Node" ? "bg-blue-500" : "bg-accent";
  };

  return (
    <section className="page-transition">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">Governance Leaderboard</h1>
        
        <Button 
          className="bg-accent text-dark-bg font-medium hover:bg-darker-accent transition-colors"
          disabled={!isConnected}
          onClick={() => {
            const element = document.getElementById('delegateForm');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          Delegate Tokens
        </Button>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full mb-6" onValueChange={(value) => setActiveTab(value as "all" | "human" | "ai")}>
        <TabsList className="border-b border-gray w-full rounded-none justify-start bg-transparent gap-2">
          <TabsTrigger 
            value="all"
            className="data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none data-[state=active]:-mb-px bg-transparent"
          >
            All Participants
          </TabsTrigger>
          <TabsTrigger 
            value="human"
            className="data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none data-[state=active]:-mb-px bg-transparent"
          >
            Human Participants
          </TabsTrigger>
          <TabsTrigger 
            value="ai"
            className="data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none data-[state=active]:-mb-px bg-transparent"
          >
            AI Governance Nodes
          </TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Leaderboard Table */}
      <Card className="mb-8">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <h3 className="text-xl text-warning-red mb-2">Error Loading Leaderboard</h3>
              <p className="text-gray">{error}</p>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl text-white mb-2">No participants found</h3>
              <p className="text-gray">No participants match the current filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray">
                    <th className="text-left p-4 text-gray font-medium">Rank</th>
                    <th className="text-left p-4 text-gray font-medium">Participant</th>
                    <th className="text-left p-4 text-gray font-medium">Type</th>
                    <th className="text-right p-4 text-gray font-medium">Voting Power</th>
                    <th className="text-right p-4 text-gray font-medium">Accuracy</th>
                    <th className="text-right p-4 text-gray font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray/30">
                  {filteredParticipants.map((participant, index) => (
                    <tr key={participant.address} className="hover:bg-dark-bg/50">
                      <td className="p-4 text-white font-medium">#{index + 1}</td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className={`h-8 w-8 rounded-full ${getParticipantIconClass(participant.type)} mr-3 flex items-center justify-center`}>
                            {participant.type === "AI Node" ? (
                              <span className="text-white font-medium">AI</span>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-dark-bg">
                                <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-white font-medium">
                            {participant.name || shortenAddress(participant.address)}
                          </span>
                          {participant.isCurrentUser && (
                            <span className="ml-2 text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded">You</span>
                          )}
                        </div>
                      </td>
                      <td className={`p-4 ${participant.type === "AI Node" ? "text-blue-400" : "text-accent"}`}>
                        {participant.type}
                      </td>
                      <td className="p-4 text-right text-white font-medium mono">{participant.votingPower.toLocaleString()} DLOOP</td>
                      <td className="p-4 text-right text-white font-medium">{participant.accuracy}%</td>
                      <td className="p-4 text-right">
                        {participant.isCurrentUser ? (
                          <span className="text-gray text-sm">Self</span>
                        ) : (
                          <Button 
                            variant="outline" 
                            className="bg-accent/10 hover:bg-accent/20 text-accent border-0"
                            onClick={() => handleSelectParticipant(participant.address)}
                            disabled={!isConnected}
                          >
                            Delegate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Your Delegations */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Your Delegations</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-6">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : delegations.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray">You haven't delegated any tokens yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {delegations.map((delegation) => (
                <div key={delegation.id} className="flex items-center justify-between p-3 border border-gray rounded-lg">
                  <div className="flex items-center">
                    <div className={`h-10 w-10 rounded-full ${delegation.toType === "AI Node" ? "bg-blue-500" : "bg-accent"} mr-3 flex items-center justify-center`}>
                      {delegation.toType === "AI Node" ? (
                        <span className="text-white font-medium">AI</span>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-dark-bg">
                          <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-white font-medium">
                        {delegation.toName || shortenAddress(delegation.to)}
                      </div>
                      <div className="text-sm text-gray">Delegated on {new Date(delegation.date).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-white font-medium mono">{delegation.amount} DLOOP</span>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-warning-red hover:text-white hover:bg-warning-red rounded-lg transition-colors"
                      onClick={() => handleUndelegate(delegation.id, delegation.to, delegation.amount)}
                      disabled={undelegateId === delegation.id}
                    >
                      {undelegateId === delegation.id ? (
                        <div className="animate-spin h-5 w-5 border-2 border-warning-red border-t-transparent rounded-full" />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Delegate Tokens Form */}
          <div className="mt-6 p-4 border border-gray rounded-lg" id="delegateForm">
            <h3 className="text-lg font-medium text-white mb-3">Delegate Your Tokens</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="recipient" className="text-gray">Recipient</Label>
                <div className="flex delegate-input border border-gray rounded-lg focus-within:border-accent">
                  <Input
                    id="recipient"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    className="bg-dark-bg border-0 text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                    placeholder="Address or select from leaderboard"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="amount" className="text-gray">Amount to Delegate</Label>
                <div className="flex delegate-input border border-gray rounded-lg focus-within:border-accent">
                  <Input
                    id="amount"
                    type="number"
                    value={delegateAmount}
                    onChange={(e) => setDelegateAmount(e.target.value)}
                    className="bg-dark-bg border-0 text-white focus-visible:ring-0 focus-visible:ring-offset-0 rounded-r-none"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
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
                  >
                    MAX
                  </button>
                </div>
              </div>
              
              <Button
                className="w-full bg-accent text-dark-bg font-medium hover:bg-darker-accent btn-hover-effect btn-active-effect"
                onClick={handleDelegateTokens}
                disabled={isDelegating || !isConnected}
              >
                {isDelegating ? "Delegating..." : "Delegate Tokens"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};

export default Leaderboard;
