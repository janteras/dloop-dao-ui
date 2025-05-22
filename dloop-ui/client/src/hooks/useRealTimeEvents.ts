/**
 * Real-Time Events Hooks
 * 
 * React hooks for subscribing to real-time blockchain events with
 * support for both Ethers.js and Wagmi implementations.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { realTimeEventService, EventFilter, EventCategory, EventType } from '@/services/realTimeEventService';
import { EventPayload } from '@/types';
import { Web3Implementation } from '@/types/web3-types';

// Create stub modules for the missing provider hooks
// These will be replaced with proper implementations later
const useProvider = () => ({
  provider: null
});

const useWagmiProvider = () => ({
  provider: null,
  isConnected: false
});

import { useFeatureFlag } from '@/config/feature-flags';

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
  const ethersProvider = useProvider();
  const wagmiProvider = useWagmiProvider();
  const useWagmiFlag = useFeatureFlag('useWagmiEvents');
  
  // Determine which implementation to use
  const useWagmiImpl =  // Initialize with Ethers provider if available
  if (options.implementation === 'ethers' || !options.implementation) {
    const { provider: ethersProvider } = useProvider();
    
    if (ethersProvider && !realTimeEventService.isInitialized()) {
      realTimeEventService.initialize({
        ethersProvider,
        wagmiEnabled: false,
        wsUrl: options.wsUrl || undefined
      });
    }
  }
  
  // Initialize the service
  useEffect(() => {
    if (options.autoConnect !== false) {
      if (!realTimeEventService.isInitialized()) {
        realTimeEventService.initialize({
          ethersProvider: !useWagmiImpl ? ethersProvider : undefined,
          wagmiEnabled: useWagmiImpl,
          wsUrl: options.wsUrl
        });
      }
      
      setStatus(realTimeEventService.getStatus());
      
      // Listen for status changes
      const statusListenerId = realTimeEventService.addEventListener(
        EventCategory.SYSTEM,
        (event: EventPayload) => {
          if (
            event.type === EventType.CONNECTED ||
            event.type === EventType.DISCONNECTED ||
            event.type === EventType.RECONNECTING ||
            event.type === EventType.ERROR
          ) {
            setStatus(realTimeEventService.getStatus());
          }
        }
      );
      
      return () => {
        realTimeEventService.removeEventListener(statusListenerId);
      };
    }
  }, [ethersProvider, wagmiProvider, useWagmiImpl, options.wsUrl, options.autoConnect]);
  
  // Provide control functions
  const connect = useCallback(() => {
    realTimeEventService.initialize({
      ethersProvider: !useWagmiImpl ? ethersProvider : undefined,
      wagmiEnabled: useWagmiImpl,
      wsUrl: options.wsUrl
    });
    setStatus(realTimeEventService.getStatus());
  }, [ethersProvider, useWagmiImpl, options.wsUrl]);
  
  const disconnect = useCallback(() => {
    realTimeEventService.close();
    setStatus('disconnected');
  }, []);
  
  return {
    status,
    connect,
    disconnect,
    implementation: useWagmiImpl ? 'wagmi' : 'ethers'
  };
}

/**
 * Hook for subscribing to blockchain events
 * 
 * @param options Subscription options
 * @returns Events and subscription control
 */
