import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SparklesIcon, ThumbsUp, ThumbsDown, AlertTriangle, CheckCircle2, BarChart3, RotateCcw, ArrowUpDown } from 'lucide-react';

// Define our data types
interface AINode {
  id: string;
  name: string;
  address: string;
  specialization?: string;
  accuracy?: number;
}

interface Proposal {
  id: number;
  title: string;
  description: string;
  status: string;
  votesFor: number;
  votesAgainst: number;
  type: string;
  createdAt: string;
}

interface SentimentData {
  nodeId: string;
  proposalId: number;
  sentiment: number; // -100 to 100 scale
  confidence: number; // 0 to 100 scale
  reasoning?: string;
  lastUpdated: string;
}

export function SentimentVisualizer() {
  const [selectedProposal, setSelectedProposal] = useState<number | null>(null);
  const [showReasoning, setShowReasoning] = useState<Record<string, boolean>>({});
  const [visualizationType, setVisualizationType] = useState<'list' | 'chart'>('list');
  const [sortOrder, setSortOrder] = useState<'sentiment' | 'confidence' | 'name'>('sentiment');

  // Fetch AI nodes and proposals
  const { data: aiNodes, isLoading: isLoadingNodes } = useQuery<AINode[]>({
    queryKey: ['/api/ainodes'],
    refetchOnWindowFocus: false
  });

  const { data: proposals, isLoading: isLoadingProposals } = useQuery<Proposal[]>({
    queryKey: ['/api/proposals'],
    refetchOnWindowFocus: false
  });

  // Fetch sentiment data from the backend API
  const { data: sentimentData, isLoading: isLoadingSentiments } = useQuery<SentimentData[]>({
    queryKey: ['/api/ainodes/sentiments'],
    refetchOnWindowFocus: false,
    enabled: !!(aiNodes && proposals) // Only fetch when we have nodes and proposals
  });

  // Helper function to generate AI reasoning text based on sentiment value
  function getAISentimentReasoning(sentiment: number, proposalType: string): string {
    if (sentiment > 70) {
      return `Strongly supports this ${proposalType} proposal as it aligns with optimal protocol parameters and is likely to increase capital efficiency.`;
    } else if (sentiment > 30) {
      return `Generally favorable toward this ${proposalType} initiative, with minor reservations about implementation timing.`;
    } else if (sentiment > -30) {
      return `Neutral position on this ${proposalType} with mixed analysis. Should monitor market conditions before proceeding.`;
    } else if (sentiment > -70) {
      return `Concerns about this ${proposalType} proposal's impact on protocol stability and risk profile. Suggesting modifications.`;
    } else {
      return `Strong opposition to this ${proposalType} proposal based on quantitative risk modeling and historical performance data.`;
    }
  }

  // Toggle displaying the AI reasoning for a specific node
  const toggleReasoning = (nodeId: string) => {
    setShowReasoning(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Sort the sentiment data based on current sort order
  const sortedSentimentData = React.useMemo(() => {
    if (!selectedProposal || !sentimentData) return [];
    
    const relevantData = sentimentData?.filter(data => data.proposalId === selectedProposal) || [];
    
    if (sortOrder === 'sentiment') {
      return [...relevantData].sort((a, b) => b.sentiment - a.sentiment);
    } else if (sortOrder === 'confidence') {
      return [...relevantData].sort((a, b) => b.confidence - a.confidence);
    } else {
      // Sort by node name
      return [...relevantData].sort((a, b) => {
        const nodeA = aiNodes?.find(node => node.id === a.nodeId)?.name || '';
        const nodeB = aiNodes?.find(node => node.id === b.nodeId)?.name || '';
        return nodeA.localeCompare(nodeB);
      });
    }
  }, [sentimentData, selectedProposal, sortOrder, aiNodes]);

  // Change sort order
  const changeSortOrder = () => {
    const orders: Array<'sentiment' | 'confidence' | 'name'> = ['sentiment', 'confidence', 'name'];
    const currentIndex = orders.indexOf(sortOrder);
    setSortOrder(orders[(currentIndex + 1) % orders.length]);
  };

  // Helper to get a color based on sentiment value
  const getSentimentColor = (sentiment: number): string => {
    if (sentiment > 70) return 'bg-green-500';
    if (sentiment > 30) return 'bg-green-300';
    if (sentiment > -30) return 'bg-gray-300';
    if (sentiment > -70) return 'bg-red-300';
    return 'bg-red-500';
  };

  // Get sentiment indicator icon based on value
  const getSentimentIcon = (sentiment: number) => {
    if (sentiment > 30) return <ThumbsUp className="h-4 w-4 text-green-500" />;
    if (sentiment < -30) return <ThumbsDown className="h-4 w-4 text-red-500" />;
    return <ArrowUpDown className="h-4 w-4 text-gray-500" />;
  };

  if (isLoadingNodes || isLoadingProposals || isLoadingSentiments) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg mb-4">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <SparklesIcon className="h-6 w-6 mr-2 text-primary" />
          AI Node Sentiment Analysis
        </h2>
        <p className="text-muted-foreground">
          Visualize how AI governance nodes are likely to vote on active proposals based on their
          sentiment analysis and historical voting patterns.
        </p>
      </div>

      {/* Proposal Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select a Proposal</CardTitle>
          <CardDescription>
            Choose a proposal to see AI node sentiment analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedProposal?.toString() || ''} 
            onValueChange={(value) => setSelectedProposal(Number(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a proposal" />
            </SelectTrigger>
            <SelectContent>
              {proposals?.map(proposal => (
                <SelectItem key={proposal.id} value={proposal.id.toString()}>
                  {proposal.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedProposal && proposals && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <h3 className="font-medium">
                  {proposals.find(p => p.id === selectedProposal)?.title}
                </h3>
                <Badge variant={
                  proposals.find(p => p.id === selectedProposal)?.status === 'active' 
                    ? 'default' 
                    : 'secondary'
                }>
                  {proposals.find(p => p.id === selectedProposal)?.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {proposals.find(p => p.id === selectedProposal)?.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Sentiment Display */}
      {selectedProposal && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>AI Node Sentiments</CardTitle>
              <CardDescription>
                Predicted voting intentions based on node analysis
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={changeSortOrder}
              >
                Sort: {sortOrder === 'sentiment' ? 'By Sentiment' : sortOrder === 'confidence' ? 'By Confidence' : 'By Name'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setVisualizationType(type => type === 'list' ? 'chart' : 'list')}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {visualizationType === 'list' ? 'Chart View' : 'List View'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sortedSentimentData.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p>No sentiment data available for this proposal.</p>
              </div>
            ) : visualizationType === 'list' ? (
              <div className="space-y-4">
                {sortedSentimentData.map((data) => {
                  const node = aiNodes?.find(n => n.id === data.nodeId);
                  return (
                    <div key={data.nodeId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{node?.name || 'Unknown Node'}</h4>
                          <div className="flex items-center mt-1">
                            {node?.specialization && (
                              <Badge variant="outline" className="mr-2">
                                {node.specialization}
                              </Badge>
                            )}
                            {node?.accuracy && (
                              <span className="text-xs text-muted-foreground">
                                Accuracy: {node.accuracy}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          {getSentimentIcon(data.sentiment)}
                          <Badge 
                            className="ml-2"
                            variant={data.sentiment > 0 ? 'default' : data.sentiment < 0 ? 'destructive' : 'secondary'}
                          >
                            {data.sentiment > 0 ? 'For' : data.sentiment < 0 ? 'Against' : 'Neutral'}
                            {data.confidence > 80 && ' (High Confidence)'}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Sentiment</span>
                            <span>{data.sentiment > 0 ? '+' : ''}{data.sentiment}</span>
                          </div>
                          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getSentimentColor(data.sentiment)}`}
                              style={{ 
                                width: `${Math.abs(data.sentiment)}%`,
                                marginLeft: data.sentiment < 0 ? `${100 - Math.abs(data.sentiment)}%` : '0'
                              }}
                            ></div>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Confidence</span>
                            <span>{data.confidence}%</span>
                          </div>
                          <Progress value={data.confidence} className="h-2" />
                        </div>
                        
                        <div className="pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => toggleReasoning(data.nodeId)}
                          >
                            {showReasoning[data.nodeId] ? 'Hide Reasoning' : 'Show AI Reasoning'}
                          </Button>
                          
                          {showReasoning[data.nodeId] && data.reasoning && (
                            <div className="mt-2 text-sm p-3 bg-muted/50 rounded-md">
                              "{data.reasoning}"
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="relative h-[300px] border rounded-lg p-4">
                  <div className="absolute left-0 top-0 bottom-0 w-px bg-border h-full ml-12"></div>
                  <div className="absolute left-0 right-0 top-1/2 h-px bg-border w-full"></div>
                  
                  {/* Sentiment Plot Points */}
                  {sortedSentimentData.map((data, index) => {
                    const node = aiNodes?.find(n => n.id === data.nodeId);
                    // Calculate position based on sentiment (-100 to +100) and confidence (0 to 100)
                    // Higher confidence = higher on Y axis
                    // More positive sentiment = further right on X axis
                    const xPos = ((data.sentiment + 100) / 200) * 100; // Convert to 0-100% range
                    const yPos = (data.confidence / 100) * 100; // 0-100% range
                    
                    return (
                      <div 
                        key={data.nodeId}
                        className="absolute w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center text-white"
                        style={{ 
                          left: `${xPos}%`, 
                          bottom: `${yPos}%`,
                          backgroundColor: data.sentiment > 30 
                            ? 'rgba(34, 197, 94, 0.9)' 
                            : data.sentiment < -30 
                              ? 'rgba(239, 68, 68, 0.9)' 
                              : 'rgba(156, 163, 175, 0.9)',
                          zIndex: 10
                        }}
                        title={`${node?.name || 'Node'}: Sentiment ${data.sentiment}, Confidence ${data.confidence}%`}
                      >
                        {node?.name.charAt(0) || 'N'}
                      </div>
                    );
                  })}
                  
                  {/* Axis Labels */}
                  <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-6 text-xs text-muted-foreground">Against</div>
                  <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-6 text-xs text-muted-foreground">For</div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-6 text-xs text-muted-foreground">Sentiment</div>
                  <div className="absolute top-0 left-0 transform -translate-y-6 text-xs text-muted-foreground">High Confidence</div>
                  <div className="absolute bottom-0 left-0 transform translate-y-6 text-xs text-muted-foreground">Low Confidence</div>
                </div>
                
                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-sm">
                  {sortedSentimentData.slice(0, 8).map((data) => {
                    const node = aiNodes?.find(n => n.id === data.nodeId);
                    return (
                      <Badge 
                        key={data.nodeId} 
                        variant="outline"
                        className="flex items-center gap-1.5"
                      >
                        <span 
                          className="h-3 w-3 rounded-full inline-block" 
                          style={{ 
                            backgroundColor: data.sentiment > 30 
                              ? 'rgb(34, 197, 94)' 
                              : data.sentiment < -30 
                                ? 'rgb(239, 68, 68)' 
                                : 'rgb(156, 163, 175)'
                          }}
                        ></span>
                        {node?.name}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}