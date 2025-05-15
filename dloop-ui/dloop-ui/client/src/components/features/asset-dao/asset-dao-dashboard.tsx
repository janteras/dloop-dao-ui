import React, { useState } from "react";
import { useProposals } from "@/hooks/useProposals";
import { useWallet } from "@/hooks/useWallet";
import { useAssetDAOInfo } from "@/hooks/useAssetDAOInfo";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RageQuitButton } from "./rage-quit";
import { ParameterChangeProposalDialog } from "./parameter-change-proposal";
import { CreateProposalModal } from "./create-proposal-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SkeletonCard } from "@/components/ui/skeleton";
import { Loader2, AlertCircle, CheckCircle, Clock, X, ThumbsUp, ThumbsDown } from "lucide-react";
import { ProposalType } from "@/services/assetDaoService";
import { shortenAddress, formatNumber, formatTimeAgo } from "@/lib/utils";

export function AssetDAODashboard() {
  const { proposals, isLoading, error, voteOnProposal, executeProposal, cancelProposal } = useProposals();
  const { isConnected, address } = useWallet();
  const { proposalCount, governanceTokenAddress, isLoading: isLoadingInfo } = useAssetDAOInfo();
  const [isCreateProposalOpen, setIsCreateProposalOpen] = useState(false);
  const [isParameterChangeOpen, setIsParameterChangeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Filter proposals based on active tab
  const filteredProposals = proposals?.filter(proposal => {
    if (activeTab === "all") return true;
    if (activeTab === "active") return !proposal.executed && !proposal.canceled && new Date(proposal.endTime) > new Date();
    if (activeTab === "pending") return !proposal.executed && !proposal.canceled && new Date(proposal.endTime) > new Date();
    if (activeTab === "executed") return proposal.executed;
    if (activeTab === "canceled") return proposal.canceled;
    if (activeTab === "my") return proposal.proposer === address;
    return true;
  });

  // Function to handle voting on proposals
  const handleVote = async (proposalId: number, support: boolean) => {
    try {
      await voteOnProposal({ proposalId, support });
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  // Function to handle executing proposals
  const handleExecute = async (proposalId: number) => {
    try {
      await executeProposal(proposalId);
    } catch (error) {
      console.error("Error executing proposal:", error);
    }
  };

  // Function to handle canceling proposals
  const handleCancel = async (proposalId: number) => {
    try {
      await cancelProposal(proposalId);
    } catch (error) {
      console.error("Error canceling proposal:", error);
    }
  };

  // Function to determine if current time is past the voting end time
  const isPastVotingEndTime = (endTime: number) => {
    return new Date(endTime).getTime() < Date.now();
  };

  // Get status badge for proposal
  const getStatusBadge = (proposal: any) => {
    if (proposal.executed) {
      return <Badge className="bg-green-500">Executed</Badge>;
    } else if (proposal.canceled) {
      return <Badge className="bg-red-500">Canceled</Badge>;
    } else if (isPastVotingEndTime(proposal.endTime)) {
      return proposal.forVotes > proposal.againstVotes ? 
        <Badge className="bg-blue-500">Succeeded</Badge> : 
        <Badge className="bg-orange-500">Defeated</Badge>;
    } else {
      return <Badge className="bg-yellow-500">Active</Badge>;
    }
  };

  // Get proposal type badge
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'invest':
        return <Badge className="bg-green-700">Investment</Badge>;
      case 'divest':
        return <Badge className="bg-orange-700">Divestment</Badge>;
      case 'parameter-change':
        return <Badge className="bg-purple-700">Parameter Change</Badge>;
      default:
        return <Badge>Other</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">AssetDAO Governance</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isLoadingInfo ? (
              <span>Loading DAO information...</span>
            ) : (
              <span>
                {proposalCount !== null ? `${proposalCount} Proposals` : "Proposal count unavailable"} 
                {governanceTokenAddress && ` • Governance Token: ${shortenAddress(governanceTokenAddress)}`}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
          <Button 
            onClick={() => setIsCreateProposalOpen(true)}
            disabled={!isConnected}
          >
            New Investment/Divestment
          </Button>
          <Button 
            onClick={() => setIsParameterChangeOpen(true)}
            disabled={!isConnected}
            variant="outline"
          >
            New Parameter Change
          </Button>
          <RageQuitButton />
        </div>
      </div>
      
      <Tabs defaultValue="all" onChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Proposals</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="executed">Executed</TabsTrigger>
          <TabsTrigger value="canceled">Canceled</TabsTrigger>
          {isConnected && <TabsTrigger value="my">My Proposals</TabsTrigger>}
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          {isLoading && (
            <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map(i => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to load proposals: {String(error)}</AlertDescription>
            </Alert>
          )}
          
          {!isLoading && !error && filteredProposals?.length === 0 && (
            <Alert>
              <AlertTitle>No proposals found</AlertTitle>
              <AlertDescription>
                {activeTab === "my" && isConnected
                  ? "You haven't created any proposals yet."
                  : `No ${activeTab} proposals available.`}
              </AlertDescription>
            </Alert>
          )}
          
          {!isLoading && !error && filteredProposals && filteredProposals.length > 0 && (
            <div className="grid grid-cols-1 gap-4">
              {filteredProposals.map(proposal => (
                <Card key={proposal.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {getStatusBadge(proposal)}
                          {getTypeBadge(proposal.type)}
                          {address === proposal.proposer && (
                            <Badge variant="outline">Your Proposal</Badge>
                          )}
                        </div>
                        <CardTitle>{proposal.title}</CardTitle>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {proposal.id} • {formatTimeAgo(proposal.createdAt)}
                      </div>
                    </div>
                    <CardDescription>
                      Proposer: {shortenAddress(proposal.proposer)}
                      {proposal.token && ` • Token: ${shortenAddress(proposal.token)}`}
                      {proposal.amount && ` • Amount: ${formatNumber(proposal.amount)}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">
                      {proposal.description?.split("\n\n")[1] || proposal.description || "No description provided."}
                    </p>
                    
                    <div className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
                      <div className="flex justify-between mb-2">
                        <div>
                          <ThumbsUp className="inline-block mr-1 h-4 w-4" />
                          For: {formatNumber(proposal.forVotes)}
                        </div>
                        <div>
                          <ThumbsDown className="inline-block mr-1 h-4 w-4" />
                          Against: {formatNumber(proposal.againstVotes)}
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-green-500 h-full" 
                          style={{ 
                            width: `${proposal.forVotes + proposal.againstVotes > 0 ? 
                              (proposal.forVotes / (proposal.forVotes + proposal.againstVotes)) * 100 : 0}%` 
                          }} 
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="flex flex-wrap gap-2 justify-between w-full">
                      <div className="flex gap-2">
                        {!proposal.executed && !proposal.canceled && !isPastVotingEndTime(proposal.endTime) && isConnected && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                              onClick={() => handleVote(proposal.id, true)}
                            >
                              <ThumbsUp className="mr-1 h-4 w-4" />
                              Vote For
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                              onClick={() => handleVote(proposal.id, false)}
                            >
                              <ThumbsDown className="mr-1 h-4 w-4" />
                              Vote Against
                            </Button>
                          </>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        {isPastVotingEndTime(proposal.endTime) && !proposal.executed && !proposal.canceled && 
                          proposal.forVotes > proposal.againstVotes && isConnected && (
                          <Button 
                            size="sm" 
                            onClick={() => handleExecute(proposal.id)}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" />
                            Execute
                          </Button>
                        )}
                        
                        {!proposal.executed && !proposal.canceled && 
                          (proposal.proposer === address || isPastVotingEndTime(proposal.endTime)) && isConnected && (
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            onClick={() => handleCancel(proposal.id)}
                          >
                            <X className="mr-1 h-4 w-4" />
                            Cancel
                          </Button>
                        )}
                        
                        {!proposal.executed && !proposal.canceled && !isPastVotingEndTime(proposal.endTime) && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                            <Clock className="mr-1 h-4 w-4" />
                            Ends: {proposal.endsIn}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Modals */}
      <CreateProposalModal 
        isOpen={isCreateProposalOpen} 
        onClose={() => setIsCreateProposalOpen(false)} 
      />
      
      <ParameterChangeProposalDialog 
        isOpen={isParameterChangeOpen} 
        onClose={() => setIsParameterChangeOpen(false)} 
      />
    </div>
  );
}
