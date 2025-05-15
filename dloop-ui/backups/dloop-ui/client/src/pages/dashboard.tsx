import { ProtocolMetrics } from "@/components/features/dashboard/protocol-metrics";
import { UserPortfolio } from "@/components/features/dashboard/user-portfolio";
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

export default function DashboardPage() {
  const { isConnected } = useWallet();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of the D-LOOP protocol and your portfolio"
      />
      
      {/* Infrastructure Status - will only show if there are issues */}
      <InfrastructureStatus />
      
      {/* WalletConnect banner - only shows if wallet is not connected */}
      <WalletConnectBanner />
      
      <ProtocolMetrics />
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-1">
          <UserPortfolio />
          
          {/* Blockchain Status Component to verify our connection */}
          <div className="mt-6 space-y-6">
            <BlockchainVerification />
          </div>
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Governance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">View current proposals and voting results for the D-Loop protocol.</p>
              <div className="mt-4">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/asset-dao">View Asset DAO</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
