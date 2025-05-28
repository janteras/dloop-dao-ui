/**
 * Mock API Data
 * 
 * Provides fallback data for development when API endpoints are not available
 * These mocks match the expected structure from the real API endpoints
 */

// Mock protocol metrics data
export const MOCK_PROTOCOL_METRICS = {
  totalValueLocked: '1000', // 1000 ETH (pre-formatted)
  totalTransactions: 5230,
  activeProposals: 13,
  executedProposals: 12,
  totalProposals: 50,
  uniqueVoters: 156,
  averageVotes: 27.5,
  treasuryBalance: '500', // 500 ETH (pre-formatted)
  lastUpdated: new Date().toISOString(),
};

// Mock proposal data - closely resembles the real API structure
export const MOCK_PROTOCOL_PROPOSALS = Array.from({ length: 50 }, (_, i) => {
  const id = i + 1;
  const isActive = id % 4 === 0;
  const isPassed = id % 4 === 1;
  const isExecuted = id % 4 === 2;
  const isFailed = id % 4 === 3;
  
  // Determine status based on the conditions above
  let status = 'active';
  if (isPassed) status = 'passed';
  if (isExecuted) status = 'executed';
  if (isFailed) status = 'failed';
  
  // Create proposal types alternating between invest and divest
  const proposalType = id % 2 === 0 ? 'invest' : 'divest';
  
  // Set up token addresses - rotate between real tokens
  const tokens = [
    '0x05B366778566e93abfB8e4A9B794e4ad006446b4', // DLOOP
    '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC
    '0xCA063A2AB07491eE991dCecb456D1265f842b568', // WBTC
    '0x0000000000000000000000000000000000000000', // ETH
  ];
  
  // Random timestamp between 30 days ago and now
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const randomPastTimestamp = thirtyDaysAgo + Math.random() * (Date.now() - thirtyDaysAgo);
  const createdAt = new Date(randomPastTimestamp);
  
  // Deadline between now and 30 days in the future
  const thirtyDaysLater = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const randomFutureTimestamp = Date.now() + Math.random() * (thirtyDaysLater - Date.now());
  const deadline = new Date(randomFutureTimestamp);
  
  return {
    id,
    title: `${proposalType === 'invest' ? 'Investment' : 'Divestment'} Proposal #${id}`,
    description: `This is a mock ${proposalType} proposal for testing the AssetDAO interface.`,
    proposer: '0x3639D1F746A977775522221f53D0B1eA5749b8b9',
    type: proposalType,
    token: tokens[id % tokens.length],
    amount: String(id), // Pre-formatted ETH amount
    forVotes: String(id * 0.5), // Pre-formatted for votes
    againstVotes: String(id * 0.2), // Pre-formatted against votes,
    status,
    executed: isExecuted,
    canceled: false,
    createdAt: createdAt.toISOString(),
    deadline: deadline.toISOString(),
    quorumReached: isPassed || isExecuted,
  };
});

// Ensure proposal #53 exists in active tab for testing
// This is to match the console log "Debug - Proposal #53 in Active tab: true"
const proposal53 = {
  id: 53,
  title: 'Important Investment Proposal #53',
  description: 'This is proposal #53 specifically added for testing purposes.',
  proposer: '0x3639D1F746A977775522221f53D0B1eA5749b8b9',
  type: 'invest',
  token: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC
  amount: '2', // 2 ETH (pre-formatted)
  forVotes: '1.5', // 1.5 ETH (pre-formatted)
  againstVotes: '0.5', // 0.5 ETH (pre-formatted)
  status: 'active',
  executed: false,
  canceled: false,
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
  quorumReached: false,
};

// Add proposal #53 to ensure it shows up in active tab
MOCK_PROTOCOL_PROPOSALS.push(proposal53);

export default {
  MOCK_PROTOCOL_METRICS,
  MOCK_PROTOCOL_PROPOSALS
};
