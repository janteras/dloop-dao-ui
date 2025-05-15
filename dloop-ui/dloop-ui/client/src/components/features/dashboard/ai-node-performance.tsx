'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/ui/card';
import { formatNumber } from '@/lib/utils';
import { Link } from 'wouter';
import { Button } from '@/components/common/ui/button';

// Placeholder AI node performance data
const aiNodePerformance = {
  totalDelegated: 120000,
  delegationChange: 8.2,
  averagePerformance: 14.3,
  performanceDelta: 2.1,
  newNodes: 3,
  topPerformers: [
    { id: '1', name: 'Alpha AI', performance: 22.5, strategy: 'Swing Trading' },
    { id: '2', name: 'Omega Intelligence', performance: 18.7, strategy: 'Market Making' },
    { id: '3', name: 'Sigma Predictor', performance: 15.4, strategy: 'Trend Following' },
  ],
};

export default function AINodePerformance() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>AI Node Performance</CardTitle>
            <CardDescription>Performance of top AI governance nodes</CardDescription>
          </div>
          <Link to="/ai-nodes">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Delegated</p>
            <p className="text-2xl font-bold">{formatNumber(aiNodePerformance.totalDelegated)} DLOOP</p>
            <p className={`text-sm ${aiNodePerformance.delegationChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {aiNodePerformance.delegationChange >= 0 ? '+' : ''}
              {aiNodePerformance.delegationChange}% this month
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Average Performance</p>
            <p className="text-2xl font-bold">{aiNodePerformance.averagePerformance}%</p>
            <p className={`text-sm ${aiNodePerformance.performanceDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {aiNodePerformance.performanceDelta >= 0 ? '+' : ''}
              {aiNodePerformance.performanceDelta}% from last month
            </p>
          </div>
        </div>
        
        <div>
          <div className="mb-2">
            <h4 className="text-sm font-medium">Top Performing Nodes</h4>
            <p className="text-xs text-muted-foreground">+{aiNodePerformance.newNodes} new nodes this month</p>
          </div>
          
          <div className="space-y-2">
            {aiNodePerformance.topPerformers.map((node) => (
              <Link key={node.id} to={`/ai-nodes/${node.id}`} className="block">
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer">
                  <div>
                    <p className="font-medium">{node.name}</p>
                    <p className="text-xs text-muted-foreground">{node.strategy}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium text-green-500`}>
                      +{node.performance}%
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}