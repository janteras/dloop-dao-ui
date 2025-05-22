import { renderHook, act } from '@testing-library/react';
import { BigNumber } from '@ethersproject/bignumber';
import { useUnifiedProposalList } from '../useUnifiedProposals';
import { useUnifiedAINodes } from '../useUnifiedAINodes';
import { useUnifiedProtocolDAO } from '../useUnifiedProtocolDAO';
import { useUnifiedTokenInfo } from '../useUnifiedTokenInfo';
import { useUnifiedVoting } from '../useUnifiedVoting';
import { Web3Implementation } from '@/types/web3-types';
import { monitorMigrationHealth } from '@/lib/migration-monitoring';

// Mock dependencies
jest.mock('@/config/app-config', () => ({
  useAppConfig: jest.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({ 
        useWagmi: false, 
        migratedComponents: [],
        markComponentMigrated: jest.fn(),
        featureFlags: {
          useWagmiProposals: false,
          useWagmiTokens: false,
          useWagmiVoting: false
        }
      });
    }
    return undefined;
  }),
}));

// Mock Wagmi hooks
jest.mock('wagmi', () => ({
  useReadContract: jest.fn().mockReturnValue({
    data: '100',
    isLoading: false,
    error: null,
  }),
  useWriteContract: jest.fn().mockReturnValue({
    writeContractAsync: jest.fn().mockResolvedValue('0xhash'),
    data: '0xhash',
    error: null,
  }),
  useToken: jest.fn().mockReturnValue({
    data: {
      name: 'Test Token',
      symbol: 'TEST',
      decimals: 18,
      totalSupply: { formatted: '1000000', value: BigNumber.from('1000000000000000000000000') }
    },
    isLoading: false,
    error: null
  }),
}));

// Mock migration monitoring
jest.mock('@/lib/migration-monitoring', () => ({
  monitorMigrationHealth: jest.fn(),
}));

// Mock useUnifiedWallet
jest.mock('../useUnifiedWallet', () => ({
  useUnifiedWallet: jest.fn(() => ({
    isConnected: true,
    address: '0x1234567890123456789012345678901234567890',
    provider: {},
    signer: {},
  }))
}));

describe('Unified Hooks Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useUnifiedProposalList', () => {
    it('should return proposal data with ethers implementation', async () => {
      const mockProposals = [
        { id: '1', title: 'Proposal 1', status: 'active' },
        { id: '2', title: 'Proposal 2', status: 'executed' }
      ];
      
      // Mock the ethers implementation
      jest.mock('../useProposals', () => ({
        useProposals: jest.fn(() => ({
          proposals: mockProposals,
          isLoading: false,
          error: null,
          refetchProposals: jest.fn()
        }))
      }));
      
      const { result } = renderHook(() => useUnifiedProposalList());
      
      expect(result.current.proposals).toEqual(mockProposals);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(monitorMigrationHealth).toHaveBeenCalledWith(
        'ProposalList',
        Web3Implementation.ETHERS,
        expect.any(Object)
      );
    });
  });
  
  describe('useUnifiedAINodes', () => {
    it('should return AI nodes data with ethers implementation', async () => {
      const mockNodes = [
        { id: '1', name: 'AI Node 1', status: 'active' },
        { id: '2', name: 'AI Node 2', status: 'inactive' }
      ];
      
      // Mock the ethers implementation
      jest.mock('../useAINodes', () => ({
        useAINodes: jest.fn(() => ({
          nodes: mockNodes,
          isLoading: false,
          error: null,
          refetchNodes: jest.fn()
        }))
      }));
      
      const { result } = renderHook(() => useUnifiedAINodes());
      
      expect(result.current.nodes).toEqual(mockNodes);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(monitorMigrationHealth).toHaveBeenCalledWith(
        'AINodes',
        Web3Implementation.ETHERS,
        expect.any(Object)
      );
    });
  });
  
  describe('useUnifiedProtocolDAO', () => {
    it('should return protocol data with ethers implementation', async () => {
      const mockProtocolData = {
        name: 'Test Protocol',
        treasury: '1000',
        proposalCount: 5
      };
      
      // Mock the ethers implementation
      jest.mock('../useProtocolDAO', () => ({
        useProtocolDAO: jest.fn(() => ({
          protocolData: mockProtocolData,
          isLoading: false,
          error: null,
          refetchProtocolData: jest.fn()
        }))
      }));
      
      const { result } = renderHook(() => useUnifiedProtocolDAO());
      
      expect(result.current.protocolData).toEqual(mockProtocolData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(monitorMigrationHealth).toHaveBeenCalledWith(
        'ProtocolDAO',
        Web3Implementation.ETHERS,
        expect.any(Object)
      );
    });
  });
  
  describe('useUnifiedTokenInfo', () => {
    it('should return token info with ethers implementation', async () => {
      const mockTokenInfo = {
        name: 'Test Token',
        symbol: 'TEST',
        decimals: 18,
        totalSupply: '1000000'
      };
      
      // Mock the ethers implementation
      jest.mock('../useTokenInfo', () => ({
        useTokenInfo: jest.fn(() => ({
          tokenInfo: mockTokenInfo,
          isLoading: false,
          error: null,
          refetchTokenInfo: jest.fn()
        }))
      }));
      
      const { result } = renderHook(() => useUnifiedTokenInfo('0xtoken'));
      
      expect(result.current.tokenInfo).toEqual(mockTokenInfo);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(monitorMigrationHealth).toHaveBeenCalledWith(
        'TokenInfo',
        Web3Implementation.ETHERS,
        expect.any(Object)
      );
    });
  });
  
  describe('useUnifiedVoting', () => {
    it('should return voting data with ethers implementation', async () => {
      const mockVotingData = {
        hasVoted: false,
        canVote: true,
        votingPower: '100'
      };
      
      // Mock the ethers implementation
      jest.mock('../useVoting', () => ({
        useVoting: jest.fn(() => ({
          votingData: mockVotingData,
          isLoading: false,
          error: null,
          castVote: jest.fn(),
          refetchVotingData: jest.fn()
        }))
      }));
      
      const { result } = renderHook(() => useUnifiedVoting('1'));
      
      expect(result.current.votingData).toEqual(mockVotingData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(typeof result.current.castVote).toBe('function');
      expect(monitorMigrationHealth).toHaveBeenCalledWith(
        'Voting',
        Web3Implementation.ETHERS,
        expect.any(Object)
      );
    });
  });
});
