import { renderHook, act } from '@testing-library/react-hooks';
import { useSubscribeToEvents, useSubscribeToProposalEvents, useSubscribeToTokenPriceUpdates } from '../useRealTimeEvents.new';
import { EventCategory, EventType, Web3Implementation } from '../../types/web3-types';
import { useAppConfig } from '../../config/app-config';
import { useUnifiedWallet } from '../useUnifiedWallet';

// Mock dependencies
jest.mock('../../config/app-config', () => ({
  useAppConfig: jest.fn(),
}));

jest.mock('../useUnifiedWallet', () => ({
  useUnifiedWallet: jest.fn(),
}));

// Mock the RealTimeEventService
const mockAddEventListener = jest.fn().mockReturnValue('listener-id');
const mockRemoveEventListener = jest.fn();
const mockSubscribe = jest.fn().mockReturnValue({ id: 'subscription-id' });
const mockUnsubscribe = jest.fn();
const mockGetStatus = jest.fn().mockReturnValue('connected');
const mockAddStatusChangeListener = jest.fn();
const mockRemoveStatusChangeListener = jest.fn();
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockInitialize = jest.fn();

// Mock the event service implementation
jest.mock('../../services/RealTimeEventService', () => {
  return {
    RealTimeEventService: jest.fn().mockImplementation(() => {
      return {
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        subscribe: mockSubscribe,
        unsubscribe: mockUnsubscribe,
        getStatus: mockGetStatus,
        addStatusChangeListener: mockAddStatusChangeListener,
        removeStatusChangeListener: mockRemoveStatusChangeListener,
        connect: mockConnect,
        disconnect: mockDisconnect,
        initialize: mockInitialize,
      };
    }),
  };
});

describe('useSubscribeToEvents Hook', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the app config
    (useAppConfig as unknown as jest.Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        const state = {
          useWagmi: false,
          markComponentMigrated: jest.fn(),
        };
        return selector(state);
      }
      return undefined;
    });
    
    // Mock the wallet hook
    (useUnifiedWallet as jest.Mock).mockReturnValue({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      provider: {},
      signer: {},
    });
  });
  
  test('should subscribe to events when enabled', () => {
    const onEvent = jest.fn();
    
    const { result } = renderHook(() => 
      useSubscribeToEvents({
        categories: [EventCategory.PROPOSALS],
        types: [EventType.PROPOSAL_CREATED],
        addresses: ['0x1234567890123456789012345678901234567890'],
        onEvent,
      })
    );
    
    expect(mockSubscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: [EventCategory.PROPOSALS],
      }),
      expect.any(Function)
    );
    
    expect(result.current.isSubscribed).toBe(true);
  });
  
  test('should unsubscribe when component is unmounted', () => {
    const { unmount } = renderHook(() => 
      useSubscribeToEvents({
        categories: [EventCategory.PROPOSALS],
      })
    );
    
    unmount();
    
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
  
  test('should add event listener when filter is provided', () => {
    const filter = { proposalId: '123' };
    
    renderHook(() => 
      useSubscribeToEvents({
        categories: [EventCategory.PROPOSALS],
        filter,
      })
    );
    
    expect(mockAddEventListener).toHaveBeenCalledWith(
      expect.objectContaining(filter),
      expect.any(Function)
    );
  });
  
  test('should handle event received correctly', async () => {
    const onEvent = jest.fn();
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useSubscribeToEvents({
        categories: [EventCategory.PROPOSALS],
        onEvent,
      })
    );
    
    // Extract the event handler from the mock calls
    const eventHandler = mockSubscribe.mock.calls[0][1];
    
    // Simulate an event
    const mockEvent = {
      id: '1',
      type: EventType.PROPOSAL_CREATED,
      category: EventCategory.PROPOSALS,
      timestamp: Date.now(),
      data: { proposalId: '123' },
    };
    
    // Call the event handler
    act(() => {
      eventHandler(mockEvent);
    });
    
    // Check that onEvent was called with the event
    expect(onEvent).toHaveBeenCalledWith(mockEvent);
    
    // Check that the event was added to the events state
    expect(result.current.events).toContainEqual(mockEvent);
  });
  
  test('should clear events when requested', () => {
    const { result } = renderHook(() => 
      useSubscribeToEvents({
        categories: [EventCategory.PROPOSALS],
      })
    );
    
    // Extract the event handler from the mock calls
    const eventHandler = mockSubscribe.mock.calls[0][1];
    
    // Simulate an event
    const mockEvent = {
      id: '1',
      type: EventType.PROPOSAL_CREATED,
      category: EventCategory.PROPOSALS,
      timestamp: Date.now(),
      data: { proposalId: '123' },
    };
    
    // Add an event
    act(() => {
      eventHandler(mockEvent);
    });
    
    // Verify event was added
    expect(result.current.events.length).toBe(1);
    
    // Clear events
    act(() => {
      result.current.clearEvents();
    });
    
    // Verify events were cleared
    expect(result.current.events.length).toBe(0);
  });
  
  test('should handle resubscription correctly', () => {
    const { result } = renderHook(() => 
      useSubscribeToEvents({
        categories: [EventCategory.PROPOSALS],
      })
    );
    
    // Unsubscribe first
    act(() => {
      result.current.unsubscribe();
    });
    
    // Reset the mock to check if it's called again
    mockSubscribe.mockClear();
    
    // Resubscribe
    act(() => {
      result.current.resubscribe();
    });
    
    // Verify resubscription occurred
    expect(mockSubscribe).toHaveBeenCalled();
    expect(result.current.isSubscribed).toBe(true);
  });
  
  test('should mark component as migrated when using Wagmi implementation', () => {
    // Set useWagmi to true
    const markComponentMigratedMock = jest.fn();
    
    (useAppConfig as unknown as jest.Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        const state = {
          useWagmi: true,
          markComponentMigrated: markComponentMigratedMock,
        };
        return selector(state);
      }
      return undefined;
    });
    
    renderHook(() => 
      useSubscribeToEvents({
        categories: [EventCategory.PROPOSALS],
        implementation: Web3Implementation.WAGMI,
      })
    );
    
    expect(markComponentMigratedMock).toHaveBeenCalledWith('EventSubscriptions');
  });
});

