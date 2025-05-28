// Contract addresses from the Sepolia testnet deployment (as of 2025-04-27 Phase 4 deployment)
export const ADDRESSES = {
  SoulboundNFT: '0x6391C14631b2Be5374297fA3110687b80233104c',
  DLoopToken: '0x05B366778566e93abfB8e4A9B794e4ad006446b4',
  ProtocolDAO: '0x012e4042ab5F55A556a8B453aBeC852D9466aFb0',
  Treasury: '0x476aAF510540F4c755cCe7E0FAaC7560b5D711F4',
  AINodeRegistry: '0x0045c7D99489f1d8A5900243956B0206344417DD',
  PriceOracle: '0x3D3aEA9D8ad748398a55bf0f7f9832498758f92a',
  GovernanceRewards: '0x295e6f4644AcC2b0bB762bBE1bba86F08D8b85f2',
  AssetDAO: '0xa87e662061237a121Ca2E83E77dA8251bc4B3529',
  ChainlinkPriceOracle: '0xa1A0B6F1a771faBe3a3963b922bf6ea1D4F7bb1b',
  AINodeGovernance: '0x28fe6eA0D91D5Ca8C080E727cdEb02B2B740f458',
  FeeCalculator: '0x0EB08c64dB39286680B89B548e7A545708F48adf',
  FeeProcessor: '0x96664603DDFB16DfaF3Ea329216Dd461AcfEffaA',
  PriceOracleAdapter: '0x680b8aec7012a2F70be0a131579e851A5114Db50',
  SoulboundNFTAdapter: '0xA114f53B7Ad1c21b8808C54790cDC0221F8496B2',
  SimplifiedAdminControls: '0x8ecA689EbcD3f7FEE94043AD145E15b3736486c6',
  TokenApprovalOptimizer: '0x603aa2e89A2c356bFA0220ECCcBA0168a9220C28',
  TokenOptimizer: '0x564ef9D80e883fEF98ae248580C6f167Eb725A62',
};

// Constants for network configuration
export const NETWORK_CONFIG = {
  // Sepolia testnet
  chainId: '0xaa36a7', // 11155111 in decimal
  chainName: 'Sepolia Testnet',
  rpcUrls: ['https://sepolia.infura.io/v3/'], // This will be set at runtime with the proper key
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18,
  },
};

// ABIs for the contracts we'll be interacting with
export const ABIS = {
  // Minimal ABIs for the DLoopToken
  DLoopToken: [
    // Read-only functions
    "function balanceOf(address owner) view returns (uint256)",
    "function totalSupply() view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function name() view returns (string)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function getDelegatedAmount(address delegator, address delegatee) external view returns (uint256)",
    
    // State-changing functions
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",
    "function delegateTokens(address delegatee, uint256 amount) external",
    "function undelegateTokens(address delegatee, uint256 amount) external",
    
    // Events
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event Approval(address indexed owner, address indexed spender, uint256 value)",
    "event TokensDelegated(address indexed delegator, address indexed delegatee, uint256 amount)",
    "event TokensUndelegated(address indexed delegator, address indexed delegatee, uint256 amount)"
  ],
  
  // Minimal ABI for the ProtocolDAO
  ProtocolDAO: [
    // Read-only functions
    "function proposals(uint256) view returns (uint256 id, string description, address proposer, uint256 createdAt, uint256 votingEnds, uint256 forVotes, uint256 againstVotes, bool executed, bool canceled)",
    "function nodeRegistry() view returns (address)",
    "function getProposalCount() view returns (uint256)",
    "function ADMIN_ROLE() view returns (bytes32)",
    
    // State-changing functions
    "function createProposal(string memory description, address[] memory targets, uint256[] memory values, bytes[] memory calldatas) external returns (uint256)",
    "function castVote(uint256 proposalId, bool support) external",
    "function executeProposal(uint256 proposalId) external",
    "function rageQuit(address userAddress) external",
    
    // Events
    "event ProposalCreated(uint256 proposalId, address proposer, string description)",
    "event VoteCast(address voter, uint256 proposalId, bool support, uint256 weight)",
    "event ProposalExecuted(uint256 proposalId)",
    "event ProposalCanceled(uint256 proposalId)",
    "event RageQuitExecuted(address user, uint256 amount)"
  ],
  
  // Minimal ABI for the AssetDAO
  AssetDAO: [
    // Read-only functions
    "function proposals(uint256) view returns (uint256 id, string description, address proposer, uint256 createdAt, uint256 votingEnds, uint256 forVotes, uint256 againstVotes, bool executed, bool canceled, uint8 proposalType, address asset, uint256 amount)",
    "function getProposalCount() view returns (uint256)",
    "function governanceToken() view returns (address)",
    "function votingPeriod() view returns (uint256)",
    
    // State-changing functions
    "function createInvestProposal(string memory description, address asset, uint256 amount) external returns (uint256)",
    "function createDivestProposal(string memory description, address asset, uint256 amount) external returns (uint256)",
    "function castVote(uint256 proposalId, bool support) external",
    "function executeProposal(uint256 proposalId) external",
    
    // Events
    "event ProposalCreated(uint256 proposalId, address proposer, string description, uint8 proposalType, address asset, uint256 amount)",
    "event VoteCast(address voter, uint256 proposalId, bool support, uint256 weight)",
    "event ProposalExecuted(uint256 proposalId)",
    "event ProposalCanceled(uint256 proposalId)"
  ],
  
  // Minimal ABI for AINodeRegistry
  AINodeRegistry: [
    // Read-only functions
    "function getNodeCount() view returns (uint256)",
    "function getNodeAddress(uint256 nodeId) view returns (address)",
    "function getNodeDetails(address nodeAddress) view returns (string memory name, string memory strategy, uint256 delegatedAmount, uint256 accuracy, uint256 performance, uint256 proposalsCreated, uint256 proposalsPassed)",
    
    // Events
    "event NodeRegistered(address indexed nodeAddress, string name)",
    "event NodeUpdated(address indexed nodeAddress, string name)"
  ]
};

// Export a contracts object for easier access
export const contracts = {
  DLoopToken: {
    address: ADDRESSES.DLoopToken,
    abi: ABIS.DLoopToken
  },
  ProtocolDAO: {
    address: ADDRESSES.ProtocolDAO,
    abi: ABIS.ProtocolDAO
  },
  AssetDAO: {
    address: ADDRESSES.AssetDAO,
    abi: ABIS.AssetDAO
  },
  AINodeRegistry: {
    address: ADDRESSES.AINodeRegistry,
    abi: ABIS.AINodeRegistry
  }
};