'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/ui/card';
import { formatDate, shortenAddress } from '@/lib/utils';
import { Badge } from '@/components/common/ui/badge';

// Placeholder activity data
const activityData = [
  {
    id: '1',
    type: 'proposal_created',
    title: 'New proposal created',
    description: 'Invest 100,000 DAI in BTC options',
    actor: '0x1234567890abcdef1234567890abcdef12345678',
    actorName: 'Alpha AI',
    timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    actorType: 'AI Node',
    status: 'active',
  },
  {
    id: '2',
    type: 'vote_cast',
    title: 'Vote cast',
    description: 'Update fee structure to 0.5%',
    actor: '0xabcdef1234567890abcdef1234567890abcdef12',
    actorName: 'John Doe',
    timestamp: Date.now() - 1000 * 60 * 60 * 2, // 2 hours ago
    actorType: 'Human',
    status: 'for',
  },
  {
    id: '3',
    type: 'proposal_executed',
    title: 'Proposal executed',
    description: 'Divest 50,000 DAI from ETH market',
    actor: '0x7890abcdef1234567890abcdef1234567890abcd',
    actorName: 'System',
    timestamp: Date.now() - 1000 * 60 * 60 * 12, // 12 hours ago
    actorType: 'System',
    status: 'executed',
  },
  {
    id: '4',
    type: 'delegation',
    title: 'Delegation created',
    description: '500 DLOOP delegated to Omega Intelligence',
    actor: '0xdef1234567890abcdef1234567890abcdef12345',
    actorName: 'Alice Smith',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    actorType: 'Human',
    status: 'active',
  },
  {
    id: '5',
    type: 'reward_distribution',
    title: 'Rewards distributed',
    description: '75 DLOOP rewards claimed',
    actor: '0x567890abcdef1234567890abcdef1234567890ab',
    actorName: 'Bob Johnson',
    timestamp: Date.now() - 1000 * 60 * 60 * 36, // 1.5 days ago
    actorType: 'Human',
    status: 'completed',
  },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'proposal_created':
      return '📝';
    case 'vote_cast':
      return '🗳️';
    case 'proposal_executed':
      return '✅';
    case 'delegation':
      return '🤝';
    case 'reward_distribution':
      return '💰';
    default:
      return '📊';
  }
};

const getActorBadgeVariant = (actorType: string) => {
  switch (actorType) {
    case 'AI Node':
      return 'info';
    case 'Human':
      return 'secondary';
    case 'System':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'active':
    case 'for':
      return 'success';
    case 'against':
      return 'destructive';
    case 'executed':
    case 'completed':
      return 'secondary';
    default:
      return 'outline';
  }
};

export default function ActivityFeed() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>The latest activities across the protocol</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {activityData.map((activity) => (
            <div key={activity.id} className="flex gap-4">
              <div className="mt-1 text-xl">{getActivityIcon(activity.type)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(activity.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant={getActorBadgeVariant(activity.actorType)}>
                    {activity.actorType}
                  </Badge>
                  <span className="text-muted-foreground">
                    {activity.actorName || shortenAddress(activity.actor)}
                  </span>
                  <Badge variant={getStatusBadgeVariant(activity.status)}>
                    {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}