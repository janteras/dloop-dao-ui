'use client';

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/common/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, AlertTriangle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { useProposals } from '@/hooks/useProposals';
import { useToast } from '@/hooks/use-toast';
import { timeRemaining, shortenAddress, formatDate } from '@/lib/utils';

interface ProposalDetailProps {
  proposalId: string;
}

export function ProposalDetail({ proposalId }: ProposalDetailProps) {
  const id = parseInt(proposalId, 10);
  const { isConnected } = useWallet();
  const { 
    proposals, 
    voteOnProposal, 
    executeProposal, 
    isVoting, 
    isExecuting,
    refetchProposals
  } = useProposals();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  // State for user votes
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoteFor, setIsVoteFor] = useState<boolean | null>(null);

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
  const proposal = proposals.find((p: any) => p.id === id);

  const handleVote = async (support: boolean) => {
    if (!isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await voteOnProposal({ proposalId: id, support });
      
      // Save vote to local storage (for demo)
      const votedProposals = JSON.parse(localStorage.getItem('votedProposals') || '{}');
      votedProposals[id] = support;
      localStorage.setItem('votedProposals', JSON.stringify(votedProposals));
      
      setHasVoted(true);
      setIsVoteFor(support);
      
      refetchProposals();
    } catch (error: any) {
      toast({
        title: 'Vote Failed',
        description: error.message || 'There was an error casting your vote. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleExecute = async () => {
    if (!isConnected) {
      toast({
        title: 'Not Connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await executeProposal(id);
      refetchProposals();
    } catch (error: any) {
      toast({
        title: 'Execution Failed',
        description: error.message || 'There was an error executing the proposal. Please try again.',
        variant: 'destructive',
      });
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

  const getProposalTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'invest':
        return 'default';
      case 'divest':
        return 'destructive';
      default:
        return 'secondary';
    }
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
        description={`Proposal #${proposal.id} | Created by ${proposal.proposer.slice(0, 8)}...`}
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
          {proposal.type.charAt(0).toUpperCase() + proposal.type.slice(1)}
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b">
            <div>
              <p className="text-xs text-muted-foreground">Asset</p>
              <p className="font-medium">{proposal.token}</p>
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
                {isVoting ? 'Voting...' : 'Vote Against'}
              </Button>
              <Button 
                onClick={() => handleVote(true)}
                disabled={isVoting || !isConnected}
              >
                {isVoting ? 'Voting...' : 'Vote For'}
              </Button>
            </div>
          )}

          {isPassed && (
            <Button 
              onClick={handleExecute}
              disabled={isExecuting || !isConnected}
              className="ml-auto"
            >
              {isExecuting ? 'Executing...' : 'Execute Proposal'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}