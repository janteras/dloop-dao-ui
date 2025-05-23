import React, { useEffect, useState, useMemo } from 'react';
import { useAppConfig } from '@/config/app-config';
import { Web3Implementation } from '@/types/web3-types';
import { ImplementationComparison, getPerformanceComparison } from '@/services/telemetry/assetDaoTelemetry';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { useTelemetry } from '@/providers/TelemetryProvider';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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

// API response interfaces
interface ComponentMetrics {
  averageResponseTime: {
    ethers: number;
    wagmi: number;
  };
  successRate: {
    ethers: number;
    wagmi: number;
  };
  userAdoption: number; // percentage of users using Wagmi implementation
}

interface ComponentData {
  name: string;
  status: 'completed' | 'in_progress' | 'not_started';
  testCoverage: number;
}

interface MigrationStatusResponse {
  completionPercentage: number;
  components: ComponentData[];
  metrics: ComponentMetrics;
}

interface OverallStatus {
  completionPercentage: number;
  components: {
    total: number;
    completed: number;
    inProgress: number;
    notStarted: number;
  };
  metrics: {
    performanceImprovement: number;
    errorRateReduction: number;
    userAdoption: number;
  };
}

interface DeploymentData {
  id: string;
  date: string;
  status: string;
  environment: string;
  features: string[];
  metrics: {
    buildTime: number;
    deploymentSize: number;
    lighthouseScore: {
      performance: number;
      accessibility: number;
      bestPractices: number;
      seo: number;
    };
  };
}

