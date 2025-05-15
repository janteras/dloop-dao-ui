import React, { useState } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ChevronDown, 
  ArrowUp, 
  ArrowDown, 
  SlidersHorizontal,
  Brain
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import DelegateTokensModal from '@/components/modals/DelegateTokensModal';
import { useAINodes } from '@/hooks/useAINodes';
import { AINode, AINodeActivity, AINodeTradingThesis } from '@/types';

// Extend the AINode interface to include NFT properties
interface AINodeWithNFT extends AINode {
  description: string;
  soulboundTokenId?: number;
  tokenData?: any;
}

type SortKey = 'performance' | 'delegatedAmount' | 'accuracy' | 'proposalsPassed';

// Animation variants for container
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Animation variants for items
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Helper function to format numbers with commas
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export default function AINodeExplorer() {
  const [sortBy, setSortBy] = useState<SortKey>('performance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedNode, setSelectedNode] = useState<AINodeWithNFT | null>(null);
  const [showDelegateModal, setShowDelegateModal] = useState(false);
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);
  const { isConnected, address, provider } = useWallet();
  const { toast } = useToast();
  
  // Debug wallet connection
  console.log('AINodeExplorer - Wallet connection state:', { isConnected, address, hasProvider: !!provider });
  
  // Fetch AI Nodes with NFT data using our custom hook
  const { nodes, isLoading, error, refetch } = useAINodes();
  
  // Safely cast the nodes to our extended interface
  const aiNodes = (nodes || []) as AINodeWithNFT[];
  
  const sortedNodes = [...aiNodes].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a[sortBy] - b[sortBy];
    } else {
      return b[sortBy] - a[sortBy];
    }
  });
  
  const toggleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };
  
  const handleOpenDelegateModal = (node: AINodeWithNFT) => {
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to delegate tokens",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedNode(node);
    setShowDelegateModal(true);
  };

  // Toggle node details expansion
  const toggleNodeDetails = (index: number) => {
    setSelectedNodeIndex(selectedNodeIndex === index ? null : index);
  };
  
  // Function to delegate tokens to the selected node
  const delegateTokens = async (amount: number) => {
    if (!isConnected || !selectedNode) {
      toast({
        title: "Error",
        description: "Wallet not connected or no node selected",
        variant: "destructive"
      });
      return;
    }

    // Check if user has enough balance
    const tokenAmount = parseFloat(amount.toString());
    if (tokenAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: `Please enter a positive amount of DLOOP tokens`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Here we would normally call the contract to delegate tokens
      // For demonstration, we'll just show a success message
      toast({
        title: "Tokens Delegated",
        description: `Successfully delegated ${tokenAmount} DLOOP to ${selectedNode.name}`,
        variant: "default"
      });
      
      setShowDelegateModal(false);
      
      // In a real implementation, we would also refresh the node data
      setTimeout(() => {
        refetch();
      }, 1000);
    } catch (error) {
      console.error('Error delegating tokens:', error);
      toast({
        title: "Delegation Failed",
        description: "An error occurred while delegating tokens. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">AI Governance Nodes</h2>
          <p className="text-muted-foreground">Delegate DLOOP tokens to AI nodes for governance participation</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select 
            value={sortBy} 
            onValueChange={(value) => setSortBy(value as SortKey)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="delegatedAmount">Delegated Amount</SelectItem>
              <SelectItem value="accuracy">Accuracy</SelectItem>
              <SelectItem value="proposalsPassed">Proposals Passed</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-3 w-16 mb-1" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24 ml-auto" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading AI Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <p>We encountered an error loading the AI node data. Please try again later.</p>
            <Button className="mt-4" onClick={() => refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : sortedNodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No AI Nodes Available</h3>
            <p className="text-muted-foreground">There are currently no AI nodes available for delegation.</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div 
          className="grid gap-6 md:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {sortedNodes.map((node, index) => (
            <motion.div 
              key={node.id}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.01,
                transition: { duration: 0.2 }
              }}
            >
              <Card className="overflow-hidden border-l-4 border-l-purple-500 hover:shadow-md transition-all duration-200">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        {node.name}
                        {node.soulboundTokenId && (
                          <Badge variant="outline" className="ml-2 bg-primary/10 border-primary/20">
                            NFT #{node.soulboundTokenId}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{node.strategy || 'Adaptive Strategy'}</CardDescription>
                    </div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="ghost" size="sm" onClick={() => toggleNodeDetails(index)}>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            selectedNodeIndex === index ? 'rotate-180' : ''
                          }`}
                        />
                      </Button>
                    </motion.div>
                  </div>
                </CardHeader>
                
                <CardContent className="pb-2">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Performance</p>
                      <p className="font-medium text-green-600">+{node.performance.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Delegated</p>
                      <p className="font-medium">{formatNumber(node.delegatedAmount)} DLOOP</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                      <p className="font-medium">{node.accuracy}%</p>
                    </div>
                  </div>
                  
                  {selectedNodeIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t"
                    >
                      <p className="text-sm mb-2">Strategy Details:</p>
                      <p className="text-sm text-muted-foreground">
                        This AI node uses advanced algorithms to analyze market trends and make investment decisions
                        based on the {node.strategy ? node.strategy.toLowerCase() : 'adaptive'} strategy.
                      </p>
                      
                      <div className="mt-4">
                        <p className="text-sm mb-2">Recent Activity:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {node.recentActivity && node.recentActivity.slice(0, 3).map((activity, i) => (
                            <li key={i} className="flex justify-between">
                              <span>{activity.title}</span>
                              <span className="text-xs">{activity.date}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
                
                <CardFooter>
                  <div className="flex justify-between w-full">
                    <Link href={`/ai-nodes/${node.id}`}>
                      <Button variant="outline" size="sm">View Details</Button>
                    </Link>
                    <Button 
                      size="sm" 
                      onClick={() => handleOpenDelegateModal(node)}
                      disabled={!isConnected}
                    >
                      Delegate
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
      
      {/* Delegate Modal - Keep the existing delegation modal integration */}
      {selectedNode && (
        <DelegateTokensModal
          isOpen={showDelegateModal}
          onClose={() => setShowDelegateModal(false)}
          node={selectedNode}
          availableBalance={1000000} // Use a fixed value since we don't have access to balance
        />
      )}
      
      {/* Add a link to the dedicated NFT explorer at the bottom */}
      <div className="mt-8 text-center">
        <Link href="/ai-nodes/nft-explorer">
          <Button variant="outline" className="mx-auto">
            View AI Node NFT Collection
          </Button>
        </Link>
      </div>
    </div>
  );
}
