import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAINodes } from "@/hooks/useAINodes";
import { useWallet } from "@/hooks/useWallet";
import { shortenAddress } from "@/lib/utils";
import AINodeDetail from "./AINodeDetail";
import { AINode } from "@/types";

const AINodes = () => {
  const { isConnected } = useWallet();
  const { nodes, performance, isLoading, error } = useAINodes();
  const [selectedNode, setSelectedNode] = useState<AINode | null>(null);

  const handleViewDetails = (node: AINode) => {
    setSelectedNode(node);
    // Scroll to the details section
    setTimeout(() => {
      const element = document.getElementById('nodeDetail');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <section className="page-transition">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-white">AI Governance Nodes</h1>
        
        <Link href="/leaderboard">
          <Button 
            className="bg-accent text-dark-bg font-medium hover:bg-darker-accent transition-colors"
            disabled={!isConnected}
          >
            Delegate to AI
          </Button>
        </Link>
      </div>
      
      {/* Performance Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-gray mb-2">Total Delegated</h2>
            <div className="text-3xl font-bold text-white mono">
              {performance?.totalDelegated?.toLocaleString() || '0'} DLOOP
            </div>
            <div className="mt-2 text-sm text-gray flex items-center">
              <span className="text-accent mr-1">↑ {performance?.delegationChange || '0'}%</span>
              <span>since last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-gray mb-2">Average Performance</h2>
            <div className="text-3xl font-bold text-white mono">
              +{performance?.averagePerformance || '0'}%
            </div>
            <div className="mt-2 text-sm text-gray flex items-center">
              <span className="text-accent mr-1">↑ {performance?.performanceDelta || '0'}%</span>
              <span>vs. market average</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-medium text-gray mb-2">Active AI Nodes</h2>
            <div className="text-3xl font-bold text-white mono">
              {nodes.length}
            </div>
            <div className="mt-2 text-sm text-accent">
              {performance?.newNodes || '0'} new node{performance?.newNodes !== 1 ? 's' : ''} this month
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* AI Node Performance Table */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">AI Node Performance</h2>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <h3 className="text-xl text-warning-red mb-2">Error Loading AI Nodes</h3>
              <p className="text-gray">{error}</p>
            </div>
          ) : nodes.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-xl text-white mb-2">No AI nodes found</h3>
              <p className="text-gray">There are no active AI governance nodes at this time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray">
                    <th className="text-left p-4 text-gray font-medium">Node</th>
                    <th className="text-left p-4 text-gray font-medium">Strategy</th>
                    <th className="text-right p-4 text-gray font-medium">Delegated DLOOP</th>
                    <th className="text-right p-4 text-gray font-medium">Voting Accuracy</th>
                    <th className="text-right p-4 text-gray font-medium">Performance</th>
                    <th className="text-right p-4 text-gray font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray/30">
                  {nodes.map((node) => (
                    <tr key={node.id} className="hover:bg-dark-bg/50">
                      <td className="p-4">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-500 mr-3 flex items-center justify-center">
                            <span className="text-white font-medium">AI</span>
                          </div>
                          <span className="text-white font-medium">{node.name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray">{node.strategy}</td>
                      <td className="p-4 text-right text-white font-medium mono">{node.delegatedAmount.toLocaleString()}</td>
                      <td className="p-4 text-right text-white font-medium">{node.accuracy}%</td>
                      <td className={`p-4 text-right font-medium ${node.performance >= 0 ? 'text-accent' : 'text-warning-red'}`}>
                        {node.performance >= 0 ? '+' : ''}{node.performance}%
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          variant="link" 
                          className="text-accent hover:underline"
                          onClick={() => handleViewDetails(node)}
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* AI Node Detail View */}
      {selectedNode && (
        <div id="nodeDetail">
          <AINodeDetail node={selectedNode} />
        </div>
      )}
    </section>
  );
};

export default AINodes;
