/**
 * Real-Time Events Hook
 * 
 * Provides hooks for subscribing to real-time blockchain events
 * with support for both Ethers.js and Wagmi implementations.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useUnifiedWallet } from './useUnifiedWallet';
import { useAppConfig } from '@/config/app-config';
import { Web3Implementation } from '@/types/web3-types';
import { 
  realTimeEventService, 
  SubscriptionOptions, 
  EventFilter, 
  EventPayload, 
  EventCategory, 
  EventType 
} from '../services/realTimeEventService';
import { useFeatureFlag } from '@/config/feature-flags';

// Define EventPayload type if not available in @/types
// Re-export types from the service implementation
export type { EventPayload, SubscriptionOptions, EventFilter } from '../services/realTimeEventService';

// Additional types for the hook interface
export interface RealTimeEventHookOptions {
  autoConnect?: boolean;
  wsUrl?: string;
  implementation?: Web3Implementation;
}

export interface SubscribeToEventsOptions {
  categories: EventCategory[];
  types?: EventType[] | undefined;
  addresses?: string[] | undefined;
  fromBlock?: number | undefined;
  backfill?: boolean | undefined;
  implementation?: Web3Implementation | undefined;
  filter?: EventFilter;
  onEvent?: (event: EventPayload) => void;
  enabled?: boolean | undefined;
}

/**
 * Hook for initializing the real-time event service
 * 
 * @param options Service initialization options
 * @returns Status and control functions
 */
export function useInitializeRealTimeEvents(options: {
  wsUrl?: string | undefined;
  implementation?: Web3Implementation | undefined;
  autoConnect?: boolean | undefined;
}) {
  const [status, setStatus] = useState<string>('disconnected');
  const useWagmiFlag = useFeatureFlag('useWagmiEvents');
  const appConfig = useAppConfig();
  
  // Determine which implementation to use
  const useWagmiImpl = options.implementation === 'wagmi' || 
    (options.implementation !== 'ethers' && useWagmiFlag);
  
  // Initialize the service
  // Create a ref for the status change handler
  const handleConnectionStatusChangeRef = useRef<((status: string) => void) | null>(null);
  
  useEffect(() => {
    // Set up the status change handler
    handleConnectionStatusChangeRef.current = (newStatus: string) => {
      setStatus(newStatus);
    };
    
    // Check if we should auto-connect
    if (options.autoConnect !== false) {
      // Check if service methods exist before calling them
      try {
        // @ts-ignore - Method may not exist
        if (realTimeEventService && typeof realTimeEventService.addStatusChangeListener === 'function' && 
            handleConnectionStatusChangeRef.current) {
          // @ts-ignore - Method may not exist
          realTimeEventService.addStatusChangeListener(handleConnectionStatusChangeRef.current);
        }
      
        // Connect to the service
        // @ts-ignore - Method may not exist
        if (realTimeEventService && typeof realTimeEventService.connect === 'function') {
          // @ts-ignore - Method may not exist
          realTimeEventService.connect();
        }
      } catch (e) {
        console.error('Error initializing real-time event service:', e);
      }
      
      // Cleanup on unmount
      return () => {
        try {
          // @ts-ignore - Method may not exist
          if (realTimeEventService && typeof realTimeEventService.removeStatusChangeListener === 'function' && 
              handleConnectionStatusChangeRef.current) {
            // @ts-ignore - Method may not exist
            realTimeEventService.removeStatusChangeListener(handleConnectionStatusChangeRef.current);
          }
        } catch (e) {
          console.error('Error removing status change listener:', e);
        }
      };
    }
  }, [options.autoConnect, options.wsUrl, useWagmiImpl]);
  
  // Provide control functions
  // These methods may not exist in all versions of the service implementation
  // We check for their existence before calling them
  const connect = useCallback(() => {
    try {
      // @ts-ignore - Method may not exist
      if (realTimeEventService && typeof realTimeEventService.connect === 'function') {
        // @ts-ignore - Method may not exist
        realTimeEventService.connect();
      }
    } catch (e) {
      console.error('Error connecting to real-time service:', e);
    }
  }, []);
  
  const disconnect = useCallback(() => {
    try {
      // @ts-ignore - Method may not exist
      if (realTimeEventService && typeof realTimeEventService.disconnect === 'function') {
        // @ts-ignore - Method may not exist
        realTimeEventService.disconnect();
      }
    } catch (e) {
      console.error('Error disconnecting from real-time service:', e);
    }
  }, []);
  
  return {
    status,
    connect,
    disconnect,
    implementation: useWagmiImpl ? 'wagmi' : 'ethers' as Web3Implementation
  };
}

