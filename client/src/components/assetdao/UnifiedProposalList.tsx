/**
 * Unified Proposal List Component
 * 
 * Displays AssetDAO proposals using the unified contract pattern,
 * allowing seamless switching between Ethers and Wagmi implementations.
 * Includes telemetry and implementation status indicators.
 */

import React, { useState, useMemo } from 'react';
import { useUnifiedAssetDaoContract } from '@/hooks/useUnifiedAssetDaoContract';
import { MigrationStatusIndicator } from '@/components/migration/MigrationStatusIndicator';
import { AssetDaoProposal } from '@/services/wagmi/enhancedAssetDaoContractService';
import { useAppConfig } from '@/config/app-config';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { WalletConnectBanner } from '@/components/features/wallet/wallet-connect-banner';

// Styles for different card states
const cardStatusStyles = {
  active: 'border-blue-500 bg-blue-50',
  passed: 'border-green-500 bg-green-50',
  failed: 'border-red-500 bg-red-50',
  executed: 'border-purple-500 bg-purple-50',
  canceled: 'border-gray-500 bg-gray-50',
};

interface UnifiedProposalListProps {
  /** If true, forces the component to use the Wagmi implementation */
  forceWagmi?: boolean;
  /** If true, forces the component to use the Ethers implementation */
  forceLegacy?: boolean;
  /** Custom class names for the container */
  className?: string;
  /** Custom chain ID */
  chainId?: number;
}

/**
 * Unified Proposal List Component
 */
export const UnifiedProposalList: React.FC<UnifiedProposalListProps> = ({
  forceWagmi = false,
  forceLegacy = false,
  className = '',
  chainId,
}) => {
  const { featureFlags } = useAppConfig();
  const { isConnected } = useWallet();
  const [showDetails, setShowDetails] = useState<Record<number, boolean>>({});

  // Get the contract implementation based on feature flags or forced options
  const assetDaoContract = useUnifiedAssetDaoContract({
    forceWagmi,
    forceLegacy,
    enableTelemetry: true,
    chainId
  });

  // Fetch proposals using the unified contract pattern
  const { 
    proposals, 
    isLoading, 
    error, 
    refetch,
    implementation 
  } = assetDaoContract.useGetAllProposals();

  // Filter active proposals to the top
  const sortedProposals = useMemo(() => {
    if (!proposals) return [];
    
    return [...proposals].sort((a, b) => {
      // Active proposals first
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      
      // Then sort by creation date, newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [proposals]);

  // Toggle proposal details
  const toggleDetails = (proposalId: number) => {
    setShowDetails(prev => ({
      ...prev,
      [proposalId]: !prev[proposalId]
    }));
  };

  // Generate progress bar width based on votes
  const getProgressWidth = (proposal: AssetDaoProposal) => {
    const forVotes = parseFloat(proposal.forVotes);
    const againstVotes = parseFloat(proposal.againstVotes);
    const total = forVotes + againstVotes;
    
    if (total === 0) return '0%';
    return `${(forVotes / total) * 100}%`;
  };

  // Render proposal card
  const renderProposalCard = (proposal: AssetDaoProposal) => {
    const statusClass = cardStatusStyles[proposal.status] || cardStatusStyles.active;
    
    return (
      <div 
        key={proposal.id}
        className={`border-l-4 rounded-md p-4 mb-4 shadow-sm ${statusClass} transition-all hover:shadow-md`}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center">
              <h3 className="text-lg font-semibold">{proposal.title}</h3>
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white border">
                #{proposal.id}
              </span>
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-white border capitalize">
                {proposal.type}
              </span>
            </div>
            <div className="text-gray-600 text-sm mt-1">
              Proposed by: {truncateAddress(proposal.proposer)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium">{proposal.amount} {getTokenSymbol(proposal.token)}</div>
            <div className="text-xs text-gray-600 mt-1 capitalize">{proposal.status}</div>
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span>For: {proposal.forVotes}</span>
            <span>Against: {proposal.againstVotes}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full" 
              style={{ width: getProgressWidth(proposal) }}
            ></div>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-600">
          <div className="flex justify-between">
            <div>Created: {formatDate(proposal.createdAt)}</div>
            <div>Deadline: {formatDate(proposal.deadline)}</div>
          </div>
        </div>
        
        <button
          className="mt-3 text-blue-600 text-sm hover:underline focus:outline-none"
          onClick={() => toggleDetails(proposal.id)}
        >
          {showDetails[proposal.id] ? 'Hide Details' : 'Show Details'}
        </button>
        
        {showDetails[proposal.id] && (
          <div className="mt-3 p-3 bg-white rounded-md border text-sm">
            <div className="mb-2">{proposal.description}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>Token Address:</div>
              <div className="font-mono">{truncateAddress(proposal.token)}</div>
              
              <div>Proposer:</div>
              <div className="font-mono">{proposal.proposer}</div>
              
              <div>Executed:</div>
              <div>{proposal.executed ? 'Yes' : 'No'}</div>
              
              <div>Canceled:</div>
              <div>{proposal.canceled ? 'Yes' : 'No'}</div>
              
              <div>Quorum Reached:</div>
              <div>{proposal.quorumReached ? 'Yes' : 'No'}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper function to truncate addresses
  const truncateAddress = (address: string): string => {
    if (!address) return '';
    // Don't truncate special addresses like "AI.Gov"
    if (!address.startsWith('0x')) return address;
    
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}....${address.substring(address.length - 4)}`;
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Helper function to get token symbol
  const getTokenSymbol = (tokenAddress: string): string => {
    const knownTokens: Record<string, string> = {
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'WBTC',
      '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': 'UNI',
      '0x6b175474e89094c44da98b954eedeac495271d0f': 'DAI',
      '0xdloop1234567890123456789012345678901234': 'DLOOP',
    };
    
    // Case-insensitive match
    const normalizedAddress = tokenAddress.toLowerCase();
    for (const [address, symbol] of Object.entries(knownTokens)) {
      if (address.toLowerCase() === normalizedAddress) {
        return symbol;
      }
    }
    
    return 'UNKNOWN';
  };

  // If wallet is not connected, show wallet connect banner
  if (!isConnected) {
    return (
      <div className={`w-full ${className}`}>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4">Proposals</h2>
          <WalletConnectBanner />
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Proposals</h2>
        <div className="flex items-center">
          <MigrationStatusIndicator
            componentName="AssetDAO"
            implementation={implementation}
            size="sm"
          />
          <button
            onClick={() => refetch()}
            className="ml-4 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="p-4 mb-4 bg-red-50 text-red-700 border border-red-200 rounded-md">
          Error loading proposals: {error.message}
        </div>
      )}
      
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading proposals...</p>
        </div>
      ) : sortedProposals.length === 0 ? (
        <div className="p-8 text-center border rounded-md bg-gray-50">
          <p className="text-gray-600">No proposals found.</p>
        </div>
      ) : (
        <div>
          {sortedProposals.map(renderProposalCard)}
        </div>
      )}
    </div>
  );
};

export default UnifiedProposalList;