describe('useSubscribeToProposalEvents Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useUnifiedWallet as jest.Mock).mockReturnValue({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
    });
  });
  
  test('should subscribe to proposal events with correct parameters', () => {
    const onProposalEvent = jest.fn();
    
    renderHook(() => 
      useSubscribeToProposalEvents({
        proposalId: '123',
        onEvent: onProposalEvent,
      })
    );
    
    expect(mockSubscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: expect.arrayContaining([EventCategory.PROPOSALS, EventCategory.VOTES]),
      }),
      expect.any(Function)
    );
    
    expect(mockAddEventListener).toHaveBeenCalledWith(
      expect.objectContaining({
        proposalId: '123',
      }),
      expect.any(Function)
    );
  });
  
  test('should handle disabled state correctly', () => {
    const { result } = renderHook(() => 
      useSubscribeToProposalEvents({
        proposalId: '123',
        enabled: false,
      })
    );
    
    expect(result.current.isSubscribed).toBe(false);
    expect(mockSubscribe).not.toHaveBeenCalled();
  });
});

describe('useSubscribeToTokenPriceUpdates Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    (useUnifiedWallet as jest.Mock).mockReturnValue({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
    });
  });
  
  test('should subscribe to token price updates with correct parameters', () => {
    const onTokenPriceUpdate = jest.fn();
    const tokenAddress = '0x1234567890123456789012345678901234567890';
    
    renderHook(() => 
      useSubscribeToTokenPriceUpdates({
        tokenAddress,
        onEvent: onTokenPriceUpdate,
      })
    );
    
    expect(mockSubscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: [EventCategory.TOKEN],
        addresses: [tokenAddress],
      }),
      expect.any(Function)
    );
    
    expect(mockAddEventListener).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenAddress,
      }),
      expect.any(Function)
    );
  });
  
  test('should handle token price update events correctly', () => {
    const onTokenPriceUpdate = jest.fn();
    const tokenAddress = '0x1234567890123456789012345678901234567890';
    
    renderHook(() => 
      useSubscribeToTokenPriceUpdates({
        tokenAddress,
        onEvent: onTokenPriceUpdate,
      })
    );
    
    // Extract the event handler from the mock calls
    const eventHandler = mockSubscribe.mock.calls[0][1];
    
    // Simulate a token price update event
    const mockEvent = {
      id: '1',
      type: EventType.TOKEN_PRICE_UPDATED,
      category: EventCategory.TOKEN,
      timestamp: Date.now(),
      data: { 
        tokenAddress,
        price: '100.50',
        change: '5.2',
      },
    };
    
    // Call the event handler
    act(() => {
      eventHandler(mockEvent);
    });
    
    // Check that onTokenPriceUpdate was called with the event
    expect(onTokenPriceUpdate).toHaveBeenCalledWith(mockEvent);
  });
});
