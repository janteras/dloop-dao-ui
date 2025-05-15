'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DelegateTokensModal } from './delegate-tokens-modal';
import { UndelegateTokensModal } from './undelegate-tokens-modal';
import { shortenAddress, formatDate } from '@/lib/utils';
import { UserIcon, ChevronDown, ArrowUpRight, Activity, TrendingUp, ShieldCheck, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // Use on-chain delegation events with automatic refresh
  const { data: userDelegations = [], isLoading: isDelegationsLoading, refetch: refetchDelegations } = useDelegations();

  // Add refresh flag to force component update after delegation actions
  const [refreshFlag, setRefreshFlag] = useState(0);
  
  // Sorting & filtering state for delegations table
  const [filterType, setFilterType] = useState<'All'|'Human'|'AI Node'>('All');
  const [sortField, setSortField] = useState<'date'|'amount'|'type'>('date');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');
  
  // Maintain a processed copy of delegations with AI Node information
  const [processedDelegations, setProcessedDelegations] = useState<Delegation[]>([]);
  
  // Memoize the filtering and sorting operations to prevent unnecessary recalculations
  const [showAllDelegations, setShowAllDelegations] = useState(false);
  const INITIAL_DISPLAY_COUNT = 5;

  const delegationsToShow = useMemo(() => {
    // Filter delegations by type (All, Human, or AI Node)
    const filtered = processedDelegations.filter(d => filterType === 'All' || d.toType === filterType);
    
    // Sort delegations based on user selection
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any, bValue: any;
      if (sortField === 'date') { aValue = a.date; bValue = b.date; }
      else if (sortField === 'amount') { aValue = a.amount; bValue = b.amount; }
      else { aValue = a.toType; bValue = b.toType; }
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Return all items if showAllDelegations is true, otherwise return first 5
    return showAllDelegations ? sorted : sorted.slice(0, INITIAL_DISPLAY_COUNT);
  }, [processedDelegations, filterType, sortField, sortOrder, showAllDelegations]);
  
  const handleSort = (field: 'date'|'amount'|'type') => {
    if (field === sortField) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('desc'); }
  };

  // Fetch AI nodes with the same hook used in the /ai-nodes view
  const { nodes, isLoading: isNodesLoading, error: aiNodesError } = useAINodes();
  
  // Add debug log - only log once when nodes change, not on every render
  const [hasLoggedNodes, setHasLoggedNodes] = useState(false);
  useEffect(() => {
    if (nodes && !hasLoggedNodes) {
      console.log(`Delegations view: ${nodes.length} AI nodes loaded (${nodes.length > 0 ? 'real' : 'empty'} data)`);
      setHasLoggedNodes(true);
    }
  }, [nodes, hasLoggedNodes]);

  // Fetch real on-chain token info
  const {
    availableBalance,
    delegatedAmount,
    totalVotingPower,
    isLoading: isTokenInfoLoading,
    refetch: refetchTokenInfo
  } = useTokenInfo();

  // Handle delegate button click
  const handleDelegateClick = (node: AINode) => {
    setSelectedNode(node);
    setIsDelegateModalOpen(true);
  };

  // Handle undelegate button click
  const handleUndelegateClick = (delegation: Delegation) => {
    console.log('Selected delegation for undelegation:', delegation);
    setSelectedDelegation(delegation);
    setIsUndelegateModalOpen(true);
  };
  
  // Trigger a refresh of delegation data
  const triggerDataRefresh = () => {
    console.log('Triggering data refresh...');
    setRefreshFlag(prev => prev + 1);
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
  const userBalance = availableBalance || 0;
  const userDelegated = delegatedAmount || 0;
  const userTotalVotingPower = totalVotingPower || 0;
  
  // Refresh data when address changes, component mounts, or after delegation actions
  // Using a ref to prevent multiple refreshes in the same render cycle
  const refreshingRef = useRef(false);
  const refreshCountRef = useRef(0);
  
  useEffect(() => {
    // Skip if already refreshing or if we've refreshed too many times
    if (refreshingRef.current || refreshCountRef.current > 5) return;
    
    const refreshData = async () => {
      if (isConnected && address) {
        refreshingRef.current = true;
        refreshCountRef.current++;
        console.log(`Refreshing delegations data... (attempt ${refreshCountRef.current})`);
        
        try {
          await refetchDelegations();
          console.log('Delegations data refreshed successfully');
          await refetchTokenInfo();
          console.log('Token info refreshed successfully');
        } catch (error) {
          console.error('Error refreshing data:', error);
        } finally {
          refreshingRef.current = false;
        }
      }
    };
    
    refreshData();
  }, [isConnected, address, refreshFlag]);
  
  // Reset refresh counter when address changes
  useEffect(() => {
    refreshCountRef.current = 0;
  }, [address]);

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

  // Note: processedDelegations state is now defined above
  
  // Use a stable comparison to detect real data changes in dependencies
  const nodeAddresses = useMemo(() => {
    return nodes?.map(node => node.address)?.join(',') || '';
  }, [nodes]);
  
  const delegationIds = useMemo(() => {
    return userDelegations?.map(del => del.id)?.join(',') || '';
  }, [userDelegations]);
  
  // Process delegations with AI Node information
  useEffect(() => {
    // Skip processing if no data is available
    if (!userDelegations.length) {
      setProcessedDelegations([]);
      return;
    }
    
    // Process delegations to identify AI Nodes vs Humans
    let processedData;
    if (nodes && nodes.length > 0) {
      // Identify AI Nodes
      processedData = userDelegations.map(delegation => {
        const matchingNode = nodes.find(node => 
          node.address?.toLowerCase() === delegation.to?.toLowerCase()
        );
        
        if (matchingNode) {
          return {
            ...delegation,
            toName: matchingNode.name,
            toType: 'AI Node' as 'AI Node'
          };
        }
        return delegation;
      });
      
      console.log(`Updated delegations with AI node information: ${processedData.length}`);
    } else {
      // Use delegations as-is if no AI node data is available
      processedData = [...userDelegations];
    }
    
    setProcessedDelegations(processedData);
  }, [nodeAddresses, delegationIds]);

  return (
    <div className="space-y-6 max-w-[100vw] px-4 md:px-6">
      <motion.div 
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="overflow-hidden border-t-4 border-t-blue-500 transition-all duration-200 hover:shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Available DLOOP</CardTitle>
                <ShieldCheck className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{userBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Available for delegation</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="overflow-hidden border-t-4 border-t-purple-500 transition-all duration-200 hover:shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Delegated DLOOP</CardTitle>
                <Activity className="h-4 w-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{userDelegated.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Currently delegated to others</p>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card className="overflow-hidden border-t-4 border-t-green-500 transition-all duration-200 hover:shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Total Voting Power</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl md:text-2xl font-bold">{userTotalVotingPower.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <p className="text-xs text-muted-foreground">Your influence in the DAO</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* My Delegations Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-x-auto"
      >
        <h2 className="text-xl font-semibold mb-4">My Delegations</h2>

        {/* Mobile-optimized table */}
        <div className="md:hidden">
          {delegationsToShow.map((delegation) => (
            <motion.div
              key={delegation.id}
              className="mb-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${delegation.toType === 'AI Node' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-800'}`}>
                      {delegation.toType === 'AI Node' ? (
                        <Brain className="h-4 w-4" />
                      ) : (
                        <UserIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{delegation.toName || shortenAddress(delegation.to)}</div>
                      <div className="text-xs text-muted-foreground">{delegation.toType}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Amount:</div>
                    <div className="text-right font-medium">{delegation.amount.toLocaleString()} DLOOP</div>
                    <div className="text-muted-foreground">Date:</div>
                    <div className="text-right">{formatDate(delegation.date)}</div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-4"
                    disabled={!isConnected}
                    onClick={() => handleUndelegateClick(delegation)}
                  >
                    Undelegate
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
          {processedDelegations.length > INITIAL_DISPLAY_COUNT && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 flex justify-center"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllDelegations(!showAllDelegations)}
                className="w-full sm:w-auto"
              >
                {showAllDelegations ? 'Show Less' : `Show More (${processedDelegations.length - INITIAL_DISPLAY_COUNT} more)`}
              </Button>
            </motion.div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Delegatee</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {delegationsToShow.map((delegation) => (
                  <motion.tr 
                    key={delegation.id}
                    className="hover:bg-muted/50 transition-colors"
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                  >
                    <td className="px-4 py-2 border-t border-gray-200">
                      <div className="flex items-center">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-3 ${delegation.toType === 'AI Node' ? 'bg-primary/10 text-primary' : 'bg-blue-100 text-blue-800'}`}>
                          {delegation.toType === 'AI Node' ? (
                            <Brain className="h-4 w-4" />
                          ) : (
                            <UserIcon className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">
                            {delegation.toName || shortenAddress(delegation.to)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {delegation.toType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 border-t border-gray-200">
                      {(() => {
                        const dt = new Date(delegation.date);
                        return !isNaN(dt.getTime())
                          ? formatDate(delegation.date)
                          : '—';
                      })()}
                    </td>
                    <td className="px-4 py-2 border-t border-gray-200">{delegation.amount.toLocaleString()} DLOOP</td>
                    <td className="px-4 py-2 border-t border-gray-200">{delegation.toType}</td>
                    <td className="px-4 py-2 border-t border-gray-200">
                      <Button variant="outline" size="sm" disabled={!isConnected} onClick={() => handleUndelegateClick(delegation)}>
                        Undelegate
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {processedDelegations.length > INITIAL_DISPLAY_COUNT && (
              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllDelegations(!showAllDelegations)}
                  className="w-auto"
                >
                  {showAllDelegations ? 'Show Less' : `Show More (${processedDelegations.length - INITIAL_DISPLAY_COUNT} more)`}
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Available AI Nodes Section */}
      <motion.div
        id="ai-nodes-section"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="overflow-x-auto"
      >
        <h2 className="text-xl font-semibold mb-4">Available AI Nodes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableAINodes.map((node, index) => (
            <motion.div
              key={node.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="overflow-hidden h-full flex flex-col">
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
                <CardFooter className="mt-auto">
                  <Button 
                    className="w-full" 
                    disabled={!isConnected} 
                    onClick={() => handleDelegateClick(node)}
                  >
                    Delegate Tokens
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Modals */}
      {isDelegateModalOpen && selectedNode && (
        <DelegateTokensModal
          node={selectedNode}
          isOpen={isDelegateModalOpen}
          onClose={() => setIsDelegateModalOpen(false)}
          onSuccess={() => {
            setIsDelegateModalOpen(false);
            triggerDataRefresh();
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
            triggerDataRefresh();
          }}
        />
      )}
    </div>
  );
}