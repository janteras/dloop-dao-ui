import AINodeExplorer from "@/components/features/ai-nodes/ai-node-explorer";
import { useLocation } from "wouter";

export default function AINodesPage() {
  const [location] = useLocation();
  
  // Check if we're on a node detail page
  const isNodeDetail = location.startsWith('/ai-nodes/') && location.split('/').length === 3;
  
  if (isNodeDetail) {
    const nodeId = location.split('/').pop();
    return (
      <div>
        {/* In a complete implementation, we would fetch the node details and 
            render a node detail component */}
        <AINodeExplorer />
      </div>
    );
  }
  
  // Otherwise show the node explorer
  return <AINodeExplorer />;
}
