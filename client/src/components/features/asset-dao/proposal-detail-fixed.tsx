'use client';

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, AlertTriangle, CheckCircle, XCircle, ArrowLeft, Copy } from 'lucide-react';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { useProposals } from '@/hooks/useProposals';
import { useToast } from '@/hooks/use-toast';
import { timeRemaining, shortenAddress, formatDate, copyToClipboard } from '@/lib/utils';
import { EnhancedAssetDAOService, ProposalType } from '@/services/enhanced-assetDaoService';
import { TokenSymbolResolver } from '@/services/tokenSymbolService';
import toast from 'react-hot-toast';
import { Proposal } from '@/types';

interface ProposalDetailProps {
  proposalId: string;
}

export function ProposalDetail({ proposalId }: ProposalDetailProps) {
  const id = parseInt(proposalId, 10);
  const { isConnected, provider, signer } = useWallet();
  const { proposals = [], refetchProposals } = useProposals();
  const { toast: uiToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // State for user votes
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoteFor, setIsVoteFor] = useState<boolean | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    // Simulate loading for demonstration
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Check if user has voted on this proposal
    // This would normally be fetched from the blockchain
    // For demo purposes, we'll use local storage
    const votedProposals = JSON.parse(localStorage.getItem('votedProposals') || '{}');
    if (votedProposals[id]) {
      setHasVoted(true);
      setIsVoteFor(votedProposals[id]);
    }
  }, [id]);

  // Find the relevant proposal
  const proposal = proposals.find((p) => p.id === id);

  const handleVote = async (support: boolean) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first.');
      return;
    }

    if (!signer) {
      toast.error('Signer not available. Please reconnect your wallet.');
      return;
    }

    setIsVoting(true);
    try {
      // Use EnhancedAssetDAOService for better error handling
      await EnhancedAssetDAOService.voteOnProposal(signer, id, support);
      
      // Save vote to local storage (for demo)
      const votedProposals = JSON.parse(localStorage.getItem('votedProposals') || '{}');
      votedProposals[id] = support;
      localStorage.setItem('votedProposals', JSON.stringify(votedProposals));
      
      toast.success(`Successfully voted ${support ? 'FOR' : 'AGAINST'} the proposal`);
      setHasVoted(true);
      setIsVoteFor(support);
      
      refetchProposals();
    } catch (error: any) {
      toast.error(error.message || 'There was an error casting your vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  const handleExecute = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet to execute this proposal.');
      return;
    }

    if (!signer) {
      toast.error('Signer not available. Please reconnect your wallet.');
      return;
    }

    setIsExecuting(true);
    try {
      await EnhancedAssetDAOService.executeProposal(signer, id);
      toast.success('Proposal executed successfully!');
      refetchProposals();
    } catch (error: any) {
      toast.error(error.message || 'There was an error executing the proposal. Please try again.');
    } finally {
      setIsExecuting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'passed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'executed':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  // Improved proposal type display that handles both string-based types and enum-based types
  const getProposalTypeDisplay = (proposalType: ProposalType | number | string): string => {
    // For undefined or null values
    if (proposalType === undefined || proposalType === null) {
      return "Unknown";
    }
    
    // Handle different input types for backward compatibility
    const typeValue = typeof proposalType === 'string' 
      ? proposalType.toLowerCase() 
      : typeof proposalType === 'number' 
        ? proposalType 
        : -1;

    // Handle numeric/enum types
    if (typeof typeValue === 'number') {
      switch (typeValue) {
        case 0:
        case ProposalType.Investment:
          return "Invest";
        case 1:
        case ProposalType.Divestment:
          return "Divest";
        case 2:
        case ProposalType.ParameterChange:
          return "Parameter Change";
        default:
          return "Other";
      }
    }
    
    // Handle string types for backward compatibility
    if (typeValue === 'investment' || typeValue === 'invest' || typeValue === '0') {
      return "Invest";
    } else if (typeValue === 'divestment' || typeValue === 'divest' || typeValue === '1') {
      return "Divest";
    } else if (typeValue === 'parameterchange' || typeValue === 'parameter' || typeValue === '2') {
      return "Parameter Change";
    }
    
    return "Other";
  };

  // Handle both string and enum-based types for badge variants
  const getProposalTypeBadgeVariant = (type: ProposalType | string | number) => {
    // Handle numeric/enum types
    if (typeof type === 'number') {
      switch (type) {
        case ProposalType.Investment:
          return 'default';
        case ProposalType.Divestment:
          return 'destructive';
        case ProposalType.ParameterChange:
          return 'secondary';
        default:
          return 'secondary';
      }
    }
    
    // Handle string types for backward compatibility
    const typeStr = String(type).toLowerCase();
    if (typeStr === 'invest' || typeStr === 'investment' || typeStr === '0') {
      return 'default';
    } else if (typeStr === 'divest' || typeStr === 'divestment' || typeStr === '1') {
      return 'destructive';
    } else if (typeStr === 'parameterchange' || typeStr === 'parameter' || typeStr === '2') {
      return 'secondary';
    }
    
    return 'secondary';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title=""
          description=""
        >
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </PageHeader>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
            <Skeleton className="h-4 w-[200px]" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-[50px]" />
                  <Skeleton className="h-6 w-[100px] mt-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Proposal Not Found"
          description="The proposal you're looking for doesn't exist or has been removed."
          actions={
            <Button variant="outline" onClick={() => setLocation('/asset-dao')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Proposals
            </Button>
          }
        />
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            We couldn't find a proposal with ID {id}. Please check the ID and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isActive = proposal.status === 'active';
  const isPassed = proposal.status === 'passed';
  const forPercentage = Math.round((proposal.forVotes / (proposal.forVotes + proposal.againstVotes || 1)) * 100);
  const againstPercentage = Math.round((proposal.againstVotes / (proposal.forVotes + proposal.againstVotes || 1)) * 100);

  return (
    <div className="space-y-6">
      <PageHeader
        title={proposal.title || ""}
        description={`Proposal #${proposal.id} | Created by ${shortenAddress(proposal.proposer)}`}
        actions={
          <Link href="/asset-dao">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Proposals
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge variant={getProposalTypeBadgeVariant(proposal.type)}>
          {getProposalTypeDisplay(proposal.type)}
        </Badge>
        <Badge variant={getStatusBadgeVariant(proposal.status)}>
          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Proposal Details</CardTitle>
          <CardDescription>
            Created on {formatDate(proposal.createdAt)} by {shortenAddress(proposal.proposer)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p>{proposal.description}</p>
          
          <div className="flex items-center gap-2 mt-2">
            <p className="text-sm text-muted-foreground">Proposer:</p>
            <p className="text-sm font-medium">{shortenAddress(proposal.proposer)}</p>
            <button 
              onClick={() => {
                copyToClipboard(proposal.proposer);
                toast.success('Address copied to clipboard!');
              }}
              className="text-primary hover:text-primary/80 transition-colors"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b">
            <div>
              <p className="text-xs text-muted-foreground">Asset</p>
              <p className="font-medium">{TokenSymbolResolver.getSymbol(proposal.token)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-medium">${proposal.amount.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {isActive ? 'Ends in' : 'Ended on'}
              </p>
              <p className="font-medium">
                {isActive ? timeRemaining(proposal.endTime) : formatDate(proposal.endTime)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{proposal.status}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Voting Results</h3>
            <div className="flex justify-between mb-2">
              <span className="text-sm">For: {forPercentage}% ({proposal.forVotes.toLocaleString()})</span>
              <span className="text-sm">Against: {againstPercentage}% ({proposal.againstVotes.toLocaleString()})</span>
            </div>
            <div className="relative w-full h-4 bg-muted rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-primary" 
                style={{ width: `${forPercentage}%` }} 
              />
            </div>
          </div>

          {hasVoted && (
            <Alert>
              {isVoteFor ? (
                <CheckCircle className="h-4 w-4 text-primary" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive" />
              )}
              <AlertTitle>You've voted on this proposal</AlertTitle>
              <AlertDescription>
                You voted {isVoteFor ? 'FOR' : 'AGAINST'} this proposal.
              </AlertDescription>
            </Alert>
          )}

          {isActive && !hasVoted && (
            <Alert>
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Voting is open</AlertTitle>
              <AlertDescription>
                Cast your vote on this proposal. Voting power is determined by your token holdings.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {isActive && !hasVoted && (
            <div className="flex gap-2 w-full justify-end">
              <Button 
                variant="destructive" 
                onClick={() => handleVote(false)}
                disabled={isVoting || !isConnected}
              >
                {isVoting ? 'Voting...' : 'Vote No'}
              </Button>
              <Button 
                onClick={() => handleVote(true)}
                disabled={isVoting || !isConnected}
              >
                {isVoting ? 'Voting...' : 'Vote Yes'}
              </Button>
            </div>
          )}

          {isPassed && !proposal.executed && (
            <div className="w-full flex justify-end">
              <Button 
                onClick={handleExecute}
                disabled={isExecuting || !isConnected}
              >
                {isExecuting ? 'Executing...' : 'Execute Proposal'}
              </Button>
            </div>
          )}

          {proposal.executed && (
            <div className="w-full flex justify-end">
              <Button disabled variant="outline">
                <Check className="mr-2 h-4 w-4" />
                Executed
              </Button>
            </div>
          )}

          {proposal.status === 'failed' && (
            <div className="w-full flex justify-end">
              <Button disabled variant="outline" className="text-destructive">
                <X className="mr-2 h-4 w-4" />
                Failed
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
