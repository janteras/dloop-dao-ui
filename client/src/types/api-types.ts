/**
 * API Response Types
 * 
 * Comprehensive TypeScript interfaces for all API responses in the D-Loop UI,
 * ensuring type safety and consistent data structures across the application.
 */

/**
 * Base API response structure
 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    pageSize?: number;
    totalItems?: number;
    totalPages?: number;
  };
  error?: {
    message: string;
    code: string;
    details?: Record<string, any>;
  };
}

/**
 * Protocol metrics data structure
 */
export interface ProtocolMetrics {
  totalValueLocked: string;
  totalTransactions: number;
  activeProposals: number;
  executedProposals: number;
  totalProposals: number;
  uniqueVoters: number;
  averageVotes: number;
  treasuryBalance: string;
  lastUpdated: string;
}

/**
 * Base proposal data structure
 */
export interface ProposalBase {
  id: number;
  title: string;
  description: string;
  proposer: string;
  type: 'invest' | 'divest';
  token: string;
  amount: string;
  status: 'active' | 'passed' | 'failed' | 'executed' | 'canceled';
  createdAt: string;
  deadline: string;
}

/**
 * Proposal voting information
 */
export interface ProposalVotingInfo {
  forVotes: string;
  againstVotes: string;
  quorumReached: boolean;
  hasVoted?: boolean;
  support?: boolean;
}

/**
 * Proposal execution information
 */
export interface ProposalExecutionInfo {
  executed: boolean;
  canceled: boolean;
  executedAt?: string;
  executedBy?: string;
  transactionHash?: string;
}

/**
 * Complete proposal data combining base, voting, and execution information
 */
export interface Proposal extends ProposalBase, ProposalVotingInfo, ProposalExecutionInfo {}

/**
 * Asset holding structure for treasury
 */
export interface AssetHolding {
  token: string;
  symbol: string;
  amount: string;
  value: string; // USD value
  price?: string; // Price per token in USD
  change24h?: string; // 24-hour price change percentage
}

/**
 * Treasury data structure
 */
export interface Treasury {
  totalValue: string;
  holdings: AssetHolding[];
  lastUpdated: string;
}

/**
 * Vote data structure
 */
export interface Vote {
  proposalId: number;
  voter: string;
  support: boolean;
  votes: string;
  timestamp: string;
}

/**
 * AI Node base structure
 */
export interface AINodeBase {
  id: string;
  name: string;
  address: string;
  strategy: string;
  delegatedAmount: number;
  accuracy: number;
  performance: number;
  performance90d: number;
  proposalsCreated: number;
  proposalsPassed: number;
}

/**
 * AI Node trading thesis
 */
export interface TradingThesis {
  description: string;
  points: string[];
}

/**
 * AI Node historical performance data point
 */
export interface PerformanceDataPoint {
  date: string;
  value: number;
}

/**
 * AI Node activity item
 */
export interface ActivityItem {
  title: string;
  date: string;
  status: string;
}

/**
 * Complete AI Node data
 */
export interface AINode extends AINodeBase {
  tradingThesis: TradingThesis;
  performanceHistory: PerformanceDataPoint[];
  recentActivity: ActivityItem[];
  soulboundTokenId?: string;
  tokenData?: any;
}

/**
 * User voting power
 */
export interface VotingPower {
  address: string;
  delegatedAmount: string;
  delegatedTo?: string;
  votingHistory: {
    proposalCount: number;
    participationRate: number; // Percentage of proposals voted on
  };
}

/**
 * API telemetry event
 */
export interface ApiTelemetryEvent {
  endpoint: string;
  method: string;
  status: number;
  responseTime: number; // milliseconds
  timestamp: number; // Unix timestamp
  error?: string;
  cached?: boolean;
}

/**
 * Contract telemetry event
 */
export interface ContractTelemetryEvent {
  contractAddress: string;
  contractName: string;
  method: string;
  chainId: number;
  status: 'success' | 'error' | 'pending';
  responseTime?: number; // milliseconds
  timestamp: number; // Unix timestamp
  error?: string;
  gasUsed?: string;
  implementation: 'ethers' | 'wagmi';
}

/**
 * Migration telemetry metrics
 */
export interface MigrationMetrics {
  component: string;
  implementation: 'ethers' | 'wagmi' | 'hybrid';
  responseTime: number; // milliseconds
  status: 'success' | 'error' | 'pending' | 'completed';
  timestamp: number; // Unix timestamp
  errorCount?: number;
  requestCount?: number;
}

/**
 * Telemetry summary report
 */
export interface TelemetryReport {
  apiEvents: ApiTelemetryEvent[];
  contractEvents: ContractTelemetryEvent[];
  migrationMetrics: MigrationMetrics[];
  summary: {
    totalApiRequests: number;
    apiSuccessRate: number;
    averageApiResponseTime: number;
    cacheHitRate: number;
    totalContractCalls: number;
    contractSuccessRate: number;
    averageContractResponseTime: number;
    migrationProgress: number; // percentage
  };
  period: {
    start: string;
    end: string;
  };
}

// Response type aliases for better readability
export type ProtocolMetricsResponse = ApiResponse<ProtocolMetrics>;
export type ProposalsResponse = ApiResponse<Proposal[]>;
export type ProposalResponse = ApiResponse<Proposal>;
export type TreasuryResponse = ApiResponse<Treasury>;
export type VotesResponse = ApiResponse<Vote[]>;
export type AINodesResponse = ApiResponse<AINode[]>;
export type AINodeResponse = ApiResponse<AINode>;
export type VotingPowerResponse = ApiResponse<VotingPower>;
export type TelemetryReportResponse = ApiResponse<TelemetryReport>;
