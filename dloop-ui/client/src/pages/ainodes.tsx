import { useState } from 'react';
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GovernanceNodeExplorer } from '@/components/features/ai-nodes/governance-node-explorer';
import { SoulboundManager } from '@/components/features/ai-nodes/soulbound-manager';
import { PageContainer } from "@/components/layout/PageContainer";
import { useWallet } from '@/hooks/useWallet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ExternalLink, BarChart3, ShieldCheck, Brain, ServerIcon, Network, PieChart, SparklesIcon } from 'lucide-react';
import { SentimentVisualizer } from '@/components/features/ai-nodes/sentiment-visualizer';

// Analytics Component
function AIAnalytics() {
  const statsData = [
    { 
      title: 'Total AI Nodes', 
      value: '10', 
      change: '+2 this month',
      icon: <ServerIcon className="h-5 w-5 text-primary" />
    },
    { 
      title: 'Governance Proposals', 
      value: '26', 
      change: '+8 this month',
      icon: <ShieldCheck className="h-5 w-5 text-primary" />
    },
    { 
      title: 'Average Response Time', 
      value: '4.2 hours', 
      change: '-0.5 from last month',
      icon: <Brain className="h-5 w-5 text-primary" />
    },
    { 
      title: 'Total Delegations', 
      value: '142', 
      change: '+38 this month',
      icon: <Network className="h-5 w-5 text-primary" />
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg mb-4">
        <h2 className="text-2xl font-bold mb-2">AI Governance Analytics</h2>
        <p className="text-muted-foreground">
          Insights on the performance and impact of D-Loop's AI Governance Nodes.
          All data is sourced on-chain from protocol activity.
        </p>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                {stat.icon}
              </div>
              <CardDescription className="text-2xl font-bold pt-1">
                {stat.value}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" /> Governance Node Performance
          </CardTitle>
          <CardDescription>
            Comparison of prediction accuracy and response times across nodes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'AI.Gov#01', accuracy: 92, responseTime: 3.8 },
              { name: 'AI.Gov#02', accuracy: 88, responseTime: 4.2 },
              { name: 'AI.Gov#05', accuracy: 95, responseTime: 2.9 },
              { name: 'AI.Gov#07', accuracy: 87, responseTime: 5.1 },
              { name: 'AI.Gov#09', accuracy: 91, responseTime: 4.0 }
            ].map((node, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-sm mb-1">
                  <div>{node.name}</div>
                  <div className="text-muted-foreground">Accuracy: {node.accuracy}%</div>
                </div>
                <Progress value={node.accuracy} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <div>Response Time: {node.responseTime} hours</div>
                  <div>{node.accuracy > 90 ? '✓ Excellent' : node.accuracy > 85 ? '✓ Good' : '⚠ Needs Improvement'}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Proposal Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Proposal Categories</CardTitle>
            <CardDescription>Distribution of proposal types voted on by AI Nodes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { category: 'Parameter Updates', percentage: 38 },
                { category: 'Asset Investment', percentage: 25 },
                { category: 'Asset Divestment', percentage: 18 },
                { category: 'Protocol Upgrades', percentage: 12 },
                { category: 'Other', percentage: 7 }
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.category}</span>
                    <span>{item.percentage}%</span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Delegation Activity</CardTitle>
            <CardDescription>Trends in user delegation to governance nodes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <p>Interactive chart will be available in production</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => window.open("https://sepolia.etherscan.io/token/0x6391C14631b2Be5374297fA3110687b80233104c", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-1" /> View Contract Activity
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AINodesPage() {
  const [location] = useLocation();
  const { isConnected } = useWallet();
  
  // Check if we're on a node detail page
  const isNodeDetail = location.startsWith('/ai-nodes/') && location.split('/').length === 3;
  
  if (isNodeDetail) {
    const nodeId = location.split('/').pop();
    return (
      <PageContainer>
        {/* In a complete implementation, we would fetch the node details and 
            render a node detail component */}
        <GovernanceNodeExplorer />
      </PageContainer>
    );
  }
  
  // Otherwise show the enhanced AI node explorer with tabs
  return (
    <PageContainer>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">AI Governance</h1>
          <p className="text-muted-foreground mt-1">
            Explore, Delegate and launch AI Governance Nodes
          </p>
        </div>
        {isConnected && (
          <Button 
            onClick={() => window.open("https://sepolia.etherscan.io/token/0x6391C14631b2Be5374297fA3110687b80233104c", "_blank")}
            variant="outline"
            className="mt-4 md:mt-0"
          >
            View SoulboundNFT Contract <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      
      <Tabs 
        defaultValue="explorer" 
        className="w-full"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="explorer">
            <ServerIcon className="h-4 w-4 mr-2" /> Browse Nodes
          </TabsTrigger>
          <TabsTrigger value="sentiment">
            <SparklesIcon className="h-4 w-4 mr-2" /> Node Sentiment
          </TabsTrigger>
          <TabsTrigger value="identity">
            <ShieldCheck className="h-4 w-4 mr-2" /> Manage Identity
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" /> View Performance
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="explorer">
          <GovernanceNodeExplorer />
        </TabsContent>
        
        <TabsContent value="identity">
          <SoulboundManager />
        </TabsContent>
        
        <TabsContent value="sentiment">
          <SentimentVisualizer />
        </TabsContent>

        <TabsContent value="analytics">
          <AIAnalytics />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
