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
    "function getDelegatedAmount(address delegator, address delegatee) view returns (uint256)",
    "function getTotalDelegatedAmount(address delegator) view returns (uint256)",
    "function getTotalDelegatedToAmount(address delegatee) view returns (uint256)",

    // State-changing functions
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function delegateTokens(address delegatee, uint256 amount) external",
    "function withdrawDelegation(address delegatee, uint256 amount) external",
    "function transferFrom(address from, address to, uint256 amount) returns (bool)",

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

  // Updated ABI for the AssetDAO with complete functionality aligned with on-chain contract
  AssetDAO: [
    // Asset management functions (view)
    "function getAssetCount() view returns (uint256)",
    "function getAssetDetails(uint256 assetId) view returns (uint256 id, string name, string symbol, address token, uint256 totalShares, uint8 state, uint256 createdAt, uint256 updatedAt)",
    "function getAssetState(uint256 assetId) view returns (uint8)",
    "function getAssetInvestors(uint256 assetId) view returns (address[])",
    "function getInvestorShares(uint256 assetId, address investor) view returns (uint256)",
    "function assetExists(uint256 assetId) view returns (bool)",

    // Asset management functions (state-changing)
    "function createAsset(string memory name, string memory symbol) returns (uint256)",
    "function invest(uint256 assetId, uint256 amount)",
    "function divest(uint256 assetId, uint256 amount)",
    "function updateAssetState(uint256 assetId, uint8 newState)",
    "function rageQuit(uint256 assetId, uint256 shares)",

    // Core functions (view)
    "function getProposalCount() view returns (uint256)",
    "function getProposal(uint256 proposalId) view returns (uint256 id, uint8 proposalType, address token, uint256 amount, string description, address proposer, uint256 createdAt, uint256 votingEnds, uint256 forVotes, uint256 againstVotes, uint8 state, bool executed)",
    "function hasVoted(uint256 proposalId, address voter) view returns (bool)",
    "function votingPeriod() view returns (uint256)",
    "function executionDelay() view returns (uint256)",
    "function quorum() view returns (uint256)",
    "function proposalCounter() view returns (uint256)",
    "function minProposalStake() view returns (uint256)",

    // DAO configuration
    "function dloopToken() view returns (address)",
    "function priceOracle() view returns (address)",
    "function feeProcessor() view returns (address)",
    "function governanceRewards() view returns (address)",
    "function protocolDAO() view returns (address)",
    "function owner() view returns (address)",
    "function admin() view returns (address)",
    "function paused() view returns (bool)",

    // Supported assets management
    "function supportedAssets(address) view returns (bool)",
    "function getSupportedAssets() view returns (address[])",
    "function addSupportedAsset(address assetAddress)",
    "function removeSupportedAsset(address assetAddress)",

    // Governance functions
    "function createProposal(uint8 proposalType, address token, uint256 amount, string memory description) returns (uint256)",
    "function vote(uint256 proposalId, bool support)",
    "function executeProposal(uint256 proposalId)",
    "function cancelProposal(uint256 proposalId)",

    // Events
    "event ProposalCreated(uint256 indexed proposalId, uint8 proposalType, address token, uint256 amount, string description, address indexed proposer)",
    "event VoteCast(address indexed voter, uint256 indexed proposalId, bool support, uint256 weight)",
    "event ProposalExecuted(uint256 indexed proposalId)",
    "event ProposalCanceled(uint256 indexed proposalId)",
    "event AssetCreated(uint256 indexed assetId, string name, string symbol)",
    "event AssetStateUpdated(uint256 indexed assetId, uint8 oldState, uint8 newState)",
    "event Invested(uint256 indexed assetId, address indexed investor, uint256 amount, uint256 shares)",
    "event Divested(uint256 indexed assetId, address indexed investor, uint256 shares, uint256 amount)"
  ],

  // Minimal ABI for AINodeRegistry
  AINodeRegistry: [
    // Read-only functions
    "function getNodeCount() view returns (uint256)",
    "function getNodeAddress(uint256 nodeId) view returns (address)",
    "function getNodeDetails(address nodeAddress) view returns (string memory name, string memory strategy, uint256 delegatedAmount, uint256 accuracy, uint256 performance, uint256 proposalsCreated, uint256 proposalsPassed)",
    "function getNodeSoulboundTokenId(address nodeAddress) view returns (uint256)",
    "function getSoulboundNFTAddress() view returns (address)",

    // Events
    "event NodeRegistered(address indexed nodeAddress, string name)",
    "event NodeUpdated(address indexed nodeAddress, string name)"
  ],

  // SoulboundNFT contract ABI
  SoulboundNFT: [
    // View functions
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function getTokenDetails(uint256 tokenId) view returns (address tokenOwner, string uri, uint256 mintedAt, bool revoked)",
    "function getTokensByOwner(address ownerAddress) view returns (uint256[])",
    "function isTokenValid(uint256 tokenId) view returns (bool)",
    "function hasValidToken(address ownerAddress) view returns (bool)",
    "function getTokenCount() view returns (uint256)",

    // Events
    "event TokenMinted(uint256 indexed tokenId, address indexed to, string uri)",
    "event TokenRevoked(uint256 indexed tokenId, address indexed owner)",
    "event TokenURIUpdated(uint256 indexed tokenId, string oldURI, string newURI)",
    "event VoteDelegated(address indexed from, address indexed to, uint256 expiryTime)"
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
  },
  SoulboundNFT: {
    address: ADDRESSES.SoulboundNFT,
    abi: ABIS.SoulboundNFT
  }
};

// Contract addresses for Sepolia testnet
export const CONTRACT_ADDRESSES = {
  AssetDAO: '0xa87e662061237a121Ca2E83E77dA8251bc4B3529',
  DLoopToken: '0x05B366778566e93abfB8e4A9B794e4ad006446b4',
  ProtocolDAO: '0x1234567890123456789012345678901234567890', // Placeholder
  AINodeRegistry: '0x1234567890123456789012345678901234567891', // Placeholder
  SoulboundNFT: '0x1234567890123456789012345678901234567892', // Placeholder
} as const;

// Make sure CONTRACT_ADDRESSES is properly exported
export default CONTRACT_ADDRESSES;