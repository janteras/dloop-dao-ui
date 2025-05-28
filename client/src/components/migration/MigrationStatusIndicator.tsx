/**
 * Migration Status Indicator
 * 
 * A visual component showing the implementation status for Ethers-to-Wagmi migration.
 * Displays which implementation is active and provides performance metrics.
 */

import React from 'react';
import { ContractImplementation, ImplementationDetails } from '@/types/unified-contracts';

interface MigrationStatusIndicatorProps {
  componentName: string;
  implementation: ContractImplementation;
  details?: ImplementationDetails;
  showPerformance?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const MigrationStatusIndicator: React.FC<MigrationStatusIndicatorProps> = ({
  componentName,
  implementation,
  details,
  showPerformance = false,
  size = 'md',
  className = '',
}) => {
  // Color mapping for different implementations
  const colorMap: Record<ContractImplementation, string> = {
    ethers: 'bg-yellow-500',   // Yellow for legacy implementation
    wagmi: 'bg-green-500',     // Green for new implementation
    hybrid: 'bg-blue-500',     // Blue for hybrid mode
  };
  
  // Status label mapping
  const labelMap: Record<ContractImplementation, string> = {
    ethers: 'Ethers',
    wagmi: 'Wagmi',
    hybrid: 'Hybrid',
  };
  
  // Size mapping
  const sizeMap = {
    sm: {
      dot: 'w-2 h-2',
      text: 'text-xs',
      container: 'px-1.5 py-0.5',
    },
    md: {
      dot: 'w-3 h-3',
      text: 'text-sm',
      container: 'px-2 py-1',
    },
    lg: {
      dot: 'w-4 h-4',
      text: 'text-base',
      container: 'px-3 py-1.5',
    },
  };
  
  const { dot, text, container } = sizeMap[size];
  
  return (
    <div className={`inline-flex items-center border rounded-full ${container} ${className}`}>
      <div className={`${dot} rounded-full ${colorMap[implementation]} mr-1`} />
      <span className={`${text} font-medium`}>
        {componentName}: {labelMap[implementation]}
      </span>
      
      {showPerformance && details && (
        <div className="ml-2 flex items-center">
          {details.responseTime && (
            <span className={`${text} text-gray-600`}>
              {details.responseTime.toFixed(0)}ms
            </span>
          )}
          {details.errorCount !== undefined && details.errorCount > 0 && (
            <span className={`${text} text-red-500 ml-1`}>
              ({details.errorCount} errors)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Migration Dashboard Indicator
 * 
 * A more detailed component showing migration progress for a specific feature,
 * including performance comparison between implementations.
 */
interface MigrationDashboardIndicatorProps {
  featureName: string;
  currentImplementation: ContractImplementation;
  migrationPercentage: number;
  ethersMetrics?: {
    responseTime?: number;
    errorRate?: number;
    callCount?: number;
  };
  wagmiMetrics?: {
    responseTime?: number;
    errorRate?: number;
    callCount?: number;
  };
}

export const MigrationDashboardIndicator: React.FC<MigrationDashboardIndicatorProps> = ({
  featureName,
  currentImplementation,
  migrationPercentage,
  ethersMetrics,
  wagmiMetrics,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-lg">{featureName}</h3>
        <MigrationStatusIndicator 
          componentName=""
          implementation={currentImplementation}
          size="sm"
        />
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1">
          <span>Migration Progress</span>
          <span>{migrationPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-blue-600 h-2.5 rounded-full" 
            style={{ width: `${migrationPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {(ethersMetrics || wagmiMetrics) && (
        <div className="mt-3 border-t pt-2">
          <h4 className="text-sm font-medium mb-2">Performance Comparison</h4>
          
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="font-medium">Metric</div>
            <div className="font-medium text-yellow-600">Ethers</div>
            <div className="font-medium text-green-600">Wagmi</div>
            
            <div>Avg. Response</div>
            <div>{ethersMetrics?.responseTime?.toFixed(0) || '-'} ms</div>
            <div>{wagmiMetrics?.responseTime?.toFixed(0) || '-'} ms</div>
            
            <div>Error Rate</div>
            <div>{ethersMetrics?.errorRate?.toFixed(1) || '-'}%</div>
            <div>{wagmiMetrics?.errorRate?.toFixed(1) || '-'}%</div>
            
            <div>Call Count</div>
            <div>{ethersMetrics?.callCount || '-'}</div>
            <div>{wagmiMetrics?.callCount || '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * AssetDAO Migration Tracker
 * 
 * A specialized component for tracking the AssetDAO feature migration status
 * with detailed performance metrics and progress visualization.
 */
interface AssetDAOMigrationTrackerProps {
  migrationPercentage: number;
  implementation: ContractImplementation;
  metrics?: {
    ethers: {
      responseTime: number;
      errorRate: number;
      callCount: number;
    };
    wagmi: {
      responseTime: number;
      errorRate: number;
      callCount: number;
    };
  };
}

export const AssetDAOMigrationTracker: React.FC<AssetDAOMigrationTrackerProps> = ({
  migrationPercentage,
  implementation,
  metrics,
}) => {
  return (
    <MigrationDashboardIndicator
      featureName="AssetDAO"
      currentImplementation={implementation}
      migrationPercentage={migrationPercentage}
      ethersMetrics={metrics?.ethers}
      wagmiMetrics={metrics?.wagmi}
    />
  );
};

export default MigrationStatusIndicator;
