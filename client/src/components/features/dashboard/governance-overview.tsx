'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/ui/card';
import { timeRemaining } from '@/lib/utils';
import { Link } from 'wouter';
import { Badge } from '@/components/common/ui/badge';
import { Button } from '@/components/common/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronRight, TrendingUp, Vote, Users, FileCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
// Import the image
import glitchImg from '../../../assets/glitch.jpg';

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

// Add voting activity chart data
const votingActivityData = [
  { day: 'Mon', votes: 12400 },
  { day: 'Tue', votes: 18100 },
  { day: 'Wed', votes: 15300 },
  { day: 'Thu', votes: 21000 },
  { day: 'Fri', votes: 19500 },
  { day: 'Sat', votes: 14200 },
  { day: 'Sun', votes: 16800 },
];

export default function GovernanceOverview() {
  const [mounted, setMounted] = useState(false);
  
  // Client-side only to avoid hydration issues with responsive features
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md">
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none hidden lg:block">
          <div className="w-full h-full bg-gradient-to-l from-primary to-transparent"></div>
        </div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center group">
                <Vote className="mr-2 h-5 w-5 text-primary transition-transform duration-300 group-hover:scale-110" />
                <span className="relative">
                  Governance Overview
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                </span>
              </CardTitle>
              <CardDescription>Active proposals and protocol governance</CardDescription>
            </div>
            <div className="flex gap-2">
              <Link to="/asset-dao">
                <Button variant="outline" size="sm" className="transition-all duration-200 hover:bg-primary/10 hover:border-primary">Treasury DAO</Button>
              </Link>
              <Link to="/protocol-dao">
                <Button variant="outline" size="sm" className="transition-all duration-200 hover:bg-primary/10 hover:border-primary">Protocol DAO</Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-muted/40 p-4 rounded-lg space-y-2 transition-all duration-300 hover:shadow-md hover:bg-muted/60 hover:translate-y-[-2px] cursor-pointer group">
              <div className="flex items-center text-sm font-medium text-muted-foreground">
                <FileCheck className="mr-2 h-4 w-4 text-primary transition-all duration-300 group-hover:text-primary/80 group-hover:scale-110" />
                <p className="transition-all duration-300 group-hover:text-foreground">Active Proposals</p>
              </div>
              <p className="text-3xl font-bold transition-all duration-300 group-hover:text-primary">{governanceData.activeProposals}</p>
              <p className="text-xs text-muted-foreground">+2 from last week</p>
            </div>
            <div className="bg-muted/40 p-4 rounded-lg space-y-2 transition-all duration-300 hover:shadow-md hover:bg-muted/60 hover:translate-y-[-2px] cursor-pointer group">
              <div className="flex items-center text-sm font-medium text-muted-foreground">
                <TrendingUp className="mr-2 h-4 w-4 text-primary transition-all duration-300 group-hover:text-primary/80 group-hover:scale-110" />
                <p className="transition-all duration-300 group-hover:text-foreground">Pending Execution</p>
              </div>
              <p className="text-3xl font-bold transition-all duration-300 group-hover:text-primary">{governanceData.pendingExecution}</p>
              <p className="text-xs text-muted-foreground">Ready for implementation</p>
            </div>
            <div className="bg-muted/40 p-4 rounded-lg space-y-2 transition-all duration-300 hover:shadow-md hover:bg-muted/60 hover:translate-y-[-2px] cursor-pointer group">
              <div className="flex items-center text-sm font-medium text-muted-foreground">
                <Users className="mr-2 h-4 w-4 text-primary transition-all duration-300 group-hover:text-primary/80 group-hover:scale-110" />
                <p className="transition-all duration-300 group-hover:text-foreground">Participation Rate</p>
              </div>
              <p className="text-3xl font-bold transition-all duration-300 group-hover:text-primary">{governanceData.participationRate}%</p>
              <p className="text-xs text-muted-foreground">+5.2% from previous cycle</p>
            </div>
          </div>
          
          {/* Voting Activity Chart */}
          {mounted && (
            <div className="mb-8 mt-4 group/chart">
              <h4 className="text-sm font-medium mb-3 flex items-center">
                <TrendingUp className="mr-2 h-4 w-4 text-primary transition-transform duration-300 group-hover/chart:scale-110" />
                <span className="relative">
                  Voting Activity
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary/40 transition-all duration-500 group-hover/chart:w-full"></span>
                </span>
              </h4>
              <div 
                className="h-[180px] w-full bg-muted/20 rounded-lg p-3 transition-all duration-300 hover:shadow-md hover:bg-muted/30"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={votingActivityData} className="transition-opacity duration-300">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#666" opacity={0.2} />
                    <XAxis 
                      dataKey="day" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(tick) => `${tick/1000}k`} 
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      formatter={(value) => [`${(Number(value)).toLocaleString()} votes`, 'Total']}
                      contentStyle={{
                        backgroundColor: 'rgba(22, 22, 22, 0.9)',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff'
                      }}
                      cursor={{ fill: 'hsl(var(--primary) / 0.1)' }}
                      animationDuration={300}
                    />
                    <Bar 
                      dataKey="votes" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                      animationDuration={1500}
                      className="hover:opacity-80 transition-opacity"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center">
              Recent Proposals
              <Badge variant="outline" className="ml-2">{governanceData.recentProposals.length} Total</Badge>
            </h4>
            
            <div className="space-y-3">
              {governanceData.recentProposals.map((proposal) => (
                <Link key={proposal.id} to={`/${proposal.type}/proposal/${proposal.id}`} className="block">
                  <div className="p-4 rounded-lg border border-border hover:bg-muted/50 hover:border-primary/30 hover:shadow-sm cursor-pointer transition-all duration-300 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="mr-2">
                        <h5 className="font-medium flex items-center group-hover:text-primary transition-colors duration-300">
                          {proposal.title}
                          <ChevronRight className="ml-1 h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                        </h5>
                        <div className="flex items-center mt-1 space-x-2">
                          <Badge variant={getStatusBadgeVariant(proposal.status)} className="capitalize transition-transform duration-300 group-hover:scale-105">
                            {proposal.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors duration-300">
                            {proposal.status === 'active' 
                              ? `Ends in ${timeRemaining(proposal.endTime)}`
                              : `Ended ${timeRemaining(proposal.endTime)}`}
                          </span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className="bg-muted/30 transition-all duration-300 group-hover:bg-primary/5 group-hover:border-primary/20"
                      >
                        {proposal.type === 'asset-dao' ? 'Treasury DAO' : 'Protocol DAO'}
                      </Badge>
                    </div>
                    
                    {proposal.status === 'active' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="transition-all duration-300 group-hover:text-green-500">For: {(proposal.forVotes/1000).toFixed(0)}k</span>
                          <span className="transition-all duration-300 group-hover:text-red-500">Against: {(proposal.againstVotes/1000).toFixed(0)}k</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden flex transition-all duration-300 group-hover:h-4">
                          <div 
                            className="h-full bg-green-500 transition-all duration-300 group-hover:bg-green-400" 
                            style={{ 
                              width: `${(proposal.forVotes / (proposal.forVotes + proposal.againstVotes)) * 100}%` 
                            }} 
                          />
                          <div 
                            className="h-full bg-red-500 transition-all duration-300 group-hover:bg-red-400" 
                            style={{ 
                              width: `${(proposal.againstVotes / (proposal.forVotes + proposal.againstVotes)) * 100}%` 
                            }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Delegate DLOOP Button */}
          <div className="mt-6 pt-4 border-t border-border group/delegate">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="transition-all duration-300 group-hover/delegate:translate-x-[-4px]">
                <h4 className="font-medium relative inline-block">
                  Maximize Your Impact
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary/60 transition-all duration-500 group-hover/delegate:w-full"></span>
                </h4>
                <p className="text-sm text-muted-foreground transition-colors duration-300 group-hover/delegate:text-muted-foreground/80">
                  Delegate your DLOOP tokens to increase your governance power
                </p>
              </div>
              <Link to="/delegations">
                <Button className="relative overflow-hidden transition-all duration-300 group-hover/delegate:shadow-md group-hover/delegate:bg-primary/90">
                  <span className="relative z-10 transition-all duration-300 group-hover/delegate:translate-x-0.5">Delegate DLOOP</span>
                  <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 opacity-0 group-hover/delegate:opacity-100 transition-opacity duration-500 group-hover/delegate:animate-pulse"></span>
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Glitch Image - Only visible on larger screens (laptop and above) */}
      {mounted && (
        <div className="hidden lg:block mt-6 overflow-hidden rounded-lg group/glitch relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-0 group-hover/glitch:opacity-100 transition-opacity duration-500 z-10"></div>
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/glitch:opacity-100 transition-opacity duration-300 z-10"></div>
          <img 
            src={glitchImg} 
            alt="D-Loop Governance Network" 
            className="w-full h-auto object-cover shadow-lg transition-all duration-700 group-hover/glitch:scale-105"
            style={{ maxHeight: '200px' }}
          />
          <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover/glitch:opacity-100 transition-all duration-500 transform translate-y-2 group-hover/glitch:translate-y-0">
            <p className="text-white text-sm font-medium">D-Loop Governance Network</p>
            <p className="text-white/70 text-xs">Decentralized governance for the future of finance</p>
          </div>
        </div>
      )}
    </>
  );
}