import { renderHook, act } from '@testing-library/react';
import { useUnifiedAssetDaoContract } from '../unified/useUnifiedAssetDaoContract';
import { useAppConfig, MigrationFeatureFlag } from '../../config/app-config';
import { useUnifiedContract } from '../useUnifiedContract';
import { useMigrationTelemetry } from '../useMigrationTelemetry';
import { ProposalState, ProposalType } from '../../services/enhanced-assetDaoService';

// Mock dependencies
jest.mock('../../config/app-config', () => ({
  useAppConfig: jest.fn(),
  MigrationFeatureFlag: {
    ASSET_DAO: 'useWagmiAssetDao'
  }
}));

jest.mock('../useUnifiedContract', () => ({
  useUnifiedContract: jest.fn()
}));

jest.mock('../useMigrationTelemetry', () => ({
  useMigrationTelemetry: jest.fn()
}));

describe('useUnifiedAssetDaoContract Hook', () => {
  // Default test values
  const contractAddress = '0xa87e662061237a121Ca2E83E77dA8251bc4B3529';
  
  // Mock proposal data
  const mockProposal = {
    id: 1,
    title: 'Test Proposal',
    description: 'This is a test proposal',
    proposer: '0x1234567890123456789012345678901234567890',
    amount: 1000,
    token: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    proposalType: 0, // Investment
    yesVotes: 100,
    noVotes: 50,
    abstainVotes: 10,
    executed: false,
    canceled: false
  };
  
  // Mock governance params
  const mockGovernanceParams = {
    quorum: 100,
    votingPeriod: 7200,
    executionDelay: 1800
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    (useMigrationTelemetry as jest.Mock).mockReturnValue({
      recordSuccess: jest.fn(),
      recordError: jest.fn(),
      data: {}
    });
  });

  describe('Ethers Implementation', () => {
    beforeEach(() => {
      // Set useWagmiAssetDao flag to false
      (useAppConfig as jest.Mock).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          const state = {
            featureFlags: {
              [MigrationFeatureFlag.ASSET_DAO]: false
            },
            markComponentMigrated: jest.fn()
          };
          return selector(state);
        }
        return undefined;
      });
      
      // Mock useUnifiedContract for Ethers implementation
      (useUnifiedContract as jest.Mock).mockReturnValue({
        read: jest.fn(),
        write: jest.fn(),
        implementation: 'ethers'
      });
    });

    test('should use Ethers implementation when flag is off', () => {
      const { result } = renderHook(() => useUnifiedAssetDaoContract());
      
      expect(result.current.implementation).toBe('ethers');
      expect(useUnifiedContract).toHaveBeenCalledWith(
        contractAddress,
        expect.anything()
      );
    });

    test('should call getProposal with correct parameters', async () => {
      const mockRead = jest.fn();
      mockRead.mockImplementation((functionName, args) => {
        if (functionName === 'getProposal' && args?.[0] === 1) {
          return Promise.resolve(mockProposal);
        }
        if (functionName === 'getProposalState' && args?.[0] === 1) {
          return Promise.resolve(ProposalState.Active);
        }
        return Promise.resolve(null);
      });
      
      (useUnifiedContract as jest.Mock).mockReturnValue({
        read: mockRead,
        write: jest.fn(),
        implementation: 'ethers'
      });
      
      const { result } = renderHook(() => useUnifiedAssetDaoContract());
      
      let proposal;
      await act(async () => {
        proposal = await result.current.getProposal(1);
      });
      
      expect(mockRead).toHaveBeenCalledWith('getProposal', [1]);
      expect(mockRead).toHaveBeenCalledWith('getProposalState', [1]);
      expect(proposal).toMatchObject({
        id: 1,
        title: 'Test Proposal',
        type: ProposalType.Investment,
        state: ProposalState.Active
      });
    });

    test('should call getProposals with pagination', async () => {
      const mockRead = jest.fn();
      // Mock getProposalCount to return 3
      mockRead.mockImplementation((functionName, args) => {
        if (functionName === 'getProposalCount') {
          return Promise.resolve(3);
        }
        if (functionName === 'getProposal') {
          const id = args?.[0];
          return Promise.resolve({
            ...mockProposal,
            id
          });
        }
        if (functionName === 'getProposalState') {
          return Promise.resolve(ProposalState.Active);
        }
        return Promise.resolve(null);
      });
      
      (useUnifiedContract as jest.Mock).mockReturnValue({
        read: mockRead,
        write: jest.fn(),
        implementation: 'ethers'
      });
      
      const { result } = renderHook(() => useUnifiedAssetDaoContract());
      
      let proposals;
      await act(async () => {
        proposals = await result.current.getProposals({ limit: 2, offset: 0 });
      });
      
      expect(mockRead).toHaveBeenCalledWith('getProposalCount');
      expect(mockRead).toHaveBeenCalledWith('getProposal', [0]);
      expect(mockRead).toHaveBeenCalledWith('getProposal', [1]);
      expect(mockRead).not.toHaveBeenCalledWith('getProposal', [2]);
      expect(proposals).toHaveLength(2);
    });

    test('should call voteOnProposal with correct parameters', async () => {
      const mockWrite = jest.fn().mockResolvedValue('0xtransactionhash');
      
      (useUnifiedContract as jest.Mock).mockReturnValue({
        read: jest.fn(),
        write: mockWrite,
        implementation: 'ethers'
      });
      
      const { result } = renderHook(() => useUnifiedAssetDaoContract());
      
      let txHash;
      await act(async () => {
        txHash = await result.current.voteOnProposal(1, true);
      });
      
      expect(mockWrite).toHaveBeenCalledWith('vote', [1, true]);
      expect(txHash).toBe('0xtransactionhash');
    });

    test('should call getGovernanceParams correctly', async () => {
      const mockRead = jest.fn();
      mockRead.mockImplementation((functionName) => {
        if (functionName === 'quorum') {
          return Promise.resolve(mockGovernanceParams.quorum);
        }
        if (functionName === 'votingPeriod') {
          return Promise.resolve(mockGovernanceParams.votingPeriod);
        }
        if (functionName === 'executionDelay') {
          return Promise.resolve(mockGovernanceParams.executionDelay);
        }
        return Promise.resolve(null);
      });
      
      (useUnifiedContract as jest.Mock).mockReturnValue({
        read: mockRead,
        write: jest.fn(),
        implementation: 'ethers'
      });
      
      const { result } = renderHook(() => useUnifiedAssetDaoContract());
      
      let params;
      await act(async () => {
        params = await result.current.getGovernanceParams();
      });
      
      expect(mockRead).toHaveBeenCalledWith('quorum');
      expect(mockRead).toHaveBeenCalledWith('votingPeriod');
      expect(mockRead).toHaveBeenCalledWith('executionDelay');
      expect(params).toEqual(mockGovernanceParams);
    });
  });

  describe('Wagmi Implementation', () => {
    beforeEach(() => {
      // Set useWagmiAssetDao flag to true
      (useAppConfig as jest.Mock).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          const state = {
            featureFlags: {
              [MigrationFeatureFlag.ASSET_DAO]: true
            },
            markComponentMigrated: jest.fn()
          };
          return selector(state);
        }
        return undefined;
      });
      
      // Mock useUnifiedContract for Wagmi implementation
      (useUnifiedContract as jest.Mock).mockReturnValue({
        read: jest.fn(),
        write: jest.fn(),
        implementation: 'wagmi'
      });
    });

    test('should use Wagmi implementation when flag is on', () => {
      const { result } = renderHook(() => useUnifiedAssetDaoContract());
      
      expect(result.current.implementation).toBe('wagmi');
      expect(useUnifiedContract).toHaveBeenCalledWith(
        contractAddress,
        expect.anything()
      );
    });

    test('should call getProposal with correct parameters using Wagmi', async () => {
      const mockRead = jest.fn();
      mockRead.mockImplementation((functionName, args) => {
        if (functionName === 'getProposal' && args?.[0] === 1) {
          return Promise.resolve(mockProposal);
        }
        if (functionName === 'getProposalState' && args?.[0] === 1) {
          return Promise.resolve(ProposalState.Active);
        }
        return Promise.resolve(null);
      });
      
      (useUnifiedContract as jest.Mock).mockReturnValue({
        read: mockRead,
        write: jest.fn(),
        implementation: 'wagmi'
      });
      
      const { result } = renderHook(() => useUnifiedAssetDaoContract());
      
      let proposal;
      await act(async () => {
        proposal = await result.current.getProposal(1);
      });
      
      expect(mockRead).toHaveBeenCalledWith('getProposal', [1]);
      expect(mockRead).toHaveBeenCalledWith('getProposalState', [1]);
      expect(proposal).toMatchObject({
        id: 1,
        title: 'Test Proposal',
        type: ProposalType.Investment,
        state: ProposalState.Active
      });
    });

    test('should record telemetry for successful operations', async () => {
      const mockTelemetry = {
        recordSuccess: jest.fn(),
        recordError: jest.fn(),
        data: {}
      };
      
      (useMigrationTelemetry as jest.Mock).mockReturnValue(mockTelemetry);
      
      const mockRead = jest.fn().mockResolvedValue(mockProposal);
      
      (useUnifiedContract as jest.Mock).mockReturnValue({
        read: mockRead,
        write: jest.fn(),
        implementation: 'wagmi'
      });
      
      const { result } = renderHook(() => useUnifiedAssetDaoContract());
      
      await act(async () => {
        await result.current.getProposal(1);
      });
      
      expect(mockTelemetry.recordSuccess).toHaveBeenCalledWith(
        'getProposal',
        expect.any(Number)
      );
    });

    test('should record telemetry for failed operations', async () => {
      const mockTelemetry = {
        recordSuccess: jest.fn(),
        recordError: jest.fn(),
        data: {}
      };
      
      (useMigrationTelemetry as jest.Mock).mockReturnValue(mockTelemetry);
      
      const mockError = new Error('Contract call failed');
      const mockRead = jest.fn().mockRejectedValue(mockError);
      
      (useUnifiedContract as jest.Mock).mockReturnValue({
        read: mockRead,
        write: jest.fn(),
        implementation: 'wagmi'
      });
      
      const { result } = renderHook(() => useUnifiedAssetDaoContract());
      
      await act(async () => {
        try {
          await result.current.getProposal(1);
        } catch (error) {
          // Expected error, ignore
        }
      });
      
      expect(mockTelemetry.recordError).toHaveBeenCalledWith(
        'getProposal',
        mockError,
        expect.any(Number)
      );
    });

    test('should override implementation with options parameter', () => {
      const { result } = renderHook(() => 
        useUnifiedAssetDaoContract({ implementation: 'ethers' })
      );
      
      expect(result.current.implementation).toBe('ethers');
    });
  });
});
