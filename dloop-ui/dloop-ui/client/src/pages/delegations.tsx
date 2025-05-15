import { Delegations } from '@/components/features/asset-dao/delegations';
import { PageHeader } from '@/components/common/page-header';
import { PageContainer } from '@/components/layout/PageContainer';

export default function DelegationsPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="DLOOP Delegations"
          description="Delegate your DLOOP tokens to AI nodes and trusted community members to increase their voting power while retaining ownership."
        />
        <Delegations />
      </div>
    </PageContainer>
  );
}