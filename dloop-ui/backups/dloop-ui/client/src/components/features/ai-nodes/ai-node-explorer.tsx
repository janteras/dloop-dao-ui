'use client';

import { Badge } from '@/components/common/ui/badge';
import { Button } from '@/components/common/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/common/ui/card';
import { PageHeader } from '@/components/common/page-header';
import { formatNumber } from '@/lib/utils';
import { useState } from 'react';
import { Link } from 'wouter';

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

// Placeholder data - would be fetched from API in real implementation
const aiNodes: AINode[] = [
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
  
  const sortedNodes = [...aiNodes].sort((a, b) => {
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
      
      <div className="grid gap-6 md:grid-cols-2">
        {sortedNodes.map((node) => (
          <Card key={node.id} className="overflow-hidden">
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
              <Button size="sm">Delegate</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}