/**
 * Hook for subscribing to blockchain events
 * 
 * @param options Subscription options
 * @returns Events and subscription control
 */
export function useSubscribeToEvents<T = unknown>(options: SubscribeToEventsOptions) {
  const [events, setEvents] = useState<EventPayload<T>[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const subscriptionIdRef = useRef<string | null>(null);
  const listenerIdRef = useRef<string | null>(null);
  const appConfig = useAppConfig();
  
  // Use the singleton instance
  const service = useMemo(() => {
    // Initialize the service with the current configuration
    try {
      realTimeEventService.initialize({
        wagmiEnabled: appConfig.useWagmi,
        // Use empty string as fallback if undefined is not accepted
        wsUrl: process.env.NEXT_PUBLIC_REAL_TIME_WS_URL || ''
        // Don't pass ethersProvider if it's undefined
      });
    } catch (e) {
      console.error('Error initializing real-time service:', e);
    }
    return realTimeEventService;
  }, [appConfig.useWagmi]);
  
  // Subscribe to events
  useEffect(() => {
    if (options.enabled !== false) { // enabled by default
      if (!isSubscribed) {
        // Create subscription
        // Ensure we have valid categories to avoid TypeScript errors
        const categories = options.categories || [];
        
        // Create subscription options with required categories
        const subscriptionOptions: SubscriptionOptions = {
          categories
        };
        
        // Only add optional fields if they are defined
        if (options.types !== undefined) subscriptionOptions.types = options.types;
        if (options.addresses !== undefined) subscriptionOptions.addresses = options.addresses;
        if (options.fromBlock !== undefined) subscriptionOptions.fromBlock = options.fromBlock;
        if (options.backfill !== undefined) subscriptionOptions.backfill = options.backfill;
        if (options.implementation !== undefined) subscriptionOptions.implementation = options.implementation;
        
        try {
          const result = service.subscribe(subscriptionOptions);
          
          // Handle different return value formats
          if (typeof result === 'string') {
            subscriptionIdRef.current = result;
          } else if (result && typeof result === 'object' && result !== null) {
            // Use explicit type guard
            const hasId = 'id' in result && typeof (result as any).id === 'string';
            if (hasId) {
              subscriptionIdRef.current = (result as any).id;
            } else {
              // Fallback if id property is missing
              subscriptionIdRef.current = `subscription-${Date.now()}`;
            }
          } else {
            // Fallback if unexpected return format
            subscriptionIdRef.current = `subscription-${Date.now()}`;
          }
        } catch (e) {
          console.error('Error subscribing to events:', e);
          subscriptionIdRef.current = `error-subscription-${Date.now()}`;
        }
      }
        
        setIsSubscribed(true);
        
        // Add event listener
        if (options.filter) {
          const filter: EventFilter = {
            ...options.filter,
          } as EventFilter;
          
          const listenerId = service.addEventListener(
            filter,
            (event: EventPayload) => {
              // Call callback if provided
              if (options.onEvent) {
                options.onEvent(event as EventPayload<T>);
              }
              
              // Update events state
              setEvents(prev => [...prev, event as EventPayload<T>]);
            }
          );
          
          listenerIdRef.current = listenerId;
        }
      }
    
    // Cleanup on unmount or when options change
    return () => {
      if (subscriptionIdRef.current) {
        service.unsubscribe(subscriptionIdRef.current);
        subscriptionIdRef.current = null;
      }
      
      if (listenerIdRef.current) {
        service.removeEventListener(listenerIdRef.current);
        listenerIdRef.current = null;
      }
      
      setIsSubscribed(false);
    };
  }, [options]);
  
  // Provide control functions
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);
  
  const unsubscribe = useCallback(() => {
    if (subscriptionIdRef.current) {
      service.unsubscribe(subscriptionIdRef.current);
      subscriptionIdRef.current = null;
    }
    
    if (listenerIdRef.current) {
      service.removeEventListener(listenerIdRef.current);
      listenerIdRef.current = null;
    }
    
    setIsSubscribed(false);
  }, []);
  
  const resubscribe = useCallback(() => {
    if (!isSubscribed) {
      // Create subscription
      // Ensure we have valid categories to avoid TypeScript errors
      const categories = options.categories || [];
      
      // Create subscription options with required categories
      const subscriptionOptions: SubscriptionOptions = {
        categories
      };
      
      // Only add optional fields if they are defined
      if (options.types !== undefined) subscriptionOptions.types = options.types;
      if (options.addresses !== undefined) subscriptionOptions.addresses = options.addresses;
      if (options.fromBlock !== undefined) subscriptionOptions.fromBlock = options.fromBlock;
      if (options.backfill !== undefined) subscriptionOptions.backfill = options.backfill;
      if (options.implementation !== undefined) subscriptionOptions.implementation = options.implementation;
      
      try {
        // Call subscribe and handle the return value which might be an ID string or an object with ID
        const result = service.subscribe(subscriptionOptions);
        
        // Handle different return value formats
        if (typeof result === 'string') {
          subscriptionIdRef.current = result;
        } else if (result && typeof result === 'object' && result !== null) {
          // Use explicit type guard
          const hasId = 'id' in result && typeof (result as any).id === 'string';
          if (hasId) {
            subscriptionIdRef.current = (result as any).id;
          } else {
            // Fallback if id property is missing
            subscriptionIdRef.current = `subscription-${Date.now()}`;
          }
        } else {
          // Fallback if unexpected return format
          subscriptionIdRef.current = `subscription-${Date.now()}`;
        }
      } catch (e) {
        console.error('Error subscribing to events:', e);
        subscriptionIdRef.current = `error-subscription-${Date.now()}`;
      }
      
      setIsSubscribed(true);
      
      // Add event listener
      if (options.filter) {
        const filter: EventFilter = {
          ...options.filter,
        } as EventFilter;
        
        const listenerId = service.addEventListener(
          filter,
          (event: EventPayload) => {
            // Call callback if provided
            if (options.onEvent) {
              options.onEvent(event as EventPayload<T>);
            }
            
            // Update events state
            setEvents(prev => [...prev, event as EventPayload<T>]);
          }
        );
        
        listenerIdRef.current = listenerId;
      }
    }
  }, [isSubscribed, options]);
  
  return {
    events,
    latestEvent: events.length > 0 ? events[events.length - 1] : null,
    isSubscribed,
    clearEvents,
    unsubscribe,
    resubscribe
  };
}

