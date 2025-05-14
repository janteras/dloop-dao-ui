'use client';

import { Badge } from '@/components/common/ui/badge';
import { Button } from '@/components/common/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/common/ui/card';
import { PageHeader } from '@/components/common/page-header';
import { Skeleton } from '@/components/common/ui/skeleton';
import { formatNumber, shortenAddress } from '@/lib/utils';
import { useState } from 'react';
import { Link } from 'wouter';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import DelegateTokensModal from '@/components/modals/DelegateTokensModal';
import { useAINodes } from '@/hooks/useAINodes';

interface AINode {
  id: string;
  name: string;
  strategy: string;
  description: string;
  address: string;
  delegatedAmount: number;
  accuracy: number;
  performance: number;
  performance90d: number;
  proposalsCreated: number;
  proposalsPassed: number;
}

// The real data is now fetched from the AINodeRegistry and SoulboundNFT contracts
// This mock data is kept for reference only
const mockAINodes: AINode[] = [
  {
    id: 'node1',
    name: 'Alpha AI',
    strategy: 'Swing Trading',
    description: 'Alpha AI utilizes a sophisticated swing trading strategy that analyzes market trends and volatility patterns to identify optimal entry and exit points for digital assets. It focuses on assets with high liquidity and historical volatility patterns that match its predictive models.',
    address: '0x1234567890abcdef1234567890abcdef12345678',
    delegatedAmount: 250000,
    accuracy: 78,
    performance: 22.5,
    performance90d: 18.3,
    proposalsCreated: 28,
    proposalsPassed: 22,
  },
  {
    id: 'node2',
    name: 'Beta AI',
    strategy: 'Market Making',
    description: 'Beta AI implements a market-making strategy designed to provide liquidity across multiple assets while capturing spreads and minimizing risk. It uses statistical arbitrage techniques and high-frequency market analysis to balance the D-AI portfolio.',
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    delegatedAmount: 180000,
    accuracy: 81,
    performance: 18.7,
    performance90d: 15.9,
    proposalsCreated: 19,
    proposalsPassed: 16,
  },
  {
    id: 'node3',
    name: 'Gamma Predictor',
    strategy: 'Trend Following',
    description: 'Gamma Predictor excels in identifying and following established market trends across various timeframes. It employs multiple technical indicators and machine learning models to determine trend strength and potential reversals, optimizing for maximum capital efficiency.',
    address: '0x7890abcdef1234567890abcdef1234567890abcd',
    delegatedAmount: 120000,
    accuracy: 73,
    performance: 15.4,
    performance90d: 12.8,
    proposalsCreated: 15,
    proposalsPassed: 11,
  },
  {
    id: 'node4',
    name: 'Delta Observer',
    strategy: 'Fundamental Analysis',
    description: 'Delta Observer focuses on fundamental analysis of blockchain metrics, adoption patterns, and ecosystem development to identify undervalued assets. It specializes in longer-term investments based on quantifiable on-chain metrics and development activity.',
    address: '0xdef1234567890abcdef1234567890abcdef12345',
    delegatedAmount: 90000,
    accuracy: 76,
    performance: 13.2,
    performance90d: 11.5,
    proposalsCreated: 12,
    proposalsPassed: 9,
  },
];

type SortKey = 'performance' | 'delegatedAmount' | 'accuracy' | 'proposalsPassed';

export default function AINodeExplorer() {
  const [sortBy, setSortBy] = useState<SortKey>('performance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedNode, setSelectedNode] = useState<AINode | null>(null);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const { isConnected, balance } = useWallet();
  const { toast } = useToast();
  
  // Fetch AI Nodes with NFT data using our custom hook
  const { nodes, isLoading, error, refetch } = useAINodes();
  
  const sortedNodes = [...(nodes || [])].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a[sortBy] - b[sortBy];
    } else {
      return b[sortBy] - a[sortBy];
    }
  });
  
  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };
  
  const handleOpenDelegateModal = (node: AINode) => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to delegate tokens.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedNode(node);
    setShowDelegateModal(true);
  };
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Governance Nodes"
        description="Explore and delegate to AI Governance Nodes"
      />
      
      <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={sortBy === 'performance' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleSort('performance')}
          >
            Performance {sortBy === 'performance' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          <Button 
            variant={sortBy === 'delegatedAmount' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleSort('delegatedAmount')}
          >
            Delegated {sortBy === 'delegatedAmount' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          <Button 
            variant={sortBy === 'accuracy' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleSort('accuracy')}
          >
            Accuracy {sortBy === 'accuracy' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          <Button 
            variant={sortBy === 'proposalsPassed' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleSort('proposalsPassed')}
          >
            Proposals {sortBy === 'proposalsPassed' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent className="pb-3">
                <Skeleton className="h-24 w-full mb-4" />
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24 ml-auto" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Error Loading AI Nodes</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading the AI Nodes. Please try again later.
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {sortedNodes.map((node) => (
            <Card key={node.id} className="overflow-hidden">
              {/* Add a subtle indicator if this node has NFT data */}
              {node.soulboundTokenId && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-primary/10 border-primary/20">
                    NFT #{node.soulboundTokenId}
                  </Badge>
                </div>
              )}
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{node.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {node.strategy}
                  </CardDescription>
                </div>
                <Badge 
                  variant={node.performance > 15 ? 'success' : node.performance > 10 ? 'secondary' : 'default'}
                >
                  +{node.performance.toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {node.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Delegated</p>
                  <p className="font-medium">{formatNumber(node.delegatedAmount)} DLOOP</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="font-medium">{node.accuracy}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">90d Performance</p>
                  <p className="font-medium">+{node.performance90d.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Proposals Passed</p>
                  <p className="font-medium">{node.proposalsPassed}/{node.proposalsCreated}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Link href={`/ai-nodes/${node.id}`}>
                <Button variant="outline" size="sm">View Details</Button>
              </Link>
              <Button 
                size="sm" 
                onClick={() => handleOpenDelegateModal(node)}
                disabled={!isConnected}
              >
                Delegate
              </Button>
            </CardFooter>
          </Card>
        ))}
      )}
      
      {/* Delegate Modal - Keep the existing delegation modal integration */}
      {selectedNode && (
        <DelegateTokensModal
          isOpen={showDelegateModal}
          onClose={() => setShowDelegateModal(false)}
          node={selectedNode}
          availableBalance={balance || 0}
        />
      )}
      
      {/* Add a link to the dedicated NFT explorer at the bottom */}
      <div className="mt-8 text-center">
        <Link href="/ai-nodes/nft-explorer">
          <Button variant="outline" className="mx-auto">
            View AI Node NFT Collection
          </Button>
        </Link>
      </div>
    </div>
  );
}