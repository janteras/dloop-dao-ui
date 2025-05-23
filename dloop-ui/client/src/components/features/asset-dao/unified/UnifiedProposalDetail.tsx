/**
 * Unified Proposal Detail Component
 * 
 * This component provides a detailed view of a single proposal
 * while supporting both Ethers and Wagmi implementations through the unified AssetDAO contract hook.
 */

import React, { useEffect, useState } from 'react';
import { useUnifiedAssetDaoContract } from '@/hooks/unified/useUnifiedAssetDaoContract';
import { Web3Implementation } from '@/types/web3-types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, Calendar, User, DollarSign, Award, FileText } from 'lucide-react';
import { formatEthereumAddress } from '@/types/web3-types';
import { TokenSymbolResolver } from '@/services/tokenSymbolService';
import { UnifiedProposalVoting } from './UnifiedProposalVoting';
import { UnifiedProposalExecution } from './UnifiedProposalExecution';
import { ProposalState, ProposalType, ProposalDetails } from '@/services/enhanced-assetDaoService';
import { useUnifiedWallet } from '@/hooks/unified';

export interface UnifiedProposalDetailProps {
  /**
   * Proposal ID to display
   */
  proposalId: number;
  
  /**
   * Force a specific implementation regardless of feature flags
   */
  implementation?: Web3Implementation;
  
  /**
   * Additional CSS class names
   */
  className?: string;
  
  /**
   * Callback for going back to the proposal list
   */
  onBack?: () => void;
  
  /**
   * Callback when any action is completed
   */
  onActionComplete?: () => void;
}

/**
 * Unified Proposal Detail component provides a comprehensive view of a single proposal
 * with consistent behavior regardless of which implementation (Ethers or Wagmi) is being used
 */
