// Proposal types
export type ProposalStatus = 'active' | 'passed' | 'failed' | 'executed';
export type ProposalType = 'invest' | 'divest';

export interface Proposal {
  id: number;
  title: string;
  description: string;
  type: ProposalType;
  token: string;
  amount: string;
  proposer: string;
  createdAt: string;
  deadline: string;
  forVotes: number | string;
  againstVotes: number | string;
  status: ProposalStatus;
  executed: boolean;
  canceled: boolean;
  endsIn: string;
  readyToExecute?: boolean;
  quorumMet?: boolean;
  totalVotes?: number;
}

export interface CreateProposalParams {
  title: string;
  description: string;
  type: ProposalType;
  amount: number;
  token: string;
  duration: number;
}

// Protocol DAO
export interface ProtocolProposalDetail {
  label: string;
  value: string;
  isHighlighted?: boolean;
}

export interface ProtocolProposal {
  id: number;
  title: string;
  description: string;
  proposer: string;
  createdAt: number;
  updatedAt: number;
  forVotes: number;
  againstVotes: number;
  voteCount: number;
  executed: boolean;
  canceled: boolean;
  status: ProposalStatus;
  endsAt: string;
  endTimeISO?: string; // ISO string format for the countdown timer
  details: ProtocolProposalDetail[];
}

export interface ProtocolMetrics {
  tvl: number;
  tvlChange: number;
  dloopPrice: number;
  priceChange: number;
  activeParticipants: number;
  newParticipants: number;
}

// Leaderboard
export type ParticipantType = 'Human' | 'AI Node';

export interface Participant {
  address: string;
  name?: string;
  type: ParticipantType;
  votingPower: number;
  accuracy: number;
  isCurrentUser?: boolean;
}

export interface Delegation {
  id: string;
  from: string;
  to: string;
  toName?: string;
  toType: ParticipantType;
  amount: number;
  date: number;
}

// AI Nodes
export interface AINodeActivity {
  title: string;
  date: string;
  status: string;
}

export interface AINodeTradingThesis {
  description: string;
  points: string[];
  conclusion: string;
}

export interface AINode {
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
  tradingThesis: AINodeTradingThesis;
  recentActivity: AINodeActivity[];
}

export interface AINodePerformance {
  totalDelegated: number;
  delegationChange: number;
  averagePerformance: number;
  performanceDelta: number;
  newNodes: number;
}