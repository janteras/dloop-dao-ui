'use client';

import { Badge } from '@/components/common/ui/badge';
import { Button } from '@/components/common/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/ui/card';
import { PageHeader } from '@/components/common/page-header';
import { formatNumber, shortenAddress } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { DelegateTokensModal } from '@/components/features/asset-dao/delegate-tokens-modal';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Target, 
  FileCheck, 
  UserCheck, 
  Brain, 
  User, 
  Award, 
  ZapIcon, 
  ChevronUp, 
  ChevronDown, 
  Loader2,
  ArrowUpRight
} from 'lucide-react';
import { Skeleton } from '@/components/common/ui/skeleton';
import type { Delegation } from '@/types';
import { UndelegateTokensModal } from '@/components/features/asset-dao/undelegate-tokens-modal';

// Types
type ParticipantType = 'Human' | 'AI Node';

interface Participant {
  address: string;
  name?: string;
  type: ParticipantType;
  votingPower: number;
  accuracy: number;
  performance: number;
  proposalsCreated: number;
  proposalsVoted: number;
  delegatedTo?: string;
  delegatedToName?: string;
  isCurrentUser?: boolean;
}

type SortKey = 'votingPower' | 'accuracy' | 'performance' | 'proposalsCreated';

// Participant skeleton component for loading states
function ParticipantSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      <Card className="overflow-hidden border-l-4 border-l-gray-300 dark:border-l-gray-700">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <Skeleton className="h-8 w-14 rounded-full" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-1 mb-1">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function LeaderboardExplorer() {
  const [sortBy, setSortBy] = useState<SortKey>('votingPower');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState<'all' | ParticipantType>('all');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [selectedUndelegation, setSelectedUndelegation] = useState<Delegation | null>(null);
  const [isUndelegateModalOpen, setIsUndelegateModalOpen] = useState(false);
  const { isConnected, balance, address } = useWallet();
  const { toast } = useToast();
  
  // For mobile lazy loading implementation
  const [visibleItems, setVisibleItems] = useState(3); // Start with 3 items initially
  const loaderRef = useRef<HTMLDivElement | null>(null);
  
  // Fetch wallet balance and staking info
  const { data: portfolio, isLoading: isPortfolioLoading } = useQuery({
    queryKey: ['dao-portfolio'],
    queryFn: async () => {
      // In a real implementation, this would fetch from the blockchain
      return {
        dloopBalance: 1000,
        daiBalance: 250,
        delegatedDloop: 350,
        pendingRewards: 25,
        totalVotingPower: 1350,
      };
    },
    enabled: isConnected,
  });
  
  const userBalance = portfolio?.dloopBalance || 0;
  
  // On-chain leaderboard data (participants + delegations)
  const {
    participants: chainParticipants,
    delegations: chainDelegations,
    isLoading: isChainLoading,
    delegateTokens,
    undelegateTokens,
    isDelegating,
  } = useLeaderboard();
  
  // Combined loading flag: hook loading or local skeleton loading
  const loading = isChainLoading || isPortfolioLoading;
  
  // Map delegations for enrichment - safely handle potentially undefined addresses
  const delegateMap = Object.fromEntries(
    (chainDelegations || []).map(d => [d.from?.toLowerCase() || '', d.to])
  );
  
  const enrichedParticipants: Participant[] = (chainParticipants || []).map(p => ({
    ...p,
    delegatedTo: p.address ? delegateMap[p.address.toLowerCase() || ''] : undefined,
    delegatedToName: p.address ? 
      (chainDelegations || []).find(d => d.from?.toLowerCase() === p.address?.toLowerCase())?.toName : 
      undefined,
    isCurrentUser: p.isCurrentUser || false,
  }));
  
  // Filter participants based on selected filter
  const filteredParticipants = filter === 'all' 
    ? enrichedParticipants 
    : enrichedParticipants.filter(p => p.type === filter);
  
  // Sort participants based on selected sort criteria
  const sortedParticipants = [...filteredParticipants].sort((a, b) => {
    if (sortOrder === 'asc') {
      return a[sortBy] - b[sortBy];
    } else {
      return b[sortBy] - a[sortBy];
    }
  });
  
  // Get only the visible participants based on lazy loading state
  const visibleParticipants = sortedParticipants.slice(0, visibleItems);
  
  // Function to load more items
  const loadMore = () => {
    // Add a small delay to simulate loading for smoother UX
    setTimeout(() => {
      setVisibleItems(prev => {
        const nextItems = prev + 3; // Load 3 more items
        return Math.min(nextItems, sortedParticipants.length);
      });
    }, 300);
  };
  
  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && visibleItems < sortedParticipants.length) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    const currentLoaderRef = loaderRef.current;
    if (currentLoaderRef) {
      observer.observe(currentLoaderRef);
    }
    
    return () => {
      if (currentLoaderRef) {
        observer.unobserve(currentLoaderRef);
      }
    };
  }, [visibleItems, sortedParticipants.length]);
  
  // Reset visible count when filter or sort changes
  useEffect(() => {
    setVisibleItems(3);
  }, [filter, sortBy, sortOrder]);
  
  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('desc');
    }
  };
  
  const handleDelegateClick = (participant: Participant) => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to delegate tokens.',
        variant: 'destructive',
      });
      return;
    }
    
    if (userBalance <= 0) {
      toast({
        title: 'Insufficient Balance',
        description: 'You do not have any DLOOP tokens available to delegate.',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedParticipant(participant);
    setIsDelegateModalOpen(true);
  };
  
  const handleUndelegateClick = () => {
    if (!isConnected) {
      toast({ title: 'Wallet Not Connected', description: 'Please connect your wallet.', variant: 'destructive' });
      return;
    }
    if (!address) return;
    const userDelegation = chainDelegations.find(d => d.from.toLowerCase() === address.toLowerCase());
    if (!userDelegation) return;
    setSelectedUndelegation(userDelegation);
    setIsUndelegateModalOpen(true);
  };
  
  const toggleCardExpand = (address: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [address]: !prev[address]
    }));
  };
  
  const navigateToDelegations = () => {
    window.location.href = '/delegations';
  };
  
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
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <PageHeader
          title="Governance Leaderboard"
          description="Track top performers and most accurate AI governance nodes"
        />
      </motion.div>
      
      <motion.div 
        className="flex flex-wrap justify-between gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex flex-wrap gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant={filter === 'all' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setFilter('all')}
              className="flex items-center gap-1 h-10 px-4" /* Larger touch target */
            >
              <Award className="h-4 w-4" /> All
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant={filter === 'Human' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setFilter('Human')}
              className="flex items-center gap-1 h-10 px-4" /* Larger touch target */
            >
              <User className="h-4 w-4" /> Humans
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant={filter === 'AI Node' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setFilter('AI Node')}
              className="flex items-center gap-1 h-10 px-4" /* Larger touch target */
            >
              <Brain className="h-4 w-4" /> AI Nodes
            </Button>
          </motion.div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant={sortBy === 'votingPower' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handleSort('votingPower')}
              className="flex items-center gap-1 h-10 px-4" /* Larger touch target */
            >
              <TrendingUp className="h-4 w-4" /> Voting Power 
              {sortBy === 'votingPower' && (
                sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant={sortBy === 'performance' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handleSort('performance')}
              className="flex items-center gap-1 h-10 px-4" /* Larger touch target */
            >
              <ZapIcon className="h-4 w-4" /> Performance
              {sortBy === 'performance' && (
                sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant={sortBy === 'accuracy' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => handleSort('accuracy')}
              className="flex items-center gap-1 h-10 px-4" /* Larger touch target */
            >
              <Target className="h-4 w-4" /> Accuracy
              {sortBy === 'accuracy' && (
                sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Display summary count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{visibleParticipants.length}</span> of{" "}
          <span className="font-medium">{sortedParticipants.length}</span> participants
        </p>
        
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading participants...</span>
          </div>
        )}
      </div>
      
      <motion.div 
        className="grid gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* Show skeleton during initial loading */}
        {loading ? (
          // Show 3 skeletons initially
          Array.from({ length: 3 }).map((_, index) => (
            <ParticipantSkeleton key={index} index={index} />
          ))
        ) : (
          // Render the visible participants
          visibleParticipants.map((participant, index) => (
            <motion.div
              key={participant.address}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.01,
                transition: { duration: 0.2 }
              }}
              layout
            >
              <Card 
                className={`overflow-hidden transition-all duration-300 ${
                  participant.isCurrentUser ? 'border-primary' : participant.type === 'AI Node' ? 'border-l-4 border-l-purple-500' : 'border-l-4 border-l-blue-500'
                } hover:shadow-md`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${
                          participant.type === 'AI Node' 
                            ? 'bg-purple-100 text-purple-500 dark:bg-purple-900/20 dark:text-purple-300'
                            : 'bg-blue-100 text-blue-500 dark:bg-blue-900/20 dark:text-blue-300'
                        }`}
                        whileHover={{ scale: 1.1, rotate: 10 }}
                      >
                        {participant.type === 'AI Node' 
                          ? <Brain className="h-6 w-6" /> 
                          : <User className="h-6 w-6" />
                        }
                      </motion.div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {participant.name || shortenAddress(participant.address)}
                          {participant.isCurrentUser && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, delay: 0.2 }}
                            >
                              <Badge variant="outline" className="ml-1">You</Badge>
                            </motion.div>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{shortenAddress(participant.address)}</span>
                          <Badge 
                            variant={participant.type === 'AI Node' ? 'info' : 'secondary'}
                            className={participant.type === 'AI Node' ? 'bg-purple-100/50 dark:bg-purple-900/50' : ''}
                          >
                            {participant.type}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <motion.div 
                      className="text-right bg-muted/50 px-3 py-1 rounded-full flex items-center gap-1"
                      whileHover={{ 
                        scale: 1.05,
                        backgroundColor: participant.type === 'AI Node' ? 'rgba(147, 51, 234, 0.1)' : 'rgba(59, 130, 246, 0.1)'
                      }}
                    >
                      <Award className="h-4 w-4 text-yellow-500" />
                      <div className="font-bold">#{index + 1}</div>
                    </motion.div>
                  </div>
                </CardHeader>
                <CardContent>
                  <motion.div 
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <motion.div 
                      className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <p className="text-xs text-muted-foreground">Voting Power</p>
                      </div>
                      <p className="font-medium text-base">{formatNumber(participant.votingPower)} DLOOP</p>
                    </motion.div>
                    <motion.div 
                      className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="flex items-center gap-1">
                        <ZapIcon className="h-4 w-4 text-amber-500" />
                        <p className="text-xs text-muted-foreground">Performance</p>
                      </div>
                      <p className="font-medium text-green-500 text-base">+{(participant.performance || 0).toFixed(1)}%</p>
                    </motion.div>
                    <motion.div 
                      className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-red-500" />
                        <p className="text-xs text-muted-foreground">Accuracy</p>
                      </div>
                      <p className="font-medium text-base">{participant.accuracy}%</p>
                    </motion.div>
                    <motion.div 
                      className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      whileHover={{ scale: 1.03 }}
                    >
                      <div className="flex items-center gap-1">
                        <FileCheck className="h-4 w-4 text-blue-500" />
                        <p className="text-xs text-muted-foreground">Proposals</p>
                      </div>
                      <p className="font-medium text-base">{participant.proposalsCreated} created / {participant.proposalsVoted} voted</p>
                    </motion.div>
                  </motion.div>
                  
                  {expandedCards[participant.address] && (
                    <motion.div
                      className="mt-4 p-4 bg-muted/20 rounded-lg border border-muted"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Governance Activity</h4>
                          <ul className="space-y-1 text-sm">
                            <li className="flex justify-between">
                              <span className="text-muted-foreground">Proposals Created:</span>
                              <span>{participant.proposalsCreated}</span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-muted-foreground">Proposals Voted:</span>
                              <span>{participant.proposalsVoted}</span>
                            </li>
                            <li className="flex justify-between">
                              <span className="text-muted-foreground">Voting Success Rate:</span>
                              <span className="text-green-500">{participant.accuracy}%</span>
                            </li>
                          </ul>
                        </div>
                        {participant.type === 'AI Node' && (
                          <div>
                            <h4 className="text-sm font-medium mb-2">AI Node Stats</h4>
                            <ul className="space-y-1 text-sm">
                              <li className="flex justify-between">
                                <span className="text-muted-foreground">Strategy Type:</span>
                                <span>{participant.name?.includes('Alpha') ? 'Aggressive' : participant.name?.includes('Beta') ? 'Balanced' : 'Conservative'}</span>
                              </li>
                              <li className="flex justify-between">
                                <span className="text-muted-foreground">Performance YTD:</span>
                                <span className="text-green-500">+{participant.performance.toFixed(1)}%</span>
                              </li>
                              <li className="flex justify-between">
                                <span className="text-muted-foreground">Prediction Accuracy:</span>
                                <span>{participant.accuracy}%</span>
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                  
                  {participant.delegatedTo && (
                    <motion.div
                      className="mt-2 text-sm flex items-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <UserCheck className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-muted-foreground mr-2">Delegated to:</span>
                      <Badge variant="outline" className="bg-blue-100/50 dark:bg-blue-900/50">
                        {participant.delegatedToName || shortenAddress(participant.delegatedTo)}
                      </Badge>
                    </motion.div>
                  )}
                  
                  <div className="flex justify-between mt-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleCardExpand(participant.address)}
                        className="flex items-center gap-1 h-10 px-4" /* Larger touch target */
                      >
                        {expandedCards[participant.address] ? 'Less Details' : 'More Details'}
                        {expandedCards[participant.address] ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
                        }
                      </Button>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {participant.type === 'AI Node' ? (
                        <Button 
                          size="sm"
                          className={`relative group overflow-hidden h-10 px-4 ${
                            !isConnected || userBalance <= 0 ? 'opacity-70' : ''
                          }`}
                          onClick={() => handleDelegateClick(participant)}
                          disabled={!isConnected || userBalance <= 0}
                        >
                          <span className="relative z-10 flex items-center gap-1">
                            Delegate Tokens
                            <UserCheck className="h-4 w-4" />
                          </span>
                          <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center gap-1 h-10 px-4" /* Larger touch target */
                          onClick={() => handleDelegateClick(participant)}
                          disabled={!isConnected || userBalance <= 0}
                        >
                          <span className="relative z-10 flex items-center gap-1">
                            Delegate to this User
                          </span>
                          <span className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                        </Button>
                      )}
                    </motion.div>
                    {participant.isCurrentUser && participant.delegatedTo && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 h-10 px-4"
                          onClick={handleUndelegateClick}
                          disabled={!isConnected || isDelegating}
                        >
                          <span className="relative z-10 flex items-center gap-1">
                            Undelegate
                            <ArrowUpRight className="h-4 w-4" />
                          </span>
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
        
        {/* Loader for infinite scrolling */}
        {!loading && visibleItems < sortedParticipants.length && (
          <div ref={loaderRef} className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </motion.div>
      
      {selectedParticipant && (
        <DelegateTokensModal
          isOpen={isDelegateModalOpen}
          onClose={() => setIsDelegateModalOpen(false)}
          recipientAddress={selectedParticipant.address}
          recipientName={selectedParticipant.name}
          recipientType={selectedParticipant.type}
          availableBalance={userBalance}
          onSuccess={() => {
            toast({
              title: 'Tokens Delegated',
              description: `Successfully delegated tokens to ${selectedParticipant.name || shortenAddress(selectedParticipant.address)}`,
            });
          }}
        />
      )}
      {selectedUndelegation && (
        <UndelegateTokensModal
          isOpen={isUndelegateModalOpen}
          onClose={() => setIsUndelegateModalOpen(false)}
          delegation={selectedUndelegation}
          onSuccess={() => {
            toast({
              title: 'Tokens Undelegated',
              description: `Successfully undelegated tokens from ${selectedUndelegation.toName || shortenAddress(selectedUndelegation.to)}`
            });
          }}
        />
      )}
    </div>
  );
}