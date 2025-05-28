'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DelegateTokensModal } from './delegate-tokens-modal';
import { UndelegateTokensModal } from './undelegate-tokens-modal';
import { useQuery } from '@tanstack/react-query';
import { shortenAddress, formatDate } from '@/lib/utils';
import { UserIcon, ChevronDown } from 'lucide-react';

interface Delegation {
  id: string;
  to: string;
  toName?: string;
  toType: 'Human' | 'AI Node';
  amount: number;
  date: number;
}

interface AINode {
  id: string;
  name: string;
  address: string;
  strategy: string;
  accuracy: number;
  performance: number;
  delegatedAmount: number;
}

export function Delegations() {
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  const [selectedNode, setSelectedNode] = useState<AINode | null>(null);
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);
  const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false);
  const [isUndelegateModalOpen, setIsUndelegateModalOpen] = useState(false);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);

  // Fetch user delegations
  const { data: delegations, isLoading: isDelegationsLoading, refetch: refetchDelegations } = useQuery({
    queryKey: ['user-delegations'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/leaderboard/delegations');
        if (!response.ok) {
          throw new Error('Failed to fetch delegations');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching delegations:', error);
        return [];
      }
    },
    enabled: isConnected,
  });

  // Fetch AI nodes
  const { data: aiNodes, isLoading: isNodesLoading } = useQuery({
    queryKey: ['ai-nodes'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/ainodes');
        if (!response.ok) {
          throw new Error('Failed to fetch AI nodes');
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching AI nodes:', error);
        return [];
      }
    },
  });

  // Fetch wallet balance and staking info
  const { data: portfolio, isLoading: isPortfolioLoading } = useQuery({
    queryKey: ['dao-portfolio'],
    queryFn: async () => {
      // In a real implementation, this would fetch from the blockchain
      // For now, we'll use mock data
      return {
        dloopBalance: 1000,
        daiBalance: 250,
        delegatedDloop: 350,
        pendingRewards: 25,
        totalVotingPower: 1350,
      };
    },
    enabled: isConnected,
  });

  const handleDelegateClick = (node: AINode) => {
    setSelectedNode(node);
    setIsDelegateModalOpen(true);
  };

  const handleUndelegateClick = (delegation: Delegation) => {
    setSelectedDelegation(delegation);
    setIsUndelegateModalOpen(true);
  };

  const toggleNodeDetails = (index: number) => {
    if (selectedNodeIndex === index) {
      setSelectedNodeIndex(null);
    } else {
      setSelectedNodeIndex(index);
    }
  };

  const isLoading = isDelegationsLoading || isNodesLoading || isPortfolioLoading;
  const userDelegations = delegations || [];
  const availableAINodes = aiNodes || [];
  const userBalance = portfolio?.dloopBalance || 0;
  const userDelegatedBalance = portfolio?.delegatedDloop || 0;
  const userTotalVotingPower = portfolio?.totalVotingPower || 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available DLOOP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Available for delegation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delegated DLOOP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userDelegatedBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Currently delegated to others</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Voting Power</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userTotalVotingPower.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Your influence in the DAO</p>
          </CardContent>
        </Card>
      </div>

      {/* My Delegations */}
      <div>
        <h2 className="text-xl font-semibold mb-4">My Delegations</h2>
        {isLoading ? (
          <p>Loading delegations...</p>
        ) : userDelegations.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-muted-foreground">
                You haven't delegated any DLOOP tokens yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {userDelegations.map((delegation: Delegation) => (
              <Card key={delegation.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{delegation.toName || shortenAddress(delegation.to)}</CardTitle>
                      <CardDescription>Delegated on {formatDate(delegation.date)}</CardDescription>
                    </div>
                    <Badge variant={delegation.toType === 'AI Node' ? 'default' : 'outline'}>
                      {delegation.toType}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium">{delegation.amount.toLocaleString()} DLOOP</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUndelegateClick(delegation)}
                    disabled={!isConnected}
                  >
                    Undelegate
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Available AI Nodes */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available AI Nodes</h2>
        {isLoading ? (
          <p>Loading AI nodes...</p>
        ) : availableAINodes.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-muted-foreground">No AI nodes available.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {availableAINodes.map((node: AINode, index: number) => (
              <Card key={node.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{node.name}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => toggleNodeDetails(index)}>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          selectedNodeIndex === index ? 'rotate-180' : ''
                        }`}
                      />
                    </Button>
                  </div>
                  <CardDescription>{node.strategy}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                      <p className="font-medium">{node.accuracy}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Performance</p>
                      <p className="font-medium">{node.performance > 0 ? '+' : ''}{node.performance}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Delegated</p>
                      <p className="font-medium">{node.delegatedAmount.toLocaleString()} DLOOP</p>
                    </div>
                  </div>

                  {selectedNodeIndex === index && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm mb-2">Strategy Details:</p>
                      <p className="text-sm text-muted-foreground">
                        This AI node uses advanced algorithms to analyze market trends and make investment decisions
                        based on the {node.strategy.toLowerCase()} strategy.
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    size="sm"
                    onClick={() => handleDelegateClick(node)}
                    disabled={!isConnected || userBalance <= 0}
                  >
                    Delegate DLOOP
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Available Human Delegates */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Human Delegates</h2>
        <Card>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Popular Community Members</CardTitle>
                <CardDescription>
                  Delegate to trusted community members who actively participate in governance
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  address: '0xD4c35e65b1e473dfeC3da98B5fC110f0a78D3e7F',
                  voting: 98230,
                },
                {
                  address: '0x7F5Ae2',
                  voting: 65450,
                },
              ].map((human, idx) => (
                <div key={idx} className="flex items-center p-2 border rounded-md">
                  <div className="bg-muted h-10 w-10 rounded-full flex items-center justify-center mr-3">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{shortenAddress(human.address)}</p>
                    <p className="text-xs text-muted-foreground">
                      {human.voting.toLocaleString()} voting power
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleDelegateClick({
                        id: human.address,
                        name: shortenAddress(human.address),
                        address: human.address,
                        strategy: 'Human Delegate',
                        accuracy: 0,
                        performance: 0,
                        delegatedAmount: human.voting,
                      })
                    }
                    disabled={!isConnected || userBalance <= 0}
                  >
                    Delegate
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedNode && (
        <DelegateTokensModal
          isOpen={isDelegateModalOpen}
          onClose={() => setIsDelegateModalOpen(false)}
          recipientAddress={selectedNode.address}
          recipientName={selectedNode.name}
          recipientType={selectedNode.strategy === 'Human Delegate' ? 'Human' : 'AI Node'}
          availableBalance={userBalance}
          onSuccess={refetchDelegations}
        />
      )}

      {selectedDelegation && (
        <UndelegateTokensModal
          isOpen={isUndelegateModalOpen}
          onClose={() => setIsUndelegateModalOpen(false)}
          delegation={selectedDelegation}
          onSuccess={refetchDelegations}
        />
      )}
    </div>
  );
}