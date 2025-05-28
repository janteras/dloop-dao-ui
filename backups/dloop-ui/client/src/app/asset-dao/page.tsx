import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { ProposalExplorer } from '@/components/features/asset-dao/proposal-explorer';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/common/ui/button';
import { Plus } from 'lucide-react';

export default function AssetDAOPage() {
  return (
    <DashboardLayout>
      <PageHeader
        title="Asset DAO"
        description="Govern treasury assets and investment strategies"
        actions={
          <Button className="flex items-center gap-2">
            <Plus size={16} />
            <span>Create Proposal</span>
          </Button>
        }
      />
      <div className="mt-6">
        <ProposalExplorer />
      </div>
    </DashboardLayout>
  );
}