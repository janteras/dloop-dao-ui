import React from 'react';
import { MigrationDashboard } from '@/components/features/migration/MigrationDashboard';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';

/**
 * Migration Dashboard page component
 * Provides a comprehensive view of the migration progress and tools
 */
export default function MigrationDashboardPage() {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <MigrationDashboard />
      </div>
    </DashboardLayout>
  );
}