export const UnifiedProposalDetail: React.FC<UnifiedProposalDetailProps> = (props) => {
  const {
    proposalId,
    implementation,
    className = '',
    onBack,
    onActionComplete
  } = props;
  
  // State for proposal data
  const [proposal, setProposal] = useState<ProposalDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  
  // Use unified hooks
  const { isConnected, address } = useUnifiedWallet({ implementation });
  const { 
    getProposal, 
    hasVoted: checkHasVoted,
    implementation: actualImplementation,
    telemetry 
  } = useUnifiedAssetDaoContract({ implementation });
  
  // Load proposal data
  useEffect(() => {
    const fetchProposalData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch the proposal
        const proposalData = await getProposal(proposalId);
        
        if (proposalData) {
          setProposal(proposalData);
          
          // Check if user has voted
          if (isConnected && address) {
            const voted = await checkHasVoted(proposalId, address);
            setHasVoted(!!voted);
          }
        } else {
          setError('Proposal not found');
        }
      } catch (err) {
        console.error('Error fetching proposal:', err);
        setError(err instanceof Error ? err.message : 'Unknown error fetching proposal');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProposalData();
  }, [proposalId, getProposal, isConnected, address, checkHasVoted]);
  
  // Handle action completion (voting or execution)
  const handleActionComplete = async () => {
    try {
      // Refetch the proposal
      const proposalData = await getProposal(proposalId);
      
      if (proposalData) {
        setProposal(proposalData);
        
        // Check if user has voted
        if (isConnected && address) {
          const voted = await checkHasVoted(proposalId, address);
          setHasVoted(!!voted);
        }
      }
      
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (err) {
      console.error('Error refreshing proposal:', err);
    }
  };
  
  // Proposal type display name
  const getProposalTypeName = (type: ProposalType): string => {
    switch (type) {
      case ProposalType.Investment:
        return 'Investment';
      case ProposalType.Divestment:
        return 'Divestment';
      case ProposalType.ParameterChange:
        return 'Parameter Change';
      default:
        return 'Other';
    }
  };
  
  // Proposal state display name
  const getProposalStateName = (state: ProposalState): string => {
    switch (state) {
      case ProposalState.Pending:
        return 'Pending';
      case ProposalState.Active:
        return 'Active';
      case ProposalState.Defeated:
        return 'Defeated';
      case ProposalState.Succeeded:
        return 'Succeeded';
      case ProposalState.Queued:
        return 'Queued';
      case ProposalState.Executed:
        return 'Executed';
      case ProposalState.Expired:
        return 'Expired';
      case ProposalState.Canceled:
        return 'Canceled';
      default:
        return 'Unknown';
    }
  };
  
  // Proposal state badge variant
  const getProposalStateBadgeVariant = (state: ProposalState): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (state) {
      case ProposalState.Active:
        return 'default';
      case ProposalState.Succeeded:
        return 'secondary';
      case ProposalState.Executed:
        return 'outline';
      case ProposalState.Defeated:
      case ProposalState.Expired:
      case ProposalState.Canceled:
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format token symbol
  const formatToken = (tokenAddress: string): string => {
    return TokenSymbolResolver.resolveSymbol(tokenAddress) || tokenAddress;
  };
  
  // Implementation indicator styles
  const implementationIndicatorStyle = {
    ethers: 'bg-blue-100 text-blue-800 border-blue-300',
    wagmi: 'bg-green-100 text-green-800 border-green-300'
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Implementation indicator */}
      <div className={`text-xs px-2 py-1 rounded-full inline-flex items-center border ${
        actualImplementation === 'wagmi' ? implementationIndicatorStyle.wagmi : implementationIndicatorStyle.ethers
      }`}>
        Using {actualImplementation} implementation
        {telemetry?.responseTime && (
          <span className="ml-2 text-xs opacity-75">
            ({Math.round(telemetry.responseTime)}ms)
          </span>
        )}
      </div>
      
      {/* Back button */}
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Proposals
        </Button>
      )}
      
      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center h-60">
          <Spinner className="w-8 h-8" />
          <span className="ml-2">Loading proposal details...</span>
        </div>
      ) : proposal ? (
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{proposal.title || `Proposal #${proposal.id}`}</CardTitle>
                <CardDescription className="mt-2 flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  Proposed by {formatEthereumAddress(proposal.proposer)}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant={getProposalStateBadgeVariant(proposal.state)}>
                  {getProposalStateName(proposal.state)}
                </Badge>
                <Badge variant="outline">
                  {getProposalTypeName(proposal.type)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Proposal details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created: {formatDate(proposal.createdAt)}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-2" />
                  Voting Ends: {formatDate(proposal.votingEnds)}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span className="text-gray-500">Amount:</span>
                  <span className="ml-2 font-medium">{proposal.amount} {formatToken(proposal.token)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Award className="h-4 w-4 mr-2" />
                  <span className="text-gray-500">Proposal ID:</span>
                  <span className="ml-2 font-medium">#{proposal.id}</span>
                </div>
              </div>
            </div>
            
            <Separator />
            
            {/* Proposal description */}
            <div>
              <h3 className="text-sm font-medium flex items-center mb-2">
                <FileText className="h-4 w-4 mr-2" />
                Description
              </h3>
              <div className="p-4 border rounded-md bg-gray-50 whitespace-pre-wrap">
                {proposal.description || 'No description provided.'}
              </div>
            </div>
            
            <Separator />
            
            {/* Voting results */}
            <div>
              <h3 className="text-sm font-medium mb-4">Voting Results</h3>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="rounded-md border p-4 text-center">
                  <div className="text-xl font-bold text-green-600">{proposal.yesVotes}</div>
                  <div className="text-sm text-gray-500">Yes Votes</div>
                </div>
                
                <div className="rounded-md border p-4 text-center">
                  <div className="text-xl font-bold text-red-600">{proposal.noVotes}</div>
                  <div className="text-sm text-gray-500">No Votes</div>
                </div>
                
                <div className="rounded-md border p-4 text-center">
                  <div className="text-xl font-bold text-gray-600">{proposal.abstainVotes}</div>
                  <div className="text-sm text-gray-500">Abstain</div>
                </div>
              </div>
              
              {/* Vote progress bar */}
              {(proposal.yesVotes > 0 || proposal.noVotes > 0) && (
                <div className="w-full h-4 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${proposal.yesVotes / (proposal.yesVotes + proposal.noVotes) * 100}%`
                    }}
                  />
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 bg-gray-50 p-6">
            {/* Voting actions */}
            {proposal.state === ProposalState.Active && (
              <div className="w-full">
                <h3 className="text-sm font-medium mb-2">Cast Your Vote</h3>
                <UnifiedProposalVoting
                  proposalId={proposal.id}
                  hasVoted={hasVoted}
                  implementation={implementation}
                  size="md"
                  className="w-full"
                  onVoteComplete={handleActionComplete}
                />
              </div>
            )}
            
            {/* Execution actions */}
            {proposal.state === ProposalState.Succeeded && (
              <div className="w-full">
                <h3 className="text-sm font-medium mb-2">Execute Proposal</h3>
                <UnifiedProposalExecution
                  proposalId={proposal.id}
                  proposalState={proposal.state}
                  implementation={implementation}
                  size="md"
                  className="w-full"
                  onExecuteComplete={handleActionComplete}
                />
              </div>
            )}
            
            {/* Already executed or canceled */}
            {(proposal.state === ProposalState.Executed || proposal.state === ProposalState.Canceled) && (
              <div className="w-full flex justify-center">
                <Badge variant={proposal.state === ProposalState.Executed ? 'outline' : 'destructive'} className="text-md py-2 px-4">
                  {proposal.state === ProposalState.Executed ? 'This proposal has been executed' : 'This proposal has been canceled'}
                </Badge>
              </div>
            )}
          </CardFooter>
        </Card>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>Proposal not found</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default UnifiedProposalDetail;
