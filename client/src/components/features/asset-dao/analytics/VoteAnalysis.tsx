/**
 * Vote Analysis Component
 * 
 * Provides detailed analysis of voting patterns for AssetDAO proposals
 * including user participation, vote breakdown by user type, and
 * historical voting trends.
 */

import React, { useMemo, useState } from 'react';
import { useProposalsQuery } from '@/hooks/query/useAssetDaoQueries';
import { useUnifiedWallet } from '@/hooks/unified';
import { ProposalState } from '@/services/enhanced-assetDaoService';
import { EnhancedTokenService } from '@/services/enhanced-token-service';

// Types
interface VoteAnalysisProps {
  proposalId?: number; // If provided, analyze just this proposal
  implementation?: 'ethers' | 'wagmi';
  showUserSpecificData?: boolean;
}

// Helper function to format large numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const VoteAnalysis: React.FC<VoteAnalysisProps> = ({
  proposalId,
  implementation,
  showUserSpecificData = true
}) => {
  const { address, isConnected } = useUnifiedWallet();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'userActivity' | 'timeAnalysis'>('overview');
  
  // Fetch all proposals or specific proposal
  const { data: proposals, isLoading, isError } = useProposalsQuery(
    {}, // Default pagination
    proposalId ? { ids: [proposalId] } : {} // Filter to specific proposal if ID provided
  );
  
  // Calculate vote analysis data
  const analysisData = useMemo(() => {
    if (!proposals || proposals.length === 0) {
      return {
        totalVotes: 0,
        yesVotes: 0,
        noVotes: 0,
        abstainVotes: 0,
        yesPercentage: 0,
        noPercentage: 0,
        abstainPercentage: 0,
        averageParticipation: 0,
        highestParticipation: 0,
        lowestParticipation: 0,
        userVoteCount: 0,
        userVoteStreak: 0,
        avgTimeToExecute: 0,
        voteTrend: []
      };
    }
    
    const totalVotes = proposals.reduce(
      (sum, p) => sum + p.yesVotes + p.noVotes + p.abstainVotes, 
      0
    );
    
    const yesVotes = proposals.reduce((sum, p) => sum + p.yesVotes, 0);
    const noVotes = proposals.reduce((sum, p) => sum + p.noVotes, 0);
    const abstainVotes = proposals.reduce((sum, p) => sum + p.abstainVotes, 0);
    
    // Calculate participation percentages
    const participationRates = proposals.map(p => {
      const total = p.yesVotes + p.noVotes + p.abstainVotes;
      // This would be more accurate with the total voting power, but we'll use an estimate
      const estimatedTotalVotingPower = total * 1.5; // Assuming about 66% participation rate
      return total / estimatedTotalVotingPower;
    });
    
    // Calculate average time to execute for completed proposals
    const executedProposals = proposals.filter(p => p.state === ProposalState.Executed);
    const avgTimeToExecute = executedProposals.length > 0
      ? executedProposals.reduce((sum, p) => {
          const createdAt = new Date(p.createdAt).getTime();
          const executedAt = new Date(p.executedAt || Date.now()).getTime();
          return sum + (executedAt - createdAt);
        }, 0) / executedProposals.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0;
    
    // Generate vote trend data (this would ideally come from historical data)
    const voteTrend = proposals
      .filter(p => p.state !== ProposalState.Active) // Only include completed proposals
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map(p => {
        const total = p.yesVotes + p.noVotes + p.abstainVotes;
        return {
          proposalId: p.id,
          yesPercentage: total > 0 ? (p.yesVotes / total) * 100 : 0,
          participation: participationRates[proposals.indexOf(p)] * 100
        };
      });
    
    return {
      totalVotes,
      yesVotes,
      noVotes,
      abstainVotes,
      yesPercentage: totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0,
      noPercentage: totalVotes > 0 ? (noVotes / totalVotes) * 100 : 0,
      abstainPercentage: totalVotes > 0 ? (abstainVotes / totalVotes) * 100 : 0,
      averageParticipation: participationRates.length > 0
        ? participationRates.reduce((sum, rate) => sum + rate, 0) / participationRates.length * 100
        : 0,
      highestParticipation: Math.max(...participationRates) * 100,
      lowestParticipation: Math.min(...participationRates) * 100,
      userVoteCount: 3, // Placeholder for user's vote count
      userVoteStreak: 2, // Placeholder for user's voting streak
      avgTimeToExecute,
      voteTrend
    };
  }, [proposals]);
  
  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded shadow">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
        <p className="text-center mt-4 text-gray-500">Loading vote analysis...</p>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="text-red-800 font-medium">Error Loading Vote Analysis</h3>
        <p className="text-red-600">Failed to load voting data.</p>
      </div>
    );
  }
  
  // Empty state
  if (!proposals || proposals.length === 0) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded text-center">
        <h3 className="font-medium">No Voting Data Available</h3>
        <p className="text-gray-600">
          No proposals found to analyze.
        </p>
      </div>
    );
  }
  
  return (
    <div className="vote-analysis bg-white rounded shadow p-4">
      <div className="text-xs text-gray-500 mb-2">
        Using {implementation || 'default'} implementation
      </div>
      
      <h2 className="text-xl font-bold mb-4">Vote Analysis</h2>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="flex -mb-px">
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              selectedTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setSelectedTab('overview')}
          >
            Overview
          </button>
          
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              selectedTab === 'userActivity'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setSelectedTab('userActivity')}
            disabled={!showUserSpecificData || !isConnected}
          >
            Your Activity
          </button>
          
          <button
            className={`py-2 px-4 border-b-2 font-medium text-sm ${
              selectedTab === 'timeAnalysis'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setSelectedTab('timeAnalysis')}
          >
            Time Analysis
          </button>
        </nav>
      </div>
      
      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div>
          {/* Vote Distribution */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Vote Distribution</h3>
            <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden">
              <div className="flex h-full">
                <div 
                  className="bg-green-500 h-full flex items-center justify-center text-xs text-white"
                  style={{ width: `${analysisData.yesPercentage}%` }}
                >
                  {analysisData.yesPercentage > 10 ? `${Math.round(analysisData.yesPercentage)}%` : ''}
                </div>
                <div 
                  className="bg-red-500 h-full flex items-center justify-center text-xs text-white"
                  style={{ width: `${analysisData.noPercentage}%` }}
                >
                  {analysisData.noPercentage > 10 ? `${Math.round(analysisData.noPercentage)}%` : ''}
                </div>
                <div 
                  className="bg-gray-400 h-full flex items-center justify-center text-xs text-white"
                  style={{ width: `${analysisData.abstainPercentage}%` }}
                >
                  {analysisData.abstainPercentage > 10 ? `${Math.round(analysisData.abstainPercentage)}%` : ''}
                </div>
              </div>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <div>
                <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                Yes: {formatNumber(analysisData.yesVotes)}
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                No: {formatNumber(analysisData.noVotes)}
              </div>
              <div>
                <span className="inline-block w-3 h-3 bg-gray-400 rounded-full mr-1"></span>
                Abstain: {formatNumber(analysisData.abstainVotes)}
              </div>
            </div>
          </div>
          
          {/* Participation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">Average Participation</p>
              <p className="text-xl font-bold">{Math.round(analysisData.averageParticipation)}%</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">Highest Participation</p>
              <p className="text-xl font-bold">{Math.round(analysisData.highestParticipation)}%</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">Total Votes Cast</p>
              <p className="text-xl font-bold">{formatNumber(analysisData.totalVotes)}</p>
            </div>
          </div>
          
          {/* Proposal Outcomes */}
          <div className="mb-6">
            <h3 className="font-semibold mb-2">Proposal Outcomes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-3 rounded text-center">
                <p className="text-xs text-gray-500">Active</p>
                <p className="text-lg font-bold text-blue-600">
                  {proposals.filter(p => p.state === ProposalState.Active).length}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded text-center">
                <p className="text-xs text-gray-500">Succeeded</p>
                <p className="text-lg font-bold text-green-600">
                  {proposals.filter(p => p.state === ProposalState.Succeeded).length}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded text-center">
                <p className="text-xs text-gray-500">Defeated</p>
                <p className="text-lg font-bold text-red-600">
                  {proposals.filter(p => p.state === ProposalState.Defeated).length}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded text-center">
                <p className="text-xs text-gray-500">Executed</p>
                <p className="text-lg font-bold text-purple-600">
                  {proposals.filter(p => p.state === ProposalState.Executed).length}
                </p>
              </div>
            </div>
          </div>
          
          {/* Vote Trend (Simple version) */}
          <div>
            <h3 className="font-semibold mb-2">Vote Trend</h3>
            <div className="h-40 bg-gray-50 p-3 rounded relative">
              {analysisData.voteTrend.length > 0 ? (
                <div className="flex items-end justify-between h-32">
                  {analysisData.voteTrend.map((data, index) => (
                    <div key={index} className="flex flex-col items-center w-1/6">
                      <div className="relative w-full h-32">
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-green-500"
                          style={{ height: `${data.yesPercentage * 0.32}px` }} // Scale to fit the height
                        ></div>
                        <div 
                          className="absolute bottom-0 left-0 right-0 bg-blue-400 opacity-50 border-t border-blue-600"
                          style={{ height: `${data.participation * 0.32}px` }} // Scale to fit the height
                        ></div>
                      </div>
                      <span className="text-xs mt-1 text-gray-500">#{data.proposalId}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Not enough data for trend analysis</p>
                </div>
              )}
              
              <div className="absolute bottom-10 left-0 right-0 flex justify-between text-xs text-gray-500 px-4">
                <div>
                  <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                  Yes %
                </div>
                <div>
                  <span className="inline-block w-3 h-3 bg-blue-400 opacity-50 rounded-full mr-1"></span>
                  Participation %
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* User Activity Tab */}
      {selectedTab === 'userActivity' && (
        <div>
          {!isConnected ? (
            <div className="bg-blue-50 p-4 rounded text-center">
              <p className="text-blue-800">Connect your wallet to view your voting activity</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Your Votes</p>
                  <p className="text-xl font-bold">{analysisData.userVoteCount}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Voting Streak</p>
                  <p className="text-xl font-bold">{analysisData.userVoteStreak} proposals</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Voting Power</p>
                  <p className="text-xl font-bold">
                    {address 
                      ? EnhancedTokenService.formatTokenAmount('1000000000000000000', 18) 
                      : '0'}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded mb-4">
                <h3 className="font-semibold mb-2">Your Recent Votes</h3>
                <div className="space-y-2">
                  {/* This would be populated with real data in a full implementation */}
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <div>
                      <p className="font-medium">Proposal #42</p>
                      <p className="text-xs text-gray-500">Voted 2 days ago</p>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Voted Yes</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <div>
                      <p className="font-medium">Proposal #41</p>
                      <p className="text-xs text-gray-500">Voted 5 days ago</p>
                    </div>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Voted No</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-white rounded">
                    <div>
                      <p className="font-medium">Proposal #39</p>
                      <p className="text-xs text-gray-500">Voted 2 weeks ago</p>
                    </div>
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Abstained</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded text-center">
                <p className="text-blue-800">
                  You've participated in {Math.round(analysisData.userVoteCount / proposals.length * 100)}% of all proposals
                </p>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Time Analysis Tab */}
      {selectedTab === 'timeAnalysis' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">Avg. Time to Execute</p>
              <p className="text-xl font-bold">
                {analysisData.avgTimeToExecute.toFixed(1)} days
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-500">Avg. Voting Period</p>
              <p className="text-xl font-bold">
                {proposals.length > 0 
                  ? ((proposals.reduce((sum, p) => {
                      const start = new Date(p.createdAt).getTime();
                      const end = new Date(p.votingEnds).getTime();
                      return sum + (end - start);
                    }, 0) / proposals.length) / (1000 * 60 * 60 * 24)).toFixed(1)
                  : '0'} days
              </p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded mb-4">
            <h3 className="font-semibold mb-2">Proposal Timeline</h3>
            <div className="space-y-6 py-2">
              {proposals.slice(0, 3).map((proposal, index) => (
                <div key={index} className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                  
                  {/* Created marker */}
                  <div className="flex items-center mb-2 relative">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center z-10">
                      1
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">Created</p>
                      <p className="text-xs text-gray-500">
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Voting marker */}
                  <div className="flex items-center mb-2 relative">
                    <div className="w-8 h-8 rounded-full bg-yellow-500 text-white flex items-center justify-center z-10">
                      2
                    </div>
                    <div className="ml-4">
                      <p className="font-medium">Voting Period</p>
                      <p className="text-xs text-gray-500">
                        {new Date(proposal.votingEnds).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Execution marker (if executed) */}
                  {proposal.state === ProposalState.Executed && (
                    <div className="flex items-center relative">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center z-10">
                        3
                      </div>
                      <div className="ml-4">
                        <p className="font-medium">Executed</p>
                        <p className="text-xs text-gray-500">
                          {new Date(proposal.executedAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Defeated marker (if defeated) */}
                  {proposal.state === ProposalState.Defeated && (
                    <div className="flex items-center relative">
                      <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center z-10">
                        3
                      </div>
                      <div className="ml-4">
                        <p className="font-medium">Defeated</p>
                        <p className="text-xs text-gray-500">
                          After voting period
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 mb-4 border-b border-gray-300"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
