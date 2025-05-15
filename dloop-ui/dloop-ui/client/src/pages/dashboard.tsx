import { ProtocolMetrics } from "@/components/features/dashboard/protocol-metrics";
import { EnhancedUserPortfolio } from "@/components/features/dashboard/enhanced-user-portfolio";
import { BlockchainStatus } from "@/components/features/blockchain/BlockchainStatus";
import { AssetDAOStatus } from "@/components/features/blockchain/AssetDAOStatus";
import { BlockchainVerification } from "@/components/features/infrastructure/BlockchainVerification";
import { InfrastructureStatus } from "@/components/features/infrastructure/InfrastructureStatus";
import { WalletConnectBanner } from "@/components/features/wallet/wallet-connect-banner";
import { useWallet } from "@/components/features/wallet/simplified-wallet-provider";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/ui/card";
import { Button } from "@/components/common/ui/button";
import { Link } from "wouter";
import { PageContainer } from "@/components/layout/PageContainer";
import GovernanceOverview from "@/components/features/dashboard/governance-overview";

export default function DashboardPage() {
  const { isConnected } = useWallet();

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Monitor and govern D-AI's asset-backed reserves and your portfolio performance"
        />
        
        {/* Infrastructure Status - will only show if there are issues */}
        <InfrastructureStatus />
        
        {/* WalletConnect banner - only shows if wallet is not connected */}
        <WalletConnectBanner />
        
        <ProtocolMetrics />
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-1">
            <EnhancedUserPortfolio />
            
            {/* Blockchain Status Component to verify our connection */}
            <div className="mt-6 space-y-6">
              <BlockchainVerification />
            </div>
          </div>
          <div className="md:col-span-1 lg:col-span-2">
            <GovernanceOverview />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
