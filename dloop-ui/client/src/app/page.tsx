import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { ProtocolMetrics } from '@/components/features/dashboard/protocol-metrics';
import { UserPortfolio } from '@/components/features/dashboard/user-portfolio';
import { ActivityFeed } from '@/components/features/dashboard/activity-feed';
import { GovernanceOverview } from '@/components/features/dashboard/governance-overview';
import { AINodePerformance } from '@/components/features/dashboard/ai-node-performance';

export default function Home() {
  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-full">
          <ProtocolMetrics />
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <UserPortfolio />
        </div>
        <div className="md:col-span-1">
          <ActivityFeed />
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <GovernanceOverview />
        </div>
        <div className="md:col-span-1">
          <AINodePerformance />
        </div>
      </div>
    </DashboardLayout>
  );
}