export function useSubscribeToEvents<T = any>(options: {
  categories: EventCategory[] | undefined;
  types?: EventType[] | undefined;
  addresses?: string[] | undefined;
  fromBlock?: number | undefined;
  backfill?: boolean | undefined;
  implementation?: Web3Implementation | undefined;
  filter?: EventFilter | string | undefined;
  onEvent?: ((event: EventPayload<T>) => void) | undefined;
  enabled?: boolean | undefined;
}) {
  const [events, setEvents] = useState<EventPayload<T>[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const subscriptionIdRef = useRef<string | null>(null);
  const listenerIdRef = useRef<string | null>(null);
  
  // Subscribe to events
  useEffect(() => {
    if (options.enabled !== false) { // enabled by default
      if (!isSubscribed) {
        // Create subscription with proper type handling
        subscriptionIdRef.current = realTimeEventService.subscribe({
          categories: options.categories || [],
          types: options.types,
          addresses: options.addresses,
          fromBlock: options.fromBlock,
          backfill: options.backfill,
          implementation: options.implementation
        });
      
      setIsSubscribed(true);
      
      // Add event listener
      if (options.filter) {
        listenerIdRef.current = realTimeEventService.addEventListener(
          options.filter,
          (event: EventPayload) => {
            // Call callback if provided
            if (options.onEvent) {
              options.onEvent(event as EventPayload<T>);
            }
            
            // Update events state
            setEvents(prev => [...prev, event as EventPayload<T>]);
          }
        );
      }
      
      return () => {
        // Clean up subscription and listener
        if (subscriptionIdRef.current) {
          realTimeEventService.unsubscribe(subscriptionIdRef.current);
          subscriptionIdRef.current = null;
        }
        
        if (listenerIdRef.current) {
          realTimeEventService.removeEventListener(listenerIdRef.current);
          listenerIdRef.current = null;
        }
        
        setIsSubscribed(false);
      };
    }
  }, [
    options.categories, 
    options.types, 
    options.addresses, 
    options.fromBlock, 
    options.backfill,
    options.implementation,
    options.filter,
    options.onEvent,
    options.enabled,
    options // Include the entire options object as a dependency
  ]);
  
  // Provide control functions
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, [options]); // Include the entire options object as a dependency
  
  const unsubscribe = useCallback(() => {
    if (subscriptionIdRef.current) {
      realTimeEventService.unsubscribe(subscriptionIdRef.current);
      subscriptionIdRef.current = null;
    }
    
    if (listenerIdRef.current) {
      realTimeEventService.removeEventListener(listenerIdRef.current);
      listenerIdRef.current = null;
    }
    
    setIsSubscribed(false);
  }, []);
  
  const resubscribe = useCallback(() => {
    if (!isSubscribed) {
      // Create subscription with proper type handling
      subscriptionIdRef.current = realTimeEventService.subscribe({
        categories: options.categories || [],
        types: options.types,
        addresses: options.addresses,
        fromBlock: options.fromBlock,
        backfill: options.backfill,
        implementation: options.implementation
      });
      
      // Add event listener
      if (options.filter) {
        listenerIdRef.current = realTimeEventService.addEventListener(
          options.filter,
          (event: EventPayload) => {
            // Call callback if provided
            if (options.onEvent) {
              options.onEvent(event as EventPayload<T>);
            }
            
            // Update events state
            setEvents(prev => [...prev, event as EventPayload<T>]);
          }
        );
      }
      
      setIsSubscribed(true);
    }
  }, [
    isSubscribed,
    options, // Include the entire options object to prevent stale closures
    setEvents // Include setEvents since it's used in the callback
  ]);
  
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
  onVote?: ((event: EventPayload) => void) | undefined;
  implementation?: Web3Implementation | undefined;
  enabled?: boolean | undefined;
}) {
  const [proposalEvents, setProposalEvents] = useState<EventPayload[]>([]);
  
  // Prepare event types
  const eventTypes: EventType[] = [
    EventType.PROPOSAL_CREATED,
    EventType.PROPOSAL_EXECUTED,
    EventType.PROPOSAL_CANCELED
  ];
  
  if (options.includeVotes) {
    eventTypes.push(EventType.VOTE_CAST);
  }
  
  // Create filter based on proposal ID
  const filter: EventFilter = {
    category: EventCategory.PROPOSALS
  };
  
  if (options.proposalAddress) {
    filter.address = options.proposalAddress;
  }
  
  // Subscribe to events
  const { events, isSubscribed, clearEvents, unsubscribe, resubscribe } = useSubscribeToEvents({
    categories: [EventCategory.PROPOSALS],
    types: eventTypes,
    addresses: options.proposalAddress ? [options.proposalAddress] : undefined,
    filter: filter,
    implementation: options.implementation,
    enabled: options.enabled,
    onEvent: (event: EventPayload) => {
      // Filter events by proposal ID if specified
      if (
        options.proposalId &&
        event.data?.proposalId && 
        event.data.proposalId.toString() !== options.proposalId.toString()
      ) {
        return;
      }
      
      // Call appropriate callback based on event type
      if (event.type === EventType.PROPOSAL_CREATED && options.onProposalCreated) {
        options.onProposalCreated(event);
      } else if (event.type === EventType.PROPOSAL_EXECUTED && options.onProposalExecuted) {
        options.onProposalExecuted(event);
      } else if (event.type === EventType.PROPOSAL_CANCELED && options.onProposalCanceled) {
        options.onProposalCanceled(event);
      } else if (event.type === EventType.VOTE_CAST && options.onVote) {
        options.onVote(event);
      }
      
      // Update events state
      setProposalEvents(prev => [...prev, event]);
    }
  });
  
  // Get events by type
  const getEventsByType = useCallback((type: EventType) => {
    return proposalEvents.filter(event => event.type === type);
  }, [proposalEvents]);
  
  // Get filtered events
  const createdEvents = getEventsByType(EventType.PROPOSAL_CREATED);
  const executedEvents = getEventsByType(EventType.PROPOSAL_EXECUTED);
  const canceledEvents = getEventsByType(EventType.PROPOSAL_CANCELED);
  const voteEvents = getEventsByType(EventType.VOTE_CAST);
  
  return {
    proposalEvents,
    createdEvents,
    executedEvents,
    canceledEvents,
    voteEvents,
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
  
  // Prepare event types
  const eventTypes: EventType[] = [
    EventType.TOKEN_TRANSFER,
    EventType.TOKEN_APPROVAL
  ];
  
  if (options.includePrice) {
    eventTypes.push(EventType.TOKEN_PRICE_UPDATED);
  }
  
  // Create filter
  const filter: EventFilter = {
    category: EventCategory.TOKENS,
    address: options.tokenAddress
  };
  
  // Subscribe to events
  const { events, isSubscribed, clearEvents, unsubscribe, resubscribe } = useSubscribeToEvents({
    categories: [EventCategory.TOKENS],
    types: eventTypes,
    addresses: [options.tokenAddress],
    filter: filter,
    implementation: options.implementation,
    enabled: options.enabled && !!options.tokenAddress,
    onEvent: (event: EventPayload) => {
      // Call appropriate callback based on event type
      if (event.type === EventType.TOKEN_TRANSFER && options.onTransfer) {
        options.onTransfer(event);
      } else if (event.type === EventType.TOKEN_APPROVAL && options.onApproval) {
        options.onApproval(event);
      } else if (event.type === EventType.TOKEN_PRICE_UPDATED && options.onPriceUpdate) {
        options.onPriceUpdate(event);
      }
      
      // Update events state
      setTokenEvents(prev => [...prev, event]);
    }
  });
  
  // Get events by type
  const transferEvents = events.filter(event => event.type === EventType.TOKEN_TRANSFER);
  const approvalEvents = events.filter(event => event.type === EventType.TOKEN_APPROVAL);
  const priceEvents = events.filter(event => event.type === EventType.TOKEN_PRICE_UPDATED);
  
  // Get latest price event
  const latestPriceEvent = priceEvents.length > 0 
    ? priceEvents[priceEvents.length - 1] 
    : null;
  
  return {
    tokenEvents,
    transferEvents,
    approvalEvents,
    priceEvents,
    latestPriceEvent,
    isSubscribed,
    clearEvents,
    unsubscribe,
    resubscribe
  };
}
