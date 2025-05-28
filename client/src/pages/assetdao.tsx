import { ProposalExplorer } from "@/components/features/asset-dao/proposal-explorer";
import { ProposalDetail } from "@/components/features/asset-dao/proposal-detail";
import { useLocation } from "wouter";
import { PageContainer } from "@/components/layout/PageContainer";

export default function AssetDAOPage() {
  const [location] = useLocation();
  
  // Check if we're on a proposal detail page
  const isProposalDetail = location.startsWith('/asset-dao/proposal/');
  
  if (isProposalDetail) {
    const proposalId = location.split('/').pop() || '';
    return (
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Asset DAO</h1>
          <p className="text-muted-foreground mt-1">
            Proposal Details
          </p>
        </div>
        <ProposalDetail proposalId={proposalId} />
      </PageContainer>
    );
  }
  
  // Otherwise show the proposal explorer
  return (
    <PageContainer>
      <ProposalExplorer />
    </PageContainer>
  );
}