/**
 * Hook for subscribing to proposal events
 * 
 * @param options Subscription options
 * @returns Proposal events and subscription control
 */
export function useProposalEvents(options: {
  proposalId?: string | number | undefined;
  proposalAddress?: string | undefined;
  includeVotes?: boolean | undefined;
  onProposalCreated?: ((event: EventPayload) => void) | undefined;
  onProposalExecuted?: ((event: EventPayload) => void) | undefined;
  onProposalCanceled?: ((event: EventPayload) => void) | undefined;
  onVoteCast?: ((event: EventPayload) => void) | undefined;
  implementation?: Web3Implementation | undefined;
  enabled?: boolean | undefined;
}) {
  const [proposalEvents, setProposalEvents] = useState<EventPayload[]>([]);
  const [voteEvents, setVoteEvents] = useState<EventPayload[]>([]);
  const [executedEvents, setExecutedEvents] = useState<EventPayload[]>([]);
  
  // Determine event types to subscribe to
  const eventTypes: EventType[] = [];
  
  if (options.onProposalCreated) {
    eventTypes.push(EventType.PROPOSAL_CREATED);
  }
  
  if (options.onProposalExecuted) {
    eventTypes.push(EventType.PROPOSAL_EXECUTED);
  }
  
  if (options.onProposalCanceled) {
    eventTypes.push(EventType.PROPOSAL_CANCELED);
  }
  
  if (options.onVoteCast || options.includeVotes) {
    eventTypes.push(EventType.VOTE_CAST);
  }
  
  // Create event filter
  const filter: EventFilter = {
    proposalId: options.proposalId?.toString(),
  } as EventFilter;
  
  // Subscribe to events
  const { events, isSubscribed, clearEvents, unsubscribe, resubscribe } = useSubscribeToEvents({
    categories: options.includeVotes 
      ? [EventCategory.PROPOSALS, EventCategory.VOTES] 
      : [EventCategory.PROPOSALS],
    types: eventTypes.length > 0 ? eventTypes : undefined,
    addresses: options.proposalAddress ? [options.proposalAddress] : undefined,
    filter,
    implementation: options.implementation,
    enabled: options.enabled,
    onEvent: (event: EventPayload) => {
      // Sort events by type
      if (event.type === EventType.PROPOSAL_CREATED) {
        setProposalEvents(prev => [...prev, event]);
        
        if (options.onProposalCreated) {
          options.onProposalCreated(event);
        }
      } else if (event.type === EventType.VOTE_CAST) {
        setVoteEvents(prev => [...prev, event]);
        
        if (options.onVoteCast) {
          options.onVoteCast(event);
        }
      } else if (event.type === EventType.PROPOSAL_EXECUTED) {
        setExecutedEvents(prev => [...prev, event]);
        
        if (options.onProposalExecuted) {
          options.onProposalExecuted(event);
        }
      } else if (event.type === EventType.PROPOSAL_CANCELED) {
        if (options.onProposalCanceled) {
          options.onProposalCanceled(event);
        }
      }
    }
  });
  
  // Provide combined event arrays
  return {
    events,
    proposalEvents,
    voteEvents,
    executedEvents,
    isSubscribed,
    clearEvents,
    unsubscribe,
    resubscribe
  };
}

