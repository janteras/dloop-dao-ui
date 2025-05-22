import { renderHook, act } from '@testing-library/react-hooks';
import { useUnifiedContract } from '../useUnifiedContract';
import { useSubscribeToEvents } from '../useRealTimeEvents.new';
import { EventCategory, EventType } from '../../services/realTimeEventService';
import { BigNumber } from '@ethersproject/bignumber';
import { ethers } from 'ethers';

// Mock dependencies
jest.mock('../../config/app-config', () => ({
  useAppConfig: jest.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({ useWagmi: false, markComponentMigrated: jest.fn() });
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
  useSimulateContract: jest.fn().mockReturnValue({
    data: {},
    error: null,
  }),
}));

// Mock real-time event service
jest.mock('../../services/realTimeEventService', () => {
  const originalModule = jest.requireActual('../../services/realTimeEventService');
  
  return {
    ...originalModule,
    realTimeEventService: {
      initialize: jest.fn(),
      subscribe: jest.fn(() => 'mock-subscription-id'),
      unsubscribe: jest.fn(),
      addEventListener: jest.fn(() => 'mock-listener-id'),
      removeEventListener: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      getStatus: jest.fn(() => 'connected'),
    },
    EventCategory: originalModule.EventCategory,
    EventType: originalModule.EventType,
  };
});

// Mock unified wallet
jest.mock('../useUnifiedWallet', () => ({
  useUnifiedWallet: jest.fn().mockReturnValue({
    signer: {},
    provider: {},
    isConnected: true,
    address: '0x1234567890123456789012345678901234567890',
  }),
}));

// Sample ABI for testing
const testAbi = [
  {
    inputs: [],
    name: 'getCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'newCount', type: 'uint256' }],
    name: 'setCount',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'proposer', type: 'address' },
      { indexed: true, name: 'proposalId', type: 'uint256' },
      { indexed: false, name: 'description', type: 'string' },
    ],
    name: 'ProposalCreated',
    type: 'event',
  },
];

describe('Contract and Event Integration Tests', () => {
  const contractAddress = '0x1234567890123456789012345678901234567890';
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('should support contract read and event subscription together', async () => {
    // Mock the contract instance for Ethers
    const mockContractInstance = {
      getCount: jest.fn().mockResolvedValue(BigNumber.from(42)),
    };
    
    jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContractInstance as any);
    
    // Setup both hooks
    const { result: contractResult } = renderHook(() => useUnifiedContract(contractAddress, testAbi));
    const { result: eventResult } = renderHook(() => useSubscribeToEvents({
      categories: [EventCategory.PROPOSALS],
      addresses: [contractAddress],
    }));
    
    // Read from contract
    let readResult;
    await act(async () => {
      readResult = await contractResult.current.read('getCount');
    });
    
    // Check contract read result
    expect(mockContractInstance.getCount).toHaveBeenCalled();
    expect(readResult).toEqual(BigNumber.from(42));
    
    // Verify event subscription was set up
    const { realTimeEventService } = require('../../services/realTimeEventService');
    expect(realTimeEventService.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: [EventCategory.PROPOSALS],
        addresses: [contractAddress],
      })
    );
    
    // Simulate an event being received
    act(() => {
      // Get the event handler by checking the calls to addEventListener
      const onEventHandler = realTimeEventService.addEventListener.mock.calls[0][1];
      
      // Simulate an event
      onEventHandler({
        id: 'event-1',
        type: EventType.PROPOSAL_CREATED,
        category: EventCategory.PROPOSALS,
        timestamp: Date.now(),
        data: { proposalId: '123' },
      });
    });
    
    // Verify event was processed
    expect(eventResult.current.events).toHaveLength(1);
    expect(eventResult.current.events[0].type).toBe(EventType.PROPOSAL_CREATED);
  });
  
  test('should support contract write operations with event handling', async () => {
    // Mock the transaction
    const mockTx = {
      wait: jest.fn().mockResolvedValue({ hash: '0xmockhash' }),
    };
    
    // Mock the ethers contract instance
    const mockContractInstance = {
      setCount: jest.fn().mockResolvedValue(mockTx),
    };
    
    jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContractInstance as any);
    
    // Setup both hooks
    const { result: contractResult } = renderHook(() => useUnifiedContract(contractAddress, testAbi));
    const { result: eventResult } = renderHook(() => useSubscribeToEvents({
      categories: [EventCategory.PROPOSALS],
      addresses: [contractAddress],
    }));
    
    // Write to contract
    let writeResult;
    await act(async () => {
      writeResult = await contractResult.current.write('setCount', [123]);
    });
    
    // Check contract write result
    expect(mockContractInstance.setCount).toHaveBeenCalledWith(123);
    expect(mockTx.wait).toHaveBeenCalled();
    expect(writeResult).toBe('0xmockhash');
    
    // Verify that we can clear and unsubscribe from events
    act(() => {
      eventResult.current.clearEvents();
    });
    
    expect(eventResult.current.events).toHaveLength(0);
    
    act(() => {
      eventResult.current.unsubscribe();
    });
    
    const { realTimeEventService } = require('../../services/realTimeEventService');
    expect(realTimeEventService.unsubscribe).toHaveBeenCalled();
  });
  
  test('should handle contract errors gracefully', async () => {
    // Mock the ethers contract instance with error
    const mockError = new Error('Contract read failed');
    const mockContractInstance = {
      getCount: jest.fn().mockRejectedValue(mockError),
    };
    
    jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContractInstance as any);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Setup contract hook
    const { result: contractResult } = renderHook(() => useUnifiedContract(contractAddress, testAbi));
    
    // Attempt to read from contract
    await expect(contractResult.current.read('getCount')).rejects.toThrow('Contract read failed');
    expect(console.error).toHaveBeenCalled();
    
    // Verify event subscription still works even after contract error
    const { result: eventResult } = renderHook(() => useSubscribeToEvents({
      categories: [EventCategory.PROPOSALS],
      addresses: [contractAddress],
    }));
    
    const { realTimeEventService } = require('../../services/realTimeEventService');
    expect(realTimeEventService.subscribe).toHaveBeenCalled();
    
    // Event system should continue to work
    expect(eventResult.current.isSubscribed).toBe(true);
  });
});