interface ApiResponse {
  assetDao: MigrationStatusResponse;
  tokenVault: MigrationStatusResponse;
  bountyManager: MigrationStatusResponse;
  overall: OverallStatus;
  deployments: DeploymentData[];
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
 * Performance comparison chart component
 */
const PerformanceComparisonChart: React.FC<{
  comparisonData: ImplementationComparison[];
}> = ({ comparisonData }) => {
  const chartData = useMemo(() => {
    return {
      labels: comparisonData.map(d => d.operation),
      datasets: [
        {
          label: 'Ethers',
          data: comparisonData.map(d => d.ethersAvgDuration),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Wagmi',
          data: comparisonData.map(d => d.wagmiAvgDuration),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [comparisonData]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Response Time Comparison (ms)',
      },
      tooltip: {
        callbacks: {
          afterLabel: function(context: any) {
            const dataIndex = context.dataIndex;
            const improvement = comparisonData[dataIndex].improvementPercentage;
            return `Improvement: ${improvement.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Milliseconds'
        }
      }
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm mb-6">
      <h3 className="text-lg font-semibold mb-4">Performance Comparison</h3>
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
};

/**
 * Success rate comparison chart component
 */
const SuccessRateChart: React.FC<{
  comparisonData: ImplementationComparison[];
}> = ({ comparisonData }) => {
  const chartData = useMemo(() => {
    return {
      labels: comparisonData.map(d => d.operation),
      datasets: [
        {
          label: 'Ethers',
          data: comparisonData.map(d => d.ethersSuccessRate),
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
        {
          label: 'Wagmi',
          data: comparisonData.map(d => d.wagmiSuccessRate),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [comparisonData]);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Success Rate Comparison (%)',
      },
    },
    scales: {
      y: {
        min: 90, // Start at 90% to better show differences
        max: 100,
        title: {
          display: true,
          text: 'Success Rate (%)'
        }
      }
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm mb-6">
      <h3 className="text-lg font-semibold mb-4">Success Rate Comparison</h3>
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
};

/**
 * Dashboard to track the migration progress from Ethers.js to Wagmi
 */
const WagmiMigrationDashboard: React.FC = () => {
  const appConfig = useAppConfig();
  const { trackEvent } = useTelemetry();
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus[]>([]);
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [performanceData, setPerformanceData] = useState<ImplementationComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch migration status from API
  useEffect(() => {
    const fetchMigrationStatus = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Track dashboard view event
        trackEvent('dashboard', 'view', 'migration_dashboard');
        
        // Fetch migration status data
        const response = await fetch('/api/migration-status');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch migration status: ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        setApiData(data);
        
        // Convert API data to component state
        const mappedStatus: MigrationStatus[] = [
          ...data.assetDao.components.map(component => ({
            component: component.name as unknown as MigratedComponent,
            status: component.status === 'completed' ? 'completed' : 
                   component.status === 'in_progress' ? 'in-progress' : 'not-started',
            implementation: component.status === 'completed' ? 
                          Web3Implementation.WAGMI : 
                          component.status === 'in_progress' ? 
                          Web3Implementation.HYBRID : Web3Implementation.ETHERS,
            performance: {
              ethers: data.assetDao.metrics.averageResponseTime.ethers,
              wagmi: data.assetDao.metrics.averageResponseTime.wagmi,
            },
            errorRate: {
              ethers: 100 - data.assetDao.metrics.successRate.ethers,
              wagmi: 100 - data.assetDao.metrics.successRate.wagmi,
            },
            lastUpdated: new Date(),
          })),
          ...data.tokenVault.components.map(component => ({
            component: component.name as unknown as MigratedComponent,
            status: component.status === 'completed' ? 'completed' : 
                   component.status === 'in_progress' ? 'in-progress' : 'not-started',
            implementation: component.status === 'completed' ? 
                          Web3Implementation.WAGMI : 
                          component.status === 'in_progress' ? 
                          Web3Implementation.HYBRID : Web3Implementation.ETHERS,
            performance: {
              ethers: data.tokenVault.metrics.averageResponseTime.ethers,
              wagmi: data.tokenVault.metrics.averageResponseTime.wagmi,
            },
            errorRate: {
              ethers: 100 - data.tokenVault.metrics.successRate.ethers,
              wagmi: 100 - data.tokenVault.metrics.successRate.wagmi,
            },
            lastUpdated: new Date(),
          })),
        ];
        
        setMigrationStatus(mappedStatus);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching migration status:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
        
        // Fallback to mock data if API fails
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
              ethers: 356,
              wagmi: 298,
            },
            errorRate: {
              ethers: 2.2,
              wagmi: 1.8,
            },
            lastUpdated: new Date(),
          },
          {
            component: MigratedComponent.TOKEN_INFO,
            status: 'in-progress',
            implementation: Web3Implementation.HYBRID,
            performance: {
              ethers: 220,
              wagmi: 182,
            },
            errorRate: {
              ethers: 1.9,
              wagmi: 1.4,
            },
            lastUpdated: new Date(),
          },
          {
            component: MigratedComponent.VOTING,
            status: 'not-started',
            implementation: Web3Implementation.ETHERS,
            performance: {
              ethers: 342,
            },
            errorRate: {
              ethers: 2.5,
            },
            lastUpdated: new Date(),
          },
        ];
        
        setMigrationStatus(mockStatus);
      }
    };
    
    // Fetch performance comparison data
    const fetchPerformanceData = async () => {
      try {
        const data = await getPerformanceComparison();
        setPerformanceData(data);
      } catch (err) {
        console.error('Error fetching performance comparison:', err);
        // No need to set error state as this is secondary data
      }
    };
    
    // Execute both fetch operations
    fetchMigrationStatus();
    fetchPerformanceData();
    
    // Set up refresh interval
    const refreshInterval = setInterval(() => {
      fetchMigrationStatus();
      fetchPerformanceData();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(refreshInterval);
  }, [trackEvent]);
  
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
    <div className="p-6 max-w-6xl mx-auto">
      {isLoading && !migrationStatus.length ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-lg">Loading migration data...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <p className="mt-2">Showing fallback data.</p>
        </div>
      ) : null}
      
      <h1 className="text-2xl font-bold mb-6">Ethers.js to Wagmi Migration Dashboard</h1>
      
      {/* Overall progress */}
      <div className="bg-white rounded-lg p-6 shadow-md mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Overall Progress</h2>
          {apiData?.overall && (
            <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {apiData.overall.completionPercentage}% complete
            </div>
          )}
        </div>
        
        <div className="mb-2 flex justify-between">
          <span>
            {apiData?.overall ? (
              <>{apiData.overall.components.completed} of {apiData.overall.components.total} components migrated</>
            ) : (
              <>{completedCount} of {totalCount} components migrated</>
            )}
          </span>
          <span>{apiData?.overall?.completionPercentage || progressPercentage.toFixed(0)}%</span>
        </div>
        
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500" 
            style={{ width: `${apiData?.overall?.completionPercentage || progressPercentage}%` }}
          ></div>
        </div>
        
        {/* Summary metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="text-sm text-gray-600">Avg. Performance Improvement</div>
            <div className="text-2xl font-bold text-blue-700">
              {apiData?.overall?.metrics.performanceImprovement.toFixed(1) || performanceImprovement.toFixed(1)}%
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="text-sm text-gray-600">Error Rate Reduction</div>
            <div className="text-2xl font-bold text-green-700">
              {apiData?.overall?.metrics.errorRateReduction.toFixed(1) || '0.0'}%
            </div>
          </div>
          <div className="border rounded-lg p-4 bg-indigo-50">
            <div className="text-sm text-gray-600">User Adoption</div>
            <div className="text-2xl font-bold text-indigo-700">
              {apiData?.overall?.metrics.userAdoption.toFixed(1) || '0.0'}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance charts */}
      {performanceData.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Performance Analysis</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceComparisonChart comparisonData={performanceData} />
            <SuccessRateChart comparisonData={performanceData} />
          </div>
        </div>
      )}
      
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
      
      {/* Recent deployments */}
      {apiData?.deployments && apiData.deployments.length > 0 && (
        <div className="mt-8 bg-white rounded-lg p-6 shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Recent Deployments</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-2 px-4 text-left">Date</th>
                  <th className="py-2 px-4 text-left">Environment</th>
                  <th className="py-2 px-4 text-left">Features</th>
                  <th className="py-2 px-4 text-left">Performance Score</th>
                </tr>
              </thead>
              <tbody>
                {apiData.deployments.map(deployment => (
                  <tr key={deployment.id} className="border-b border-gray-200">
                    <td className="py-2 px-4">{new Date(deployment.date).toLocaleString()}</td>
                    <td className="py-2 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${deployment.environment === 'production' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {deployment.environment}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      {deployment.features.map(feature => (
                        <span key={feature} className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-1 mb-1">
                          {feature}
                        </span>
                      ))}
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${deployment.metrics.lighthouseScore.performance >= 90 ? 'bg-green-500' : deployment.metrics.lighthouseScore.performance >= 80 ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                        <span>{deployment.metrics.lighthouseScore.performance}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
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
