
/**
 * @deprecated This App Router implementation is deprecated in favor of the unified AssetDAO page.
 * Please use /pages/assetdao.tsx or the unified components directly.
 * This file will be removed in a future version.
 */

import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { ProposalExplorer } from '@/components/features/asset-dao/proposal-explorer';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/common/ui/button';
import { Plus } from 'lucide-react';

export default function AssetDAOPage() {
  // Redirect notice for developers
  console.warn('This App Router AssetDAO page is deprecated. Use /assetdao instead.');
  
  return (
    <DashboardLayout>
      <PageHeader
        title="Asset DAO (Deprecated)"
        description="This page is deprecated. Please use the main AssetDAO page."
        actions={
          <Button className="flex items-center gap-2" disabled>
            <Plus size={16} />
            <span>Use Main AssetDAO Page</span>
          </Button>
        }
      />
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-200">
          ⚠️ This page is deprecated. Please navigate to the main AssetDAO page for the latest features and functionality.
        </p>
      </div>
    </DashboardLayout>
  );
}