/**
 * Hook for subscribing to token events
 * 
 * @param options Subscription options
 * @returns Token events and subscription control
 */
export function useTokenEvents(options: {
  tokenAddress: string;
  includePrice?: boolean | undefined;
  onTransfer?: ((event: EventPayload) => void) | undefined;
  onApproval?: ((event: EventPayload) => void) | undefined;
  onPriceUpdate?: ((event: EventPayload) => void) | undefined;
  implementation?: Web3Implementation | undefined;
  enabled?: boolean | undefined;
}) {
  const [tokenEvents, setTokenEvents] = useState<EventPayload[]>([]);
  const [transferEvents, setTransferEvents] = useState<EventPayload[]>([]);
  const [approvalEvents, setApprovalEvents] = useState<EventPayload[]>([]);
  const [priceEvents, setPriceEvents] = useState<EventPayload[]>([]);
  
  // Determine event types to subscribe to
  const eventTypes: EventType[] = [];
  
  if (options.onTransfer) {
    eventTypes.push(EventType.TOKEN_TRANSFER);
  }
  if (options.onApproval) {
    eventTypes.push(EventType.TOKEN_APPROVAL);
  }
  
  if (options.onPriceUpdate || options.includePrice) {
    eventTypes.push(EventType.TOKEN_PRICE_UPDATED);
  }
  
  // Create event filter for token events
  const filter: EventFilter = {
    tokenAddress: options.tokenAddress,
  } as EventFilter;
  
  // Subscribe to events
  const { events, isSubscribed, clearEvents, unsubscribe, resubscribe } = useSubscribeToEvents({
    categories: [EventCategory.TOKEN],
    types: eventTypes.length > 0 ? eventTypes : undefined,
    addresses: [options.tokenAddress],
    filter,
    implementation: options.implementation,
    enabled: options.enabled && !!options.tokenAddress,
    onEvent: (event: EventPayload) => {
      // Sort events by type
      if (event.type === EventType.TOKEN_TRANSFER) {
        setTransferEvents(prevEvents => [...prevEvents, event]);
        
        if (options.onTransfer) {
          options.onTransfer(event);
        }
      } else if (event.type === EventType.TOKEN_APPROVAL) {
        setApprovalEvents(prevEvents => [...prevEvents, event]);
        
        if (options.onApproval) {
          options.onApproval(event);
        }
      } else if (event.type === EventType.TOKEN_PRICE_UPDATED) {
        setPriceEvents(prevEvents => [...prevEvents, event]);
        
        if (options.onPriceUpdate) {
          options.onPriceUpdate(event);
        }
      } else {
        // Add to general token events
        setTokenEvents(prevEvents => [...prevEvents, event]);
      }
    },
  });
  
  // Provide combined event arrays
  return {
    events,
    tokenEvents,
    transferEvents,
    approvalEvents,
    priceEvents,
    isSubscribed,
    clearEvents,
    unsubscribe,
    resubscribe
  };
}
