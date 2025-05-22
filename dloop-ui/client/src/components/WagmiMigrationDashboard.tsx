import React, { useEffect, useState } from 'react';
import { useAppConfig } from '@/config/app-config';
import { Web3Implementation } from '@/types/web3-types';

// Define the component types that can be migrated
export enum MigratedComponent {
  CONTRACT_INTERACTIONS = 'ContractInteractions',
  EVENT_SUBSCRIPTIONS = 'EventSubscriptions',
  PROPOSAL_LIST = 'ProposalList',
  AI_NODES = 'AINodes',
  PROTOCOL_DAO = 'ProtocolDAO',
  TOKEN_INFO = 'TokenInfo',
  VOTING = 'Voting',
}

// Define the migration status
interface MigrationStatus {
  component: MigratedComponent;
  status: 'not-started' | 'in-progress' | 'completed';
  implementation: Web3Implementation;
  performance?: {
    ethers?: number; // Average response time in ms
    wagmi?: number;  // Average response time in ms
  };
  errorRate?: {
    ethers?: number; // Error rate percentage
    wagmi?: number;  // Error rate percentage
  };
  lastUpdated: Date;
}

// Component to display the migration status for a single component
const MigrationStatusIndicator: React.FC<{
  status: MigrationStatus;
}> = ({ status }) => {
  // Get status color
  const getStatusColor = () => {
    switch (status.status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-yellow-500';
      case 'not-started':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  };

  // Get implementation text
  const getImplementationText = () => {
    switch (status.implementation) {
      case Web3Implementation.ETHERS:
        return 'Ethers.js';
      case Web3Implementation.WAGMI:
        return 'Wagmi';
      case Web3Implementation.HYBRID:
        return 'Hybrid';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{status.component}</h3>
          <div className="flex items-center mt-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} mr-2`}></div>
            <span className="text-sm">{status.status}</span>
          </div>
          <div className="text-sm mt-2">
            Current Implementation: <strong>{getImplementationText()}</strong>
          </div>
        </div>
        
        {/* Performance metrics if available */}
        {status.performance && (
          <div className="text-right text-sm">
            <div className="font-semibold">Response Time</div>
            {status.performance.ethers && (
              <div>Ethers: {status.performance.ethers}ms</div>
            )}
            {status.performance.wagmi && (
              <div>Wagmi: {status.performance.wagmi}ms</div>
            )}
          </div>
        )}
      </div>
      
      {/* Error rate comparison if available */}
      {status.errorRate && (
        <div className="mt-4">
          <div className="text-sm font-semibold">Error Rate</div>
          <div className="flex mt-1">
            {status.errorRate.ethers !== undefined && (
              <div className="flex-1">
                <div className="text-sm">Ethers</div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500" 
                    style={{ width: `${Math.min(status.errorRate.ethers, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs mt-1">{status.errorRate.ethers}%</div>
              </div>
            )}
            {status.errorRate.wagmi !== undefined && (
              <div className="flex-1 ml-2">
                <div className="text-sm">Wagmi</div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500" 
                    style={{ width: `${Math.min(status.errorRate.wagmi, 100)}%` }}
                  ></div>
                </div>
                <div className="text-xs mt-1">{status.errorRate.wagmi}%</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="text-xs text-gray-500 mt-4">
        Last updated: {status.lastUpdated.toLocaleString()}
      </div>
    </div>
  );
};

/**
 * Dashboard to track the migration progress from Ethers.js to Wagmi
 */
const WagmiMigrationDashboard: React.FC = () => {
  const appConfig = useAppConfig();
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus[]>([]);
  
  // Mock data for demonstration - in a real app, this would come from telemetry
  useEffect(() => {
    const mockStatus: MigrationStatus[] = [
      {
        component: MigratedComponent.CONTRACT_INTERACTIONS,
        status: 'completed',
        implementation: Web3Implementation.WAGMI,
        performance: {
          ethers: 245,
          wagmi: 189,
        },
        errorRate: {
          ethers: 3.2,
          wagmi: 1.5,
        },
        lastUpdated: new Date(),
      },
      {
        component: MigratedComponent.EVENT_SUBSCRIPTIONS,
        status: 'in-progress',
        implementation: Web3Implementation.HYBRID,
        performance: {
          ethers: 312,
          wagmi: 280,
        },
        errorRate: {
          ethers: 2.8,
          wagmi: 4.1, // Higher error rate in Wagmi implementation - needs work
        },
        lastUpdated: new Date(),
      },
      {
        component: MigratedComponent.PROPOSAL_LIST,
        status: 'completed',
        implementation: Web3Implementation.WAGMI,
        performance: {
          ethers: 420,
          wagmi: 310,
        },
        errorRate: {
          ethers: 1.7,
          wagmi: 1.2,
        },
        lastUpdated: new Date(),
      },
      {
        component: MigratedComponent.AI_NODES,
        status: 'completed',
        implementation: Web3Implementation.WAGMI,
        performance: {
          ethers: 178,
          wagmi: 142,
        },
        errorRate: {
          ethers: 0.8,
          wagmi: 0.5,
        },
        lastUpdated: new Date(),
      },
      {
        component: MigratedComponent.PROTOCOL_DAO,
        status: 'in-progress',
        implementation: Web3Implementation.HYBRID,
        performance: {
          ethers: 390,
          wagmi: 325,
        },
        errorRate: {
          ethers: 2.1,
          wagmi: 2.3,
        },
        lastUpdated: new Date(),
      },
      {
        component: MigratedComponent.TOKEN_INFO,
        status: 'completed',
        implementation: Web3Implementation.WAGMI,
        performance: {
          ethers: 276,
          wagmi: 203,
        },
        errorRate: {
          ethers: 1.3,
          wagmi: 0.9,
        },
        lastUpdated: new Date(),
      },
      {
        component: MigratedComponent.VOTING,
        status: 'completed',
        implementation: Web3Implementation.WAGMI,
        performance: {
          ethers: 330,
          wagmi: 265,
        },
        errorRate: {
          ethers: 3.5,
          wagmi: 1.8,
        },
        lastUpdated: new Date(),
      },
    ];
    
    setMigrationStatus(mockStatus);
  }, []);
  
  // Calculate overall migration progress
  const completedCount = migrationStatus.filter(s => s.status === 'completed').length;
  const totalCount = migrationStatus.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  
  // Calculate average performance improvement
  const performanceImprovement = migrationStatus.reduce((acc, status) => {
    if (status.performance?.ethers && status.performance?.wagmi) {
      const improvement = (status.performance.ethers - status.performance.wagmi) / status.performance.ethers * 100;
      return acc + improvement;
    }
    return acc;
  }, 0) / migrationStatus.filter(s => s.performance?.ethers && s.performance?.wagmi).length;
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Ethers.js to Wagmi Migration Dashboard</h1>
      
      {/* Overall progress */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Overall Progress</h2>
        <div className="mb-2 flex justify-between">
          <span>{completedCount} of {totalCount} components migrated</span>
          <span>{progressPercentage.toFixed(0)}%</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        
        {/* Summary metrics */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="text-sm text-gray-600">Avg. Performance Improvement</div>
            <div className="text-2xl font-bold text-blue-700">
              {performanceImprovement.toFixed(1)}%
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="text-sm text-gray-600">Global Feature Flag</div>
            <div className="text-2xl font-bold text-green-700">
              {appConfig.useWagmi ? 'Wagmi Enabled' : 'Ethers.js Enabled'}
            </div>
          </div>
        </div>
      </div>
      
      {/* Component status cards */}
      <h2 className="text-xl font-semibold mb-4">Component Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {migrationStatus.map(status => (
          <MigrationStatusIndicator 
            key={status.component} 
            status={status} 
          />
        ))}
      </div>
      
      {/* Tips and documentation */}
      <div className="mt-8 bg-white rounded-lg p-6 shadow-md">
        <h2 className="text-xl font-semibold mb-4">Migration Resources</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <a href="/docs/Ethers_to_Wagmi_Migration.md" className="text-blue-600 hover:underline">
              Migration Documentation
            </a>
          </li>
          <li>
            <a href="https://wagmi.sh/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Wagmi Documentation
            </a>
          </li>
          <li>
            <a href="https://docs.ethers.org/v6/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Ethers.js Documentation
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WagmiMigrationDashboard;
