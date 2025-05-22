/**
 * Wagmi Integration Demo Page
 * 
 * This page demonstrates the usage of wagmi hooks for blockchain interactions
 * and showcases our unified component architecture that supports both
 * Ethers.js and Wagmi implementations side-by-side.
 */

import React, { useState } from 'react';
import { useProposals, useVoteOnProposal } from '@/hooks/useAssetDaoContract';
import { useTokenInfo, useTokenBalance } from '@/hooks/useTokenContract';
import { useWallet } from '@/components/features/wallet/wagmi-provider';
import { useAppConfig } from '@/config/app-config';
import { Web3Button } from '@/components/web3/unified/Web3Button';
import { TokenDisplay } from '@/components/web3/unified/tokens/TokenDisplay';
import { UnifiedProposalCard, ProposalCardSkeleton } from '@/components/web3/unified/proposals/UnifiedProposalCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { Switch } from '@/components/ui/switch';
import { Proposal, ProposalStatus } from '@/types';
// Simple card component implementation for the demo with proper TypeScript support
type CardProps = {
  children: React.ReactNode;
  className?: string;
};

const Card = ({ children, className = '' }: CardProps) => <div className={`bg-white rounded-lg shadow ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: CardProps) => <div className={`p-4 border-b ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }: CardProps) => <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>;
const CardContent = ({ children, className = '' }: CardProps) => <div className={`p-4 ${className}`}>{children}</div>;
const CardFooter = ({ children, className = '' }: CardProps) => <div className={`p-4 border-t ${className}`}>{children}</div>;

// Import available components
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Simple spinner implementation for the demo with TypeScript support
type SpinnerProps = {
  className?: string;
};

const Spinner = ({ className = '' }: SpinnerProps) => (
  <div className={`animate-spin h-5 w-5 border-2 border-gray-300 rounded-full border-t-blue-600 ${className}`}></div>
);

