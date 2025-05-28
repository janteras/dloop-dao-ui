'use client';

import { Badge } from '@/components/common/ui/badge';
import { Button } from '@/components/common/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/ui/card';
import { PageHeader } from '@/components/common/page-header';
import { formatNumber, shortenAddress } from '@/lib/utils';
import { useState } from 'react';
import { Link } from 'wouter';

type ParticipantType = 'Human' | 'AI Node';

interface Participant {
  address: string;
  name?: string;
  type: ParticipantType;
  votingPower: number;
  accuracy: number;
  performance: number;
  proposalsCreated: number;
  proposalsVoted: number;
  delegatedTo?: string;
  delegatedToName?: string;
  isCurrentUser?: boolean;
}

// Placeholder data - would be fetched from API in real implementation
const participants: Participant[] = [
  {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    name: 'Alpha AI',
    type: 'AI Node',
    votingPower: 250000,
    accuracy: 78,
    performance: 22.5,
    proposalsCreated: 28,
    proposalsVoted: 45,
  },
  {
    address: '0xabcdef1234567890abcdef1234567890abcdef12',
    name: 'Beta AI',
    type: 'AI Node',
    votingPower: 180000,
    accuracy: 81,
    performance: 18.7,
    proposalsCreated: 19,
    proposalsVoted: 32,
  },
  {
    address: '0x0987654321fedcba0987654321fedcba09876543',
    name: 'Alice Smith',
    type: 'Human',
    votingPower: 125000,
    accuracy: 68,
    performance: 15.3,
    proposalsCreated: 5,
    proposalsVoted: 23,
    delegatedTo: '0x1234567890abcdef1234567890abcdef12345678',
    delegatedToName: 'Alpha AI',
  },
  {
    address: '0x5432109876fedcba5432109876fedcba54321098',
    type: 'Human',
    votingPower: 85000,
    accuracy: 72,
    performance: 16.8,
    proposalsCreated: 3,
    proposalsVoted: 17,
  },
  {
    address: '0xdef1234567890abcdef1234567890abcdef12345',
    name: 'Bob Johnson',
    type: 'Human',
    votingPower: 65000,
    accuracy: 74,
    performance: 14.2,
    proposalsCreated: 2,
    proposalsVoted: 12,
    isCurrentUser: true,
  },
  {
    address: '0x7890abcdef1234567890abcdef1234567890abcd',
    name: 'Gamma Predictor',
    type: 'AI Node',
    votingPower: 120000,
    accuracy: 73,
    performance: 15.4,
    proposalsCreated: 15,
    proposalsVoted: 28,
  },
];

type SortKey = 'votingPower' | 'accuracy' | 'performance' | 'proposalsCreated';

export default function LeaderboardExplorer() {
  const [sortBy, setSortBy] = useState<SortKey>('votingPower');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<'all' | ParticipantType>('all');
  
  const filteredParticipants = filter === 'all' 
    ? participants 
    : participants.filter(p => p.type === filter);
  
  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
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
        title="Governance Leaderboard"
        description="View top participants and AI nodes in the D-Loop governance"
      />
      
      <div className="flex flex-wrap justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'Human' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('Human')}
          >
            Humans
          </Button>
          <Button 
            variant={filter === 'AI Node' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setFilter('AI Node')}
          >
            AI Nodes
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={sortBy === 'votingPower' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleSort('votingPower')}
          >
            Voting Power {sortBy === 'votingPower' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          <Button 
            variant={sortBy === 'performance' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleSort('performance')}
          >
            Performance {sortBy === 'performance' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          <Button 
            variant={sortBy === 'accuracy' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleSort('accuracy')}
          >
            Accuracy {sortBy === 'accuracy' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4">
        {sortedParticipants.map((participant, index) => (
          <Card 
            key={participant.address} 
            className={`overflow-hidden ${participant.isCurrentUser ? 'border-primary' : ''}`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    {participant.type === 'AI Node' ? '🤖' : '👤'}
                  </div>
                  <div>
                    <CardTitle className="text-base">
                      {participant.name || shortenAddress(participant.address)}
                      {participant.isCurrentUser && (
                        <Badge variant="outline" className="ml-2">You</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span className="text-xs">{shortenAddress(participant.address)}</span>
                      <Badge variant={participant.type === 'AI Node' ? 'info' : 'secondary'}>
                        {participant.type}
                      </Badge>
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">#{index + 1}</div>
                  <div className="text-xs text-muted-foreground">Rank</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Voting Power</p>
                  <p className="font-medium">{formatNumber(participant.votingPower)} DLOOP</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Performance</p>
                  <p className="font-medium text-green-500">+{participant.performance.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Accuracy</p>
                  <p className="font-medium">{participant.accuracy}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Proposals</p>
                  <p className="font-medium">{participant.proposalsCreated} created / {participant.proposalsVoted} voted</p>
                </div>
              </div>
              
              {participant.delegatedTo && (
                <div className="mt-2 text-sm flex items-center">
                  <span className="text-muted-foreground mr-2">Delegated to:</span>
                  <Badge variant="outline">
                    {participant.delegatedToName || shortenAddress(participant.delegatedTo)}
                  </Badge>
                </div>
              )}
              
              <div className="flex justify-end mt-4">
                {participant.type === 'AI Node' ? (
                  <Button size="sm">Delegate to this AI Node</Button>
                ) : (
                  participant.isCurrentUser ? (
                    <Button variant="outline" size="sm">Manage Delegations</Button>
                  ) : (
                    <Button size="sm">Delegate to this User</Button>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}