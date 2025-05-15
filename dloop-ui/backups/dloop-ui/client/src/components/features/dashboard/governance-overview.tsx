'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/ui/card';
import { timeRemaining } from '@/lib/utils';
import { Link } from 'wouter';
import { Badge } from '@/components/common/ui/badge';
import { Button } from '@/components/common/ui/button';

// Placeholder governance data
const governanceData = {
  activeProposals: 4,
  pendingExecution: 2,
  participationRate: 68,
  recentProposals: [
    { 
      id: '1', 
      title: 'Invest 100,000 DAI in BTC options', 
      endTime: Date.now() + 1000 * 60 * 60 * 24 * 2, // 2 days from now
      status: 'active',
      forVotes: 240000,
      againstVotes: 120000,
      type: 'asset-dao'
    },
    { 
      id: '2', 
      title: 'Update fee structure to 0.5%', 
      endTime: Date.now() + 1000 * 60 * 60 * 5, // 5 hours from now
      status: 'active',
      forVotes: 345000,
      againstVotes: 188000,
      type: 'protocol-dao'
    },
    { 
      id: '3', 
      title: 'Divest 50,000 DAI from ETH market', 
      endTime: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
      status: 'passed',
      forVotes: 410000,
      againstVotes: 82000,
      type: 'asset-dao'
    },
  ],
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'active':
      return 'info';
    case 'passed':
      return 'success';
    case 'failed':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export default function GovernanceOverview() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Governance Overview</CardTitle>
            <CardDescription>Active proposals and recent activity</CardDescription>
          </div>
          <div className="flex gap-2">
            <Link to="/asset-dao">
              <Button variant="outline" size="sm">Asset DAO</Button>
            </Link>
            <Link to="/protocol-dao">
              <Button variant="outline" size="sm">Protocol DAO</Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Active Proposals</p>
            <p className="text-2xl font-bold">{governanceData.activeProposals}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Pending Execution</p>
            <p className="text-2xl font-bold">{governanceData.pendingExecution}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Participation Rate</p>
            <p className="text-2xl font-bold">{governanceData.participationRate}%</p>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-3">Recent Proposals</h4>
          
          <div className="space-y-3">
            {governanceData.recentProposals.map((proposal) => (
              <Link key={proposal.id} to={`/${proposal.type}/proposal/${proposal.id}`} className="block">
                <div className="p-3 rounded-md border border-border hover:bg-muted cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <div className="mr-2">
                      <h5 className="font-medium">{proposal.title}</h5>
                      <div className="flex items-center mt-1 space-x-2">
                        <Badge variant={getStatusBadgeVariant(proposal.status)}>
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {proposal.status === 'active' 
                            ? `Ends in ${timeRemaining(proposal.endTime)}`
                            : `Ended ${timeRemaining(proposal.endTime)}`}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {proposal.type === 'asset-dao' ? 'Asset DAO' : 'Protocol DAO'}
                    </Badge>
                  </div>
                  
                  {proposal.status === 'active' && (
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ 
                          width: `${(proposal.forVotes / (proposal.forVotes + proposal.againstVotes)) * 100}%` 
                        }} 
                      />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}