/**
 * Proposal Analytics Component
 * 
 * Displays visual analytics for AssetDAO proposals including:
 * - Voting distribution
 * - Proposal outcomes
 * - Participation rates
 * - Historical trends
 */

import React, { useMemo } from 'react';
import { useProposalsQuery } from '@/hooks/query/useAssetDaoQueries';
import { ProposalState, ProposalType } from '@/services/enhanced-assetDaoService';

// Types
interface ProposalAnalyticsProps {
  // Filter to specific proposal types
  proposalTypes?: ProposalType[];
  // Time range in days (default: 30)
  timeRange?: number;
  // Implementation to use
  implementation?: 'ethers' | 'wagmi';
}

export const ProposalAnalytics: React.FC<ProposalAnalyticsProps> = ({
  proposalTypes,
  timeRange = 30,
  implementation
}) => {
  // Get all proposals within the time range
  const startDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() - timeRange);
    return date;
  }, [timeRange]);
  
  // Fetch proposals using React Query
  const { data: proposals, isLoading, isError } = useProposalsQuery();
  
  // Filter proposals by date and type
  const filteredProposals = useMemo(() => {
    if (!proposals) return [];
    
    return proposals.filter(proposal => {
      const isInTimeRange = new Date(proposal.createdAt) >= startDate;
      const isMatchingType = !proposalTypes || proposalTypes.includes(proposal.type);
      return isInTimeRange && isMatchingType;
    });
  }, [proposals, startDate, proposalTypes]);
  
  // Calculate summary statistics
  const stats = useMemo(() => {
    if (!filteredProposals.length) {
      return {
        totalProposals: 0,
        activeProposals: 0,
        succeededProposals: 0,
        defeatedProposals: 0,
        executedProposals: 0,
        averageYesVotes: 0,
        averageNoVotes: 0,
        averageParticipation: 0,
        proposalsByType: {},
        proposalsByState: {}
      };
    }
    
    // Count proposals by state
    const proposalsByState = filteredProposals.reduce((acc, proposal) => {
      const state = ProposalState[proposal.state];
      acc[state] = (acc[state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Count proposals by type
    const proposalsByType = filteredProposals.reduce((acc, proposal) => {
      const type = ProposalType[proposal.type];
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate averages
    const totalYesVotes = filteredProposals.reduce((sum, p) => sum + p.yesVotes, 0);
    const totalNoVotes = filteredProposals.reduce((sum, p) => sum + p.noVotes, 0);
    const totalVotes = totalYesVotes + totalNoVotes + 
                     filteredProposals.reduce((sum, p) => sum + p.abstainVotes, 0);
    
    return {
      totalProposals: filteredProposals.length,
      activeProposals: filteredProposals.filter(p => p.state === ProposalState.Active).length,
      succeededProposals: filteredProposals.filter(p => p.state === ProposalState.Succeeded).length,
      defeatedProposals: filteredProposals.filter(p => p.state === ProposalState.Defeated).length,
      executedProposals: filteredProposals.filter(p => p.state === ProposalState.Executed).length,
      averageYesVotes: totalYesVotes / filteredProposals.length,
      averageNoVotes: totalNoVotes / filteredProposals.length,
      averageParticipation: totalVotes / filteredProposals.length,
      proposalsByType,
      proposalsByState
    };
  }, [filteredProposals]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded w-1/4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
        <p className="text-center mt-4">Loading analytics...</p>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="text-red-800 font-medium">Error Loading Analytics</h3>
        <p className="text-red-600">Failed to load proposal data for analytics.</p>
      </div>
    );
  }
  
  // Empty state
  if (!filteredProposals.length) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center">
        <h3 className="font-medium">No Data Available</h3>
        <p className="text-gray-600">
          No proposals found for the selected time range and filters.
        </p>
      </div>
    );
  }
  
  return (
    <div className="proposal-analytics p-4">
      <div className="text-xs text-gray-500 mb-2">
        Using {implementation || 'default'} implementation
      </div>
      
      <h2 className="text-xl font-bold mb-4">Proposal Analytics</h2>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Total Proposals</p>
          <p className="text-2xl font-bold">{stats.totalProposals}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-blue-600">{stats.activeProposals}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Succeeded</p>
          <p className="text-2xl font-bold text-green-600">{stats.succeededProposals}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Executed</p>
          <p className="text-2xl font-bold text-purple-600">{stats.executedProposals}</p>
        </div>
      </div>
      
      {/* Vote Distribution */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold mb-2">Vote Distribution</h3>
        <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
          <div className="flex h-full">
            <div 
              className="bg-green-500 h-full flex items-center justify-center text-xs text-white"
              style={{ width: `${stats.averageYesVotes / (stats.averageYesVotes + stats.averageNoVotes) * 100}%` }}
            >
              Yes
            </div>
            <div 
              className="bg-red-500 h-full flex items-center justify-center text-xs text-white"
              style={{ width: `${stats.averageNoVotes / (stats.averageYesVotes + stats.averageNoVotes) * 100}%` }}
            >
              No
            </div>
          </div>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span>Avg. Yes: {Math.round(stats.averageYesVotes)}</span>
          <span>Avg. No: {Math.round(stats.averageNoVotes)}</span>
        </div>
      </div>
      
      {/* Proposals by Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Proposals by Type</h3>
          <div className="space-y-2">
            {Object.entries(stats.proposalsByType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span>{type}</span>
                <div className="flex items-center">
                  <div 
                    className="h-4 bg-blue-500 rounded-full mr-2" 
                    style={{ width: `${(count / stats.totalProposals) * 100}px` }}
                  ></div>
                  <span>{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Proposals by State */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Proposals by State</h3>
          <div className="space-y-2">
            {Object.entries(stats.proposalsByState).map(([state, count]) => (
              <div key={state} className="flex justify-between items-center">
                <span>{state}</span>
                <div className="flex items-center">
                  <div 
                    className={`h-4 rounded-full mr-2 ${
                      state === 'Active' ? 'bg-blue-500' :
                      state === 'Succeeded' ? 'bg-green-500' :
                      state === 'Executed' ? 'bg-purple-500' :
                      state === 'Defeated' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}
                    style={{ width: `${(count / stats.totalProposals) * 100}px` }}
                  ></div>
                  <span>{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Timeframe selector */}
      <div className="mt-6 flex justify-end">
        <select 
          className="border rounded p-1 text-sm"
          value={timeRange}
          onChange={(e) => {
            // This would be handled by a parent component changing the timeRange prop
            console.log('Selected time range:', e.target.value);
          }}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>
    </div>
  );
};
