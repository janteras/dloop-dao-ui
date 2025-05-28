'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/common/ui/card';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, DollarSign, TrendingUp, Users, Wallet } from 'lucide-react';

interface ProtocolMetrics {
  tvl: number;
  tvlChange: number;
  dloopPrice: number;
  priceChange: number;
  activeParticipants: number;
  newParticipants: number;
}

// This would typically be fetched from an API
const defaultMetrics: ProtocolMetrics = {
  tvl: 12450000,
  tvlChange: 8.7,
  dloopPrice: 1.42,
  priceChange: 3.2,
  activeParticipants: 1247,
  newParticipants: 32,
};

export function ProtocolMetrics({ metrics = defaultMetrics }: { metrics?: ProtocolMetrics }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-tight mb-4">Protocol Metrics</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value Locked</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.tvl)}</div>
            <div className="flex items-center pt-1 text-xs text-muted-foreground">
              {metrics.tvlChange >= 0 ? (
                <>
                  <ArrowUpRight className="mr-1 h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-500">{metrics.tvlChange}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="mr-1 h-3.5 w-3.5 text-red-500" />
                  <span className="text-red-500">{Math.abs(metrics.tvlChange)}%</span>
                </>
              )}
              <span className="ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">DLOOP Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metrics.dloopPrice.toFixed(2)}</div>
            <div className="flex items-center pt-1 text-xs text-muted-foreground">
              {metrics.priceChange >= 0 ? (
                <>
                  <ArrowUpRight className="mr-1 h-3.5 w-3.5 text-green-500" />
                  <span className="text-green-500">{metrics.priceChange}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="mr-1 h-3.5 w-3.5 text-red-500" />
                  <span className="text-red-500">{Math.abs(metrics.priceChange)}%</span>
                </>
              )}
              <span className="ml-1">from last week</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.activeParticipants)}</div>
            <div className="flex items-center pt-1 text-xs text-muted-foreground">
              <TrendingUp className="mr-1 h-3.5 w-3.5 text-green-500" />
              <span className="text-green-500">+{metrics.newParticipants}</span>
              <span className="ml-1">new this week</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}