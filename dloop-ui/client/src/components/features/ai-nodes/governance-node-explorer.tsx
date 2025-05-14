import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAINodes } from '@/hooks/useAINodes';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, ArrowUpRight, Check, Activity, BarChart3, Clock, TrendingUp, Users, Info, Sparkles } from 'lucide-react';
import { TokenDelegationModal } from './token-delegation-modal';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Define the AINode interface
interface AINode {
  id: string;
  name: string;
  address: string;
  category: 'governance' | 'investment';
  votingPower: number;
  responseTime: string;
  description: string;
  accuracy: number;
  proposals: number;
  participation: number;
  reputation: number;
}

export function GovernanceNodeExplorer() {
  const { nodes, isLoading } = useAINodes();
  const [tokenDelegationOpen, setTokenDelegationOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<AINode | null>(null);
  const [delegatedNodes, setDelegatedNodes] = useState<string[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [nodeOwnership] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.4,
        ease: "easeOut"
      }
    }),
    hover: {
      scale: 1.02,
      boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)",
      transition: {
        duration: 0.2
      }
    },
    tap: {
      scale: 0.98
    }
  };

  const handleDelegateClick = (node: AINode) => {
    setSelectedNode(node);
    setTokenDelegationOpen(true);
  };

  const toggleNodeExpand = (nodeId: string) => {
    setExpandedNodes(prev => 
      prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId) 
        : [...prev, nodeId]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <motion.div
          animate={{ 
            rotate: 360,
          }} 
          transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="w-10 h-10 mx-auto mb-4"
        >
          <Brain size={40} className="text-primary/70" />
        </motion.div>
        
        <Skeleton className="h-12 w-full mb-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-100/50 to-blue-100/50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg mb-8 border border-purple-200 dark:border-purple-900/50">
        <h2 className="text-2xl font-bold mb-2 text-purple-800 dark:text-purple-300">AI Governance Nodes</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Specialized AI agents that analyze and vote on D-AI reserve pool proposals to optimize stability and returns.
          Delegate your DLOOP tokens to these nodes to boost your voting power and earn rewards.
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-3 mb-8">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <TabsTrigger value="all" className="text-sm md:text-base">
                All Nodes
              </TabsTrigger>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <TabsTrigger value="delegated" className="text-sm md:text-base">
                My Delegations
              </TabsTrigger>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <TabsTrigger value="owned" className="text-sm md:text-base">
                My Nodes
              </TabsTrigger>
            </motion.div>
          </TabsList>
        
        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nodes?.map((node: AINode, index: number) => (
              <Card key={node.id} className={`overflow-hidden hover:shadow-md transition-all ${nodeOwnership[node.id] ? 'border-primary/50' : ''}`}>
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg text-primary">
                          <Brain size={18} className="text-primary" />
                          {node.name}
                        </CardTitle>
                        <CardDescription className="mt-1 truncate max-w-[200px]">
                          {node.address.substring(0, 8)}...{node.address.substring(36)}
                        </CardDescription>
                      </div>
                      <Badge variant={node.category === 'governance' ? 'default' : 'outline'} className="capitalize">
                        {node.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-4">
                    <div className="space-y-3 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Activity size={14} /> Voting Power
                        </span>
                        <span className="font-medium">{node.votingPower?.toLocaleString() || "0"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Clock size={14} /> Response Time
                        </span>
                        <span className="font-medium">{node.responseTime}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <BarChart3 size={14} /> Accuracy
                        </span>
                        <div className="flex items-center gap-2">
                          <Progress value={node.accuracy || 0} className="h-2 w-16" />
                          <span className="font-medium text-sm">{node.accuracy || 0}%</span>
                        </div>
                      </div>
                    </div>
                    
                    {expandedNodes.includes(node.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800"
                      >
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                          {node.description}
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                            <div className="text-primary font-semibold">{node.proposals}</div>
                            <div className="text-xs text-gray-500">Proposals</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                            <div className="text-primary font-semibold">{node.participation}%</div>
                            <div className="text-xs text-gray-500">Participation</div>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-900 p-2 rounded">
                            <div className="text-primary font-semibold">{node.reputation}</div>
                            <div className="text-xs text-gray-500">Reputation</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-between pt-0">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleNodeExpand(node.id)}
                    >
                      {expandedNodes.includes(node.id) ? 'Less Info' : 'More Info'}
                    </Button>
                    
                    <Button 
                      size="sm" 
                      onClick={() => handleDelegateClick(node)}
                      className={delegatedNodes.includes(node.id) ? 'bg-green-600 hover:bg-green-700' : ''}
                      title={delegatedNodes.includes(node.id)
                        ? 'You already delegated tokens to this node'
                        : 'Delegate DLOOP tokens to boost your voting power'}
                    >
                      {delegatedNodes.includes(node.id) ? (
                        <div className="flex items-center gap-1">
                          <Check size={14} /> <span>Delegated</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Sparkles size={14} /> <span>Delegate</span>
                        </div>
                      )}
                    </Button>
                  </CardFooter>
                </motion.div>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="delegated" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nodes?.filter((node: AINode) => delegatedNodes.includes(node.id)).length > 0 ? (
              nodes?.filter((node: AINode) => delegatedNodes.includes(node.id)).map((node: AINode, index: number) => (
                <Card key={node.id} className="overflow-hidden hover:shadow-md transition-all">
                  <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg text-green-600 dark:text-green-400">
                            <Check size={18} className="text-green-600 dark:text-green-400" />
                            {node.name}
                          </CardTitle>
                          <CardDescription className="mt-1 truncate max-w-[200px]">
                            {node.address.substring(0, 8)}...{node.address.substring(36)}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700">
                          Delegated
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Activity size={14} /> Voting Power
                          </span>
                          <span className="font-medium">{node.votingPower?.toLocaleString() || "0"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Clock size={14} /> Response Time
                          </span>
                          <span className="font-medium">{node.responseTime}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <BarChart3 size={14} /> Accuracy
                          </span>
                          <div className="flex items-center gap-2">
                            <Progress value={node.accuracy || 0} className="h-2 w-16" />
                            <span className="font-medium text-sm">{node.accuracy || 0}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-0">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        onClick={() => {
                          setDelegatedNodes(prev => prev.filter(id => id !== node.id));
                          toast({
                            title: "Tokens Undelegated",
                            description: `You've removed your token delegation from ${node.name}.`,
                          });
                        }}
                      >
                        Undelegate Tokens
                      </Button>
                    </CardFooter>
                  </motion.div>
                </Card>
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-3 p-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <Info className="h-6 w-6 text-gray-500" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Delegations Yet</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                  You haven't delegated your DLOOP tokens to any AI nodes. Delegation can boost your voting power and earn rewards.
                </p>
                <Button 
                  variant="default" 
                  onClick={() => document.querySelector('[value="all"]')?.dispatchEvent(new Event('click'))}
                  className="mt-2"
                >
                  Explore Nodes
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="owned" className="space-y-6">
          <div className="col-span-1 md:col-span-2 lg:col-span-3 p-8 text-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-800">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <Users className="h-6 w-6 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Owned Nodes</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              You don't own any AI nodes yet. In the future, you'll be able to create and manage your own AI governance nodes.
            </p>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Token Delegation Modal */}
      {selectedNode && (
        <TokenDelegationModal
          isOpen={tokenDelegationOpen}
          onClose={() => setTokenDelegationOpen(false)}
          node={selectedNode}
          onDelegationSuccess={(nodeId) => {
            setDelegatedNodes(prev => [...prev.filter(id => id !== nodeId), nodeId]);
            toast({
              title: "Success",
              description: `You've successfully delegated DLOOP tokens to ${selectedNode.name}.`,
            });
          }}
        />
      )}
    </div>
  );
}