// Simple badge implementation for the demo with TypeScript support
type BadgeVariant = 'default' | 'success' | 'destructive' | 'outline';

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    destructive: 'bg-red-100 text-red-800',
    outline: 'border border-gray-300 text-gray-800',
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default function WagmiDemoPage() {
  // Get wallet connection state from wagmi
  const { address, isConnected, connect, balance, chainId, isNetworkSupported } = useWallet();

  // Known token addresses on Sepolia
  const tokenAddress = '0xd093d7331448766923fe7ab270a9f6bce63cefda'; // Example token on Sepolia
  
  // Get proposal data using wagmi hooks
  const { proposals, isLoading: proposalsLoading, error: proposalsError } = useProposals({ limit: 5 });
  
  // Get token info using wagmi hooks
  const { symbol, name, decimals, isLoading: tokenInfoLoading } = useTokenInfo(tokenAddress);
  
  // Get token balance using wagmi hooks
  const { balance: tokenBalance, isLoading: balanceLoading } = useTokenBalance(
    tokenAddress, 
    address as `0x${string}` | undefined
  );
  
  // Voting functionality
  const { castVote, isPending: isVoting } = useVoteOnProposal();
  
  const handleVote = async (proposalId: number, support: boolean) => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }
    
    try {
      await castVote(proposalId, support);
      alert(`Vote cast successfully! ${support ? 'Supported' : 'Opposed'} proposal ${proposalId}`);
    } catch (error) {
      console.error('Error voting:', error);
      if (error instanceof Error && error.message.includes('network')) {
        alert(`Network Error: ${error.message}`);
      } else {
        alert('Failed to vote. See console for details.');
      }
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Wagmi Integration Demo</h1>
      
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">Implementation Toggle</h2>
          <p className="text-gray-500">Switch between Ethers.js and Wagmi implementations to see the components in action</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${!useAppConfig.getState().useWagmi ? 'font-bold' : ''}`}>Ethers</span>
          <Switch 
            checked={useAppConfig.getState().useWagmi} 
            onCheckedChange={useAppConfig.getState().setUseWagmi}
          />
          <span className={`text-sm ${useAppConfig.getState().useWagmi ? 'font-bold' : ''}`}>Wagmi</span>
        </div>
      </div>
      
      {/* Wallet Connection Section */}
      <Tabs defaultValue="side-by-side" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
          <TabsTrigger value="unified">Unified Component</TabsTrigger>
        </TabsList>
        
        <TabsContent value="side-by-side" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ethers Implementation */}
            <Card className="border-blue-900/30">
              <CardHeader>
                <Badge variant="outline" className="bg-blue-900/20 text-blue-500 mb-2">Ethers Implementation</Badge>
                <CardTitle>Wallet Connection</CardTitle>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                  <div className="space-y-2">
                    <p><strong>Address:</strong> {address}</p>
                    <p><strong>Chain ID:</strong> {chainId}</p>
                    <p><strong>Network:</strong> {isNetworkSupported ? 'Supported' : 'Not Supported'}</p>
                    <p><strong>ETH Balance:</strong> {balance}</p>
                  </div>
                ) : (
                  <p>Wallet not connected</p>
                )}
              </CardContent>
              <CardFooter>
                {isConnected ? (
                  <Button variant="outline" onClick={() => window.location.reload()}>Refresh Data</Button>
                ) : (
                  <Button onClick={connect}>Connect Wallet</Button>
                )}
              </CardFooter>
            </Card>
            
            {/* Wagmi Implementation */}
            <Card className="border-purple-900/30">
              <CardHeader>
                <Badge variant="outline" className="bg-purple-900/20 text-purple-500 mb-2">Wagmi Implementation</Badge>
                <CardTitle>Wallet Connection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                  <Web3Button 
                    showBalance={true} 
                    showNetwork={true}
                    showFullAddress={true}
                    size="md"
                    useWagmi={true}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <p className="text-sm text-gray-500">Wallet controls integrated into the button component</p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="unified">
          <Card>
            <CardHeader>
              <CardTitle>Unified Web3Button Component</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <Web3Button 
                  showBalance={true} 
                  showNetwork={true}
                  showFullAddress={false}
                  size="md"
                  customActions={[
                    {
                      label: "View on Etherscan",
                      onClick: () => window.open(`https://sepolia.etherscan.io/address/${useUnifiedWallet().address}`)
                    },
                    {
                      label: "Copy Address",
                      onClick: () => {
                        navigator.clipboard.writeText(useUnifiedWallet().address || '');
                        alert("Address copied to clipboard!");
                      }
                    }
                  ]}
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  This component seamlessly switches between Ethers and Wagmi implementations based on the toggle above
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Token Information Section */}
      <Tabs defaultValue="side-by-side" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
          <TabsTrigger value="unified">Unified Component</TabsTrigger>
        </TabsList>
        
        <TabsContent value="side-by-side" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ethers Implementation */}
            <Card className="border-blue-900/30">
              <CardHeader>
                <Badge variant="outline" className="bg-blue-900/20 text-blue-500 mb-2">Ethers Implementation</Badge>
                <CardTitle>Token Information</CardTitle>
              </CardHeader>
              <CardContent>
                {tokenInfoLoading ? (
                  <div className="flex justify-center py-4"><Spinner /></div>
                ) : (
                  <div className="space-y-2">
                    <p><strong>Token Address:</strong> {tokenAddress}</p>
                    <p><strong>Name:</strong> {name || 'Unknown'}</p>
                    <p><strong>Symbol:</strong> {symbol || 'Unknown'}</p>
                    <p><strong>Decimals:</strong> {decimals}</p>
                    {isConnected && (
                      <p><strong>Your Balance:</strong> {balanceLoading ? <Spinner className="h-4 w-4 inline" /> : tokenBalance}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Wagmi Implementation */}
            <Card className="border-purple-900/30">
              <CardHeader>
                <Badge variant="outline" className="bg-purple-900/20 text-purple-500 mb-2">Wagmi Implementation</Badge>
                <CardTitle>Token Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-4">
                  <TokenDisplay 
                    tokenAddress={tokenAddress}
                    amount="10000000000000000000" // Example: 10 tokens with 18 decimals
                    showIcon={true}
                    showSymbol={true}
                    showName={true}
                    clickableAddress={true}
                    size="lg"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="unified">
          <Card>
            <CardHeader>
              <CardTitle>Unified TokenDisplay Component</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6">
                <TokenDisplay 
                  tokenAddress={tokenAddress}
                  amount="10000000000000000000" // Example: 10 tokens with 18 decimals
                  showIcon={true}
                  showSymbol={true}
                  showName={true}
                  clickableAddress={true}
                  size="lg"
                  className="mb-4"
                />
                
                <div className="flex flex-wrap justify-center gap-4 mt-6">
                  <TokenDisplay 
                    tokenAddress={tokenAddress}
                    amount="123456789000000000000" 
                    showIcon={true}
                    showSymbol={true}
                    size="sm"
                  />
                  
                  <TokenDisplay 
                    tokenAddress={tokenAddress}
                    amount="5000000000000000000" 
                    showIcon={true}
                    showSymbol={true}
                    size="md"
                  />
                  
                  <TokenDisplay 
                    tokenAddress={tokenAddress}
                    showIcon={true}
                    showSymbol={true}
                    showName={true}
                    size="md"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Proposals Section */}
      <Tabs defaultValue="side-by-side" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
          <TabsTrigger value="unified">Unified Component</TabsTrigger>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="side-by-side">
          <Card>
            <CardHeader>
              <CardTitle>Latest Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              {proposalsLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : proposalsError ? (
                <div className="text-red-500">Error loading proposals: {typeof proposalsError === 'string' ? proposalsError : String(proposalsError)}</div>
              ) : proposals.length === 0 ? (
                <div className="text-center py-4">No proposals found</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proposals.map(proposal => (
                      <TableRow key={proposal.id}>
                        <TableCell>{proposal.id}</TableCell>
                        <TableCell className="max-w-xs truncate">{proposal.description}</TableCell>
                        <TableCell>
                          <Badge variant={
                            proposal.executed ? 'outline' :
                            proposal.canceled ? 'destructive' :
                            (proposal.forVotes > proposal.againstVotes) ? 'success' : 'default'
                          }>
                            {proposal.executed ? 'Executed' :
                             proposal.canceled ? 'Canceled' :
                             (proposal.forVotes > proposal.againstVotes) ? 'Passed' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {proposal.proposalType === 0 ? 'Investment' : 
                           proposal.proposalType === 1 ? 'Divestment' : 
                           proposal.proposalType === 2 ? 'Parameter Change' : 'Other'}
                        </TableCell>
                        <TableCell>
                          {!proposal.executed && !proposal.canceled && isConnected && (
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleVote(proposal.id, true)}
                                disabled={isVoting}
                              >
                                For
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleVote(proposal.id, false)}
                                disabled={isVoting}
                              >
                                Against
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="unified">
          {proposalsLoading ? (
            <div className="space-y-4">
              <ProposalCardSkeleton />
              <ProposalCardSkeleton />
            </div>
          ) : proposalsError ? (
            <div className="text-red-500 p-4 border border-red-300 rounded-md">
              Error loading proposals: {typeof proposalsError === 'string' ? proposalsError : String(proposalsError)}
            </div>
          ) : proposals.length === 0 ? (
            <div className="text-center py-4 border border-gray-300 rounded-md">No proposals found</div>
          ) : (
            <div className="space-y-4">
              {proposals.slice(0, 2).map(proposal => {
                // Convert the proposal data to match our UnifiedProposalCard format
                const proposalStatus: ProposalStatus = proposal.executed ? 'executed' : 
                                                    proposal.canceled ? 'failed' : 
                                                    (proposal.forVotes > proposal.againstVotes) ? 'passed' : 'active';
                
                // Use type assertion to make TypeScript happy with our property types
                const convertedProposal: Proposal = {
                  id: proposal.id,
                  title: proposal.description.slice(0, 50) + (proposal.description.length > 50 ? '...' : ''),
                  description: proposal.description,
                  status: proposalStatus,
                  type: proposal.proposalType === 0 ? 'invest' : 'divest', // Convert number to ProposalType
                  token: tokenAddress, // Use tokenAddress instead
                  amount: Number(10000000000000000000), // Convert to number for compatibility
                  forVotes: Math.round((proposal.forVotes / (proposal.forVotes + proposal.againstVotes || 1)) * 100) || 0,
                  againstVotes: Math.round((proposal.againstVotes / (proposal.forVotes + proposal.againstVotes || 1)) * 100) || 0,
                  proposer: proposal.proposer || '0x1234...',
                  // Add missing required fields
                  createdAt: Date.now(),
                  endTime: new Date(Date.now() + 86400000).getTime(),
                  executed: proposal.executed || false,
                  canceled: proposal.canceled || false,
                  endsIn: '1 day',
                  endTimeISO: new Date(Date.now() + 86400000).toISOString(),
                };
                
                return (
                  <UnifiedProposalCard 
                    key={proposal.id}
                    proposal={convertedProposal}
                    onVote={async (id, support) => handleVote(id, support)}
                    onExecute={async () => {}}
                    expanded={true}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proposalsLoading ? (
              <>
                <ProposalCardSkeleton />
                <ProposalCardSkeleton />
                <ProposalCardSkeleton />
              </>
            ) : proposals.slice(0, 3).map(proposal => {
              // Convert the proposal data to match our UnifiedProposalCard format
              const proposalStatus: ProposalStatus = proposal.executed ? 'executed' : 
                                                   proposal.canceled ? 'failed' : 
                                                   (proposal.forVotes > proposal.againstVotes) ? 'passed' : 'active';
              
              // Use type assertion to make TypeScript happy with our property types
              const convertedProposal: Proposal = {
                id: proposal.id,
                title: proposal.description.slice(0, 50) + (proposal.description.length > 50 ? '...' : ''),
                description: proposal.description,
                status: proposalStatus,
                type: proposal.proposalType === 0 ? 'invest' : 'divest', // Convert number to ProposalType
                token: tokenAddress, // Use tokenAddress instead
                amount: Number(10000000000000000000), // Convert to number for compatibility
                forVotes: Math.round((proposal.forVotes / (proposal.forVotes + proposal.againstVotes || 1)) * 100) || 0,
                againstVotes: Math.round((proposal.againstVotes / (proposal.forVotes + proposal.againstVotes || 1)) * 100) || 0,
                proposer: proposal.proposer || '0x1234...',
                // Add missing required fields
                createdAt: Date.now(),
                endTime: new Date(Date.now() + 86400000).getTime(),
                executed: proposal.executed || false,
                canceled: proposal.canceled || false,
                endsIn: '1 day',
                endTimeISO: new Date(Date.now() + 86400000).toISOString(),
              };
              
              return (
                <UnifiedProposalCard 
                  key={proposal.id}
                  proposal={convertedProposal}
                  onVote={async (id, support) => handleVote(id, support)}
                  onExecute={async () => {}}
                />
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Technical Info Section */}
      <div className="mt-8 bg-gray-100 p-4 rounded-md">
        <h3 className="text-lg font-medium mb-2">Technical Information</h3>
        <p className="text-sm text-gray-700">
          This demo page uses the new wagmi hooks to interact with the blockchain. The implementation is completely
          separate from the existing application code and demonstrates how we can progressively migrate to wagmi
          without disrupting current functionality.
        </p>
        <div className="mt-2 text-sm text-gray-700">
          <p><strong>Key benefits demonstrated:</strong></p>
          <ul className="list-disc pl-5 mt-1">
            <li>Automatic loading and error states</li>
            <li>Declarative data fetching</li>
            <li>Simplified transaction handling</li>
            <li>Better type safety</li>
            <li>Integration with ethers.js for backward compatibility</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
