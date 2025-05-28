/**
 * Enhanced AssetDAO Contract Service Tests
 * 
 * Unit tests for the Wagmi implementation of the AssetDAO contract service
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEnhancedAssetDaoContract } from '../enhancedAssetDaoContractService';
import * as wagmi from 'wagmi';
import { BigNumber } from 'ethers';
import { sepolia } from 'wagmi/chains';

// Mock wagmi hooks
vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi');
  return {
    ...actual,
    useContractRead: vi.fn(),
    useContractWrite: vi.fn(),
    useContractEvent: vi.fn(),
    useAccount: vi.fn(),
    useNetwork: vi.fn(),
    usePrepareContractWrite: vi.fn()
  };
});

// Mock app config
vi.mock('@/config/app-config', () => ({
  useAppConfig: () => ({
    recordMetric: vi.fn()
  })
}));

describe('enhancedAssetDaoContractService', () => {
  const mockContractAddress = '0x1234567890123456789012345678901234567890';
  const mockOptions = {
    contractAddress: mockContractAddress,
    chainId: sepolia.id,
    enableTelemetry: false
  };
  
  beforeEach(() => {
    // Mock useAccount
    vi.mocked(wagmi.useAccount).mockReturnValue({
      address: '0xUserAddress',
      isConnected: true,
      isConnecting: false,
      isDisconnected: false,
      isReconnecting: false,
      status: 'connected'
    });
    
    // Mock useNetwork
    vi.mocked(wagmi.useNetwork).mockReturnValue({
      chain: { id: sepolia.id, name: 'Sepolia' },
      chains: [sepolia]
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('useGetAllProposals', () => {
    it('should return empty proposals array when proposal count is 0', async () => {
      // Mock proposal count query
      vi.mocked(wagmi.useContractRead).mockReturnValueOnce({
        data: BigNumber.from(0),
        isLoading: false,
        isSuccess: true,
        error: null,
        refetch: vi.fn(),
        internal: {
          client: {
            readContract: vi.fn()
          }
        }
      });
      
      const { result, waitForNextUpdate } = renderHook(() => {
        const contract = useEnhancedAssetDaoContract(mockOptions);
        return contract.useGetAllProposals();
      });
      
      // Wait for effect to run
      await waitForNextUpdate();
      
      expect(result.current.proposals).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
    
    it('should handle errors when fetching proposal count', async () => {
      const mockError = new Error('Failed to fetch proposal count');
      
      // Mock proposal count query with error
      vi.mocked(wagmi.useContractRead).mockReturnValueOnce({
        data: undefined,
        isLoading: false,
        isSuccess: false,
        error: mockError,
        refetch: vi.fn(),
        internal: {
          client: {
            readContract: vi.fn()
          }
        }
      });
      
      const { result } = renderHook(() => {
        const contract = useEnhancedAssetDaoContract(mockOptions);
        return contract.useGetAllProposals();
      });
      
      expect(result.current.proposals).toEqual([]);
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).toBe(mockError);
    });
    
    it('should fetch and map proposals correctly when count > 0', async () => {
      // Mock proposal count query
      vi.mocked(wagmi.useContractRead).mockReturnValueOnce({
        data: BigNumber.from(2),
        isLoading: false,
        isSuccess: true,
        error: null,
        refetch: vi.fn(),
        internal: {
          client: {
            readContract: vi.fn().mockImplementation(async ({ functionName, args }) => {
              if (functionName === 'getProposal') {
                const proposalId = args[0].toNumber();
                // Return mock proposal data based on ID
                return [
                  `Proposal ${proposalId}`, // title
                  `Description for proposal ${proposalId}`, // description
                  '0xProposerAddress', // proposer
                  '0xTokenAddress', // token address
                  BigNumber.from(1000), // amount
                  BigNumber.from(500), // forVotes
                  BigNumber.from(200), // againstVotes
                  false, // executed
                  false, // canceled
                  BigNumber.from(Date.now() / 1000 - 3600), // startBlock (1 hour ago)
                  BigNumber.from(Date.now() / 1000 + 3600), // endBlock (1 hour from now)
                  BigNumber.from(proposalId % 2) // proposal type (alternating invest/divest)
                ];
              }
              return null;
            })
          }
        }
      });
      
      const { result, waitForNextUpdate } = renderHook(() => {
        const contract = useEnhancedAssetDaoContract(mockOptions);
        return contract.useGetAllProposals();
      });
      
      // Wait for async operations to complete
      await waitForNextUpdate();
      
      expect(result.current.proposals.length).toBe(2);
      expect(result.current.proposals[0].id).toBe(1);
      expect(result.current.proposals[0].title).toBe('Proposal 1');
      expect(result.current.proposals[0].type).toBe('invest');
      expect(result.current.proposals[1].id).toBe(2);
      expect(result.current.proposals[1].type).toBe('divest');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
  
  describe('useGetProposal', () => {
    it('should fetch and map a single proposal correctly', async () => {
      // Mock getProposal query
      vi.mocked(wagmi.useContractRead).mockReturnValueOnce({
        data: [
          'Test Proposal', // title
          'Test Description', // description
          '0xProposerAddress', // proposer
          '0xTokenAddress', // token address
          BigNumber.from(1000), // amount
          BigNumber.from(500), // forVotes
          BigNumber.from(200), // againstVotes
          false, // executed
          false, // canceled
          BigNumber.from(Date.now() / 1000 - 3600), // startBlock (1 hour ago)
          BigNumber.from(Date.now() / 1000 + 3600), // endBlock (1 hour from now)
          BigNumber.from(1) // proposal type (divest)
        ],
        isLoading: false,
        isSuccess: true,
        error: null,
        refetch: vi.fn()
      });
      
      const { result } = renderHook(() => {
        const contract = useEnhancedAssetDaoContract(mockOptions);
        return contract.useGetProposal(1);
      });
      
      expect(result.current.proposal).toBeDefined();
      expect(result.current.proposal?.id).toBe(1);
      expect(result.current.proposal?.title).toBe('Test Proposal');
      expect(result.current.proposal?.type).toBe('divest');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
    
    it('should handle errors when fetching a proposal', async () => {
      const mockError = new Error('Failed to fetch proposal');
      
      // Mock getProposal query with error
      vi.mocked(wagmi.useContractRead).mockReturnValueOnce({
        data: undefined,
        isLoading: false,
        isSuccess: false,
        error: mockError,
        refetch: vi.fn()
      });
      
      const { result } = renderHook(() => {
        const contract = useEnhancedAssetDaoContract(mockOptions);
        return contract.useGetProposal(1);
      });
      
      expect(result.current.proposal).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(mockError);
    });
  });
  
  describe('useCheckVotingStatus', () => {
    it('should return voting status correctly', async () => {
      // Mock hasVoted query
      vi.mocked(wagmi.useContractRead)
        .mockReturnValueOnce({
          data: true,
          isLoading: false,
          isSuccess: true,
          error: null,
          refetch: vi.fn()
        })
        // Mock getVoteReceipt query
        .mockReturnValueOnce({
          data: [true, BigNumber.from(100)], // [support, votes]
          isLoading: false,
          isSuccess: true,
          error: null,
          refetch: vi.fn()
        });
      
      const { result } = renderHook(() => {
        const contract = useEnhancedAssetDaoContract(mockOptions);
        return contract.useCheckVotingStatus(1);
      });
      
      expect(result.current.hasVoted).toBe(true);
      expect(result.current.voteInfo).toBeDefined();
      expect(result.current.voteInfo?.support).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
  
  describe('useProposalState', () => {
    it('should map numeric state to string status', async () => {
      // Mock state query - state 1 = 'passed'
      vi.mocked(wagmi.useContractRead).mockReturnValueOnce({
        data: 1,
        isLoading: false,
        isSuccess: true,
        error: null,
        refetch: vi.fn()
      });
      
      const { result } = renderHook(() => {
        const contract = useEnhancedAssetDaoContract(mockOptions);
        return contract.useProposalState(1);
      });
      
      expect(result.current.state).toBe('passed');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
