'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DelegateTokensModal } from './delegate-tokens-modal';
import { UndelegateTokensModal } from './undelegate-tokens-modal';
import { shortenAddress, formatDate } from '@/lib/utils';
import { UserIcon, ChevronDown, ArrowUpRight, Activity, TrendingUp, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDelegations } from '@/hooks/useDelegations';
import { useEthers } from '@/contexts/EthersContext';
import { useQuery } from '@tanstack/react-query';
import { useTokenInfo } from '@/hooks/useTokenInfo';
import { useAINodes } from '@/hooks/useAINodes'; // Import the useAINodes hook

interface Delegation {
  id: string;
  to: string;
  toName?: string;
  toType: 'Human' | 'AI Node';
  amount: number;
  date: number;
}

interface AINode {
  id: string;
  name: string;
  address: string;
  strategy: string;
  accuracy: number;
  performance: number;
  delegatedAmount: number;
  soulboundTokenId?: number; // Add NFT ID
  tokenData?: any; // Add NFT data
}

export function Delegations() {
  const { isConnected, address } = useWallet();
  const { toast } = useToast();
  const [selectedNode, setSelectedNode] = useState<AINode | null>(null);
  const [selectedDelegation, setSelectedDelegation] = useState<Delegation | null>(null);
  const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false);
  const [isUndelegateModalOpen, setIsUndelegateModalOpen] = useState(false);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);

  // Use on-chain delegation events
  const { data: userDelegations = [], isLoading: isDelegationsLoading, refetch: refetchDelegations } = useDelegations();

  // Sorting & filtering state for delegations table
  const [filterType, setFilterType] = useState<'All'|'Human'|'AI Node'>('All');
  const [sortField, setSortField] = useState<'date'|'amount'|'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');
  const filteredDelegations = userDelegations.filter(d => filterType === 'All' || d.toType === filterType);
  const sortedDelegations = [...filteredDelegations].sort((a, b) => {
    let aValue: any, bValue: any;
    if (sortField === 'date') { aValue = a.date; bValue = b.date; }
    else if (sortField === 'amount') { aValue = a.amount; bValue = b.amount; }
    else { aValue = a.toType; bValue = b.toType; }
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  const delegationsToShow = sortedDelegations;
  const handleSort = (field: 'date'|'amount'|'type') => {
    if (field === sortField) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('desc'); }
  };

  // Fetch AI nodes with the same hook used in the /ai-nodes view
  const { nodes, isLoading: isNodesLoading, error: aiNodesError } = useAINodes();
  
  // Fetch real on-chain token info
  const {
    availableBalance,
    delegatedAmount,
    totalVotingPower,
    isLoading: isTokenInfoLoading,
    refetch: refetchTokenInfo
  } = useTokenInfo();

  const handleDelegateClick = (node: AINode) => {
    setSelectedNode(node);
    setIsDelegateModalOpen(true);
  };

  const handleUndelegateClick = (delegation: Delegation) => {
    setSelectedDelegation(delegation);
    setIsUndelegateModalOpen(true);
  };

  const toggleNodeDetails = (index: number) => {
    if (selectedNodeIndex === index) {
      setSelectedNodeIndex(null);
    } else {
      setSelectedNodeIndex(index);
    }
  };

  const isLoading = isDelegationsLoading || isNodesLoading || isTokenInfoLoading;
  const availableAINodes = nodes || [];
  
  // Debug logging for AI nodes in delegations view
  useEffect(() => {
    console.log('Delegations view: AI nodes loaded:', availableAINodes);
    if (aiNodesError) {
      console.error('Delegations view: AI nodes error:', aiNodesError);
    }
  }, [availableAINodes, aiNodesError]);
  
  // Parse string values to numbers for display
  const userBalance = parseFloat(availableBalance);
  const userDelegatedBalance = parseFloat(delegatedAmount);
  const userTotalVotingPower = parseFloat(totalVotingPower);

  // Animation variants for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="space-y-8">
      <motion.div 
        className="grid gap-4 md:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-t-4 border-t-blue-500 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Available DLOOP</CardTitle>
                <ShieldCheck className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Available for delegation</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-t-4 border-t-purple-500 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Delegated DLOOP</CardTitle>
                <Activity className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userDelegatedBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Currently delegated to others</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-t-4 border-t-green-500 transition-all duration-200 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Voting Power</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userTotalVotingPower.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Your influence in the DAO</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* My Delegations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold mb-4">My Delegations</h2>
        {isDelegationsLoading ? (
          <Card>
            <CardContent className="py-6 flex justify-center">
              <motion.div
                animate={{ 
                  rotate: 360,
                }} 
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Activity className="h-6 w-6 text-muted-foreground" />
              </motion.div>
            </CardContent>
          </Card>
        ) : delegationsToShow.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring" }}
          >
            <Card className="border border-dashed">
              <CardContent className="py-8">
                <div className="text-center space-y-3">
                  <motion.div
                    className="mx-auto bg-muted rounded-full w-12 h-12 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <ArrowUpRight className="h-6 w-6 text-muted-foreground" />
                  </motion.div>
                  <p className="text-center text-muted-foreground">
                    You haven't delegated any DLOOP tokens yet.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!isConnected || userBalance <= 0}
                    onClick={() => document.getElementById('ai-nodes-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="mt-2"
                  >
                    Explore Delegation Options
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <table className="w-full table-auto">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">Delegatee</th>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {delegationsToShow.map((delegation) => (
                  <tr key={delegation.id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">{delegation.toName || shortenAddress(delegation.to)}</td>
                    <td className="border px-4 py-2">
                      {(() => {
                        const dt = new Date(delegation.date);
                        return !isNaN(dt.getTime())
                          ? formatDate(delegation.date)
                          : '—';
                      })()}
                    </td>
                    <td className="border px-4 py-2">{delegation.amount.toLocaleString()} DLOOP</td>
                    <td className="border px-4 py-2">{delegation.toType}</td>
                    <td className="border px-4 py-2">
                      <Button variant="outline" size="sm" disabled={!isConnected} onClick={() => handleUndelegateClick(delegation)}>
                        Undelegate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </motion.div>

      {/* Available AI Nodes - Updated to use the same approach as in ai-nodes view */}
      <motion.div
        id="ai-nodes-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-xl font-semibold mb-4">Available AI Nodes</h2>
        {isLoading ? (
          <Card>
            <CardContent className="py-6 flex justify-center">
              <motion.div
                animate={{ 
                  rotate: 360,
                }} 
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                <Activity className="h-6 w-6 text-muted-foreground" />
              </motion.div>
            </CardContent>
          </Card>
        ) : availableAINodes.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring" }}
          >
            <Card className="border border-dashed">
              <CardContent className="py-8">
                <div className="text-center space-y-3">
                  <motion.div
                    className="mx-auto bg-muted rounded-full w-12 h-12 flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    <Activity className="h-6 w-6 text-muted-foreground" />
                  </motion.div>
                  <p className="text-center text-muted-foreground">
                    No AI nodes are currently available for delegation.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableAINodes.map((node, index) => (
                <Card key={node.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CardTitle className="text-base font-medium">{node.name}</CardTitle>
                        {node.soulboundTokenId && (
                          <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                            NFT #{node.soulboundTokenId}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription>{node.strategy}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Accuracy</span>
                        <span className="font-medium">{node.accuracy}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Performance</span>
                        <span className="font-medium">+{node.performance}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delegated</span>
                        <span className="font-medium">{node.delegatedAmount.toLocaleString()} DLOOP</span>
                      </div>
                    </div>
                    
                    {/* Expandable section */}
                    <div className="mt-4">
                      <button 
                        onClick={() => toggleNodeDetails(index)}
                        className="flex items-center text-sm text-primary w-full justify-between"
                      >
                        <span>Node Details</span>
                        <ChevronDown 
                          className={`h-4 w-4 transition-transform ${selectedNodeIndex === index ? 'rotate-180' : ''}`} 
                        />
                      </button>
                      
                      {selectedNodeIndex === index && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 text-sm space-y-2"
                        >
                          <div>
                            <span className="text-muted-foreground">Address:</span>
                            <div className="font-mono text-xs mt-1">{node.address}</div>
                          </div>
                          
                          {node.tokenData && node.tokenData.metadata && (
                            <div>
                              <span className="text-muted-foreground">Description:</span>
                              <div className="mt-1">{node.tokenData.metadata.description || "No description available"}</div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      disabled={!isConnected} 
                      onClick={() => handleDelegateClick(node)}
                    >
                      Delegate Tokens
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
      </motion.div>

      {/* Modals */}
      {isDelegateModalOpen && selectedNode && (
        <DelegateTokensModal
          node={selectedNode}
          isOpen={isDelegateModalOpen}
          onClose={() => setIsDelegateModalOpen(false)}
          onSuccess={() => {
            setIsDelegateModalOpen(false);
            refetchDelegations();
            refetchTokenInfo();
          }}
        />
      )}
      
      {isUndelegateModalOpen && selectedDelegation && (
        <UndelegateTokensModal
          delegation={selectedDelegation}
          isOpen={isUndelegateModalOpen}
          onClose={() => setIsUndelegateModalOpen(false)}
          onSuccess={() => {
            setIsUndelegateModalOpen(false);
            refetchDelegations();
            refetchTokenInfo();
          }}
        />
      )}
    </div>
  );
}
