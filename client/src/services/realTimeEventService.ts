/**
 * Real-time Event Service
 * 
 * A WebSocket-based event system for real-time blockchain events
 * with support for both Ethers.js and Wagmi implementations.
 */

import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import { processContractError } from './errorHandling';
import { useFeatureFlag } from '@/config/feature-flags';

// Event categories
export enum EventCategory {
  PROPOSALS = 'proposals',
  VOTES = 'votes',
  TOKENS = 'tokens',
  GOVERNANCE = 'governance',
  SYSTEM = 'system'
}

// Event types within categories
export enum EventType {
  // Proposal events
  PROPOSAL_CREATED = 'proposal_created',
  PROPOSAL_EXECUTED = 'proposal_executed',
  PROPOSAL_CANCELED = 'proposal_canceled',
  
  // Vote events
  VOTE_CAST = 'vote_cast',
  VOTE_CHANGED = 'vote_changed',
  
  // Token events
  TOKEN_TRANSFER = 'token_transfer',
  TOKEN_APPROVAL = 'token_approval',
  TOKEN_PRICE_UPDATED = 'token_price_updated',
  
  // Governance events
  DELEGATION = 'delegation',
  PARAMETER_CHANGED = 'parameter_changed',
  
  // System events
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// Event payload interface
export interface EventPayload<T = any> {
  // Event metadata
  id: string;
  timestamp: number;
  category: EventCategory;
  type: EventType;
  source: 'ethers' | 'wagmi' | 'websocket' | 'system';
  
  // Event data
  data: T;
  
  // Optional block information
  block?: {
    number: number;
    hash: string;
    timestamp?: number;
  };
  
  // Optional transaction information
  transaction?: {
    hash: string;
    from: string;
    to?: string;
  };
}

// Subscription options
export interface SubscriptionOptions {
  categories?: EventCategory[];
  types?: EventType[];
  addresses?: string[];
  fromBlock?: number;
  backfill?: boolean;
  implementation?: 'ethers' | 'wagmi';
}

// Event filter
export interface EventFilter {
  category?: EventCategory;
  type?: EventType;
  address?: string;
}

/**
 * RealTimeEventService class
 * 
 * This service provides a unified interface for subscribing to real-time
 * blockchain events with support for both WebSockets and contract events.
 */
export class RealTimeEventService {
  private wsConnection: WebSocket | null = null;
  private ethersProvider: ethers.Provider | null = null;
  private wagmiEnabled: boolean = false;
  private eventEmitter: EventEmitter = new EventEmitter();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private subscriptions: Map<string, SubscriptionOptions> = new Map();
  private contractListeners: Map<string, any> = new Map();
  private wsUrl: string | null = null;
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error' = 'disconnected';
  
  // Constructor
  constructor() {
    // Increase max listeners to handle many subscriptions
    this.eventEmitter.setMaxListeners(100);
  }
  
  /**
   * Initialize the service with providers
   * @param options Service initialization options
   */
  initialize(options: {
    ethersProvider?: ethers.Provider;
    wagmiEnabled?: boolean;
    wsUrl?: string;
  }) {
    // Store provider references
    this.ethersProvider = options.ethersProvider || null;
    this.wagmiEnabled = options.wagmiEnabled || false;
    this.wsUrl = options.wsUrl || null;
    
    // Connect to WebSocket if URL provided
    if (this.wsUrl) {
      this.connectWebSocket();
    }
    
    return this;
  }
  
  /**
   * Connect to WebSocket server
   */
  private connectWebSocket() {
    if (!this.wsUrl || this.wsConnection) return;
    
    try {
      this.connectionStatus = 'connecting';
      this.wsConnection = new WebSocket(this.wsUrl);
      
      // Set up event handlers
      this.wsConnection.onopen = this.handleWSOpen.bind(this);
      this.wsConnection.onmessage = this.handleWSMessage.bind(this);
      this.wsConnection.onerror = this.handleWSError.bind(this);
      this.wsConnection.onclose = this.handleWSClose.bind(this);
    } catch (error) {
      this.connectionStatus = 'error';
      this.emitSystemEvent(EventType.ERROR, {
        message: 'Failed to connect to WebSocket server',
        error
      });
    }
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleWSOpen() {
    this.connectionStatus = 'connected';
    this.reconnectAttempts = 0;
    
    // Emit connected event
    this.emitSystemEvent(EventType.CONNECTED, {
      message: 'Connected to WebSocket server',
      url: this.wsUrl
    });
    
    // Resubscribe to all active subscriptions
    for (const [id, options] of this.subscriptions.entries()) {
      this.sendSubscription(id, options);
    }
  }
  
  /**
   * Handle WebSocket message event
   */
  private handleWSMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data);
      
      // Process incoming event
      if (message.type === 'event') {
        const eventPayload = message.payload as EventPayload;
        this.eventEmitter.emit('event', eventPayload);
        this.eventEmitter.emit(`${eventPayload.category}:${eventPayload.type}`, eventPayload);
        
        // Emit for specific address if present
        if (eventPayload.data?.address) {
          this.eventEmitter.emit(
            `${eventPayload.category}:${eventPayload.type}:${eventPayload.data.address.toLowerCase()}`, 
            eventPayload
          );
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  }
  
  /**
   * Handle WebSocket error event
   */
  private handleWSError(error: Event) {
    this.connectionStatus = 'error';
    
    // Emit error event
    this.emitSystemEvent(EventType.ERROR, {
      message: 'WebSocket error',
      error
    });
  }
  
  /**
   * Handle WebSocket close event
   */
  private handleWSClose() {
    const wasConnected = this.connectionStatus === 'connected';
    this.connectionStatus = 'disconnected';
    this.wsConnection = null;
    
    // Emit disconnected event
    if (wasConnected) {
      this.emitSystemEvent(EventType.DISCONNECTED, {
        message: 'Disconnected from WebSocket server'
      });
    }
    
    // Attempt to reconnect
    this.attemptReconnect();
  }
  
  /**
   * Attempt to reconnect to WebSocket server
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emitSystemEvent(EventType.ERROR, {
        message: 'Max reconnection attempts reached',
        attempts: this.reconnectAttempts
      });
      return;
    }
    
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
    
    // Emit reconnecting event
    this.emitSystemEvent(EventType.RECONNECTING, {
      message: 'Attempting to reconnect',
      attempt: this.reconnectAttempts,
      delay
    });
    
    // Schedule reconnection
    setTimeout(() => {
      if (this.connectionStatus !== 'connected') {
        this.connectWebSocket();
      }
    }, delay);
  }
  
  /**
   * Send subscription request to WebSocket server
   */
  private sendSubscription(id: string, options: SubscriptionOptions) {
    if (!this.wsConnection || this.connectionStatus !== 'connected') return;
    
    try {
      this.wsConnection.send(JSON.stringify({
        type: 'subscribe',
        id,
        options
      }));
    } catch (error) {
      console.error('Error sending subscription:', error);
    }
  }
  
  /**
   * Emit a system event
   */
  private emitSystemEvent(type: EventType, data: any) {
    const event: EventPayload = {
      id: `system-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      category: EventCategory.SYSTEM,
      type,
      source: 'system',
      data
    };
    
    this.eventEmitter.emit('event', event);
    this.eventEmitter.emit(`${event.category}:${event.type}`, event);
  }
  
  /**
   * Subscribe to blockchain events
   * @param options Subscription options
   * @returns Subscription ID
   */
  subscribe(options: SubscriptionOptions): string {
    // Generate subscription ID
    const id = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Store subscription
    this.subscriptions.set(id, options);
    
    // Send subscription to WebSocket if connected
    if (this.wsConnection && this.connectionStatus === 'connected') {
      this.sendSubscription(id, options);
    }
    
    // Set up contract event listeners for Ethers
    if (options.addresses && options.addresses.length > 0 && this.ethersProvider && options.implementation !== 'wagmi') {
      this.setupEthersContractListeners(id, options);
    }
    
    // Set up contract event listeners for Wagmi
    if (options.addresses && options.addresses.length > 0 && this.wagmiEnabled && options.implementation !== 'ethers') {
      this.setupWagmiContractListeners(id, options);
    }
    
    return id;
  }
  
  /**
   * Set up contract event listeners using Ethers.js
   */
  private setupEthersContractListeners(id: string, options: SubscriptionOptions) {
    if (!this.ethersProvider || !options.addresses) return;
    
    // This is a simplified example - in a real implementation,
    // you would create specific listeners based on the event types
    for (const address of options.addresses) {
      try {
        // Create a contract instance
        const contract = new ethers.Contract(
          address,
          ['event ProposalCreated(uint256 id, address proposer)', 'event VoteCast(address voter, uint256 proposalId, bool support, uint256 votes)'],
          this.ethersProvider
        );
        
        // Set up listeners based on event types
        if (!options.types || options.types.includes(EventType.PROPOSAL_CREATED)) {
          const listener = (id: any, proposer: string, ...args: any[]) => {
            const event: EventPayload = {
              id: `ethers-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              timestamp: Date.now(),
              category: EventCategory.PROPOSALS,
              type: EventType.PROPOSAL_CREATED,
              source: 'ethers',
              data: {
                proposalId: id.toString(),
                proposer,
                address
              }
            };
            
            this.eventEmitter.emit('event', event);
            this.eventEmitter.emit(`${event.category}:${event.type}`, event);
            this.eventEmitter.emit(`${event.category}:${event.type}:${address.toLowerCase()}`, event);
          };
          
          contract.on('ProposalCreated', listener);
          this.contractListeners.set(`${id}-${address}-ProposalCreated`, { contract, event: 'ProposalCreated', listener });
        }
        
        if (!options.types || options.types.includes(EventType.VOTE_CAST)) {
          const listener = (voter: string, proposalId: any, support: boolean, votes: any, ...args: any[]) => {
            const event: EventPayload = {
              id: `ethers-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              timestamp: Date.now(),
              category: EventCategory.VOTES,
              type: EventType.VOTE_CAST,
              source: 'ethers',
              data: {
                voter,
                proposalId: proposalId.toString(),
                support,
                votes: votes.toString(),
                address
              }
            };
            
            this.eventEmitter.emit('event', event);
            this.eventEmitter.emit(`${event.category}:${event.type}`, event);
            this.eventEmitter.emit(`${event.category}:${event.type}:${address.toLowerCase()}`, event);
          };
          
          contract.on('VoteCast', listener);
          this.contractListeners.set(`${id}-${address}-VoteCast`, { contract, event: 'VoteCast', listener });
        }
      } catch (error) {
        console.error(`Error setting up Ethers listeners for ${address}:`, error);
      }
    }
  }
  
  /**
   * Set up contract event listeners using Wagmi
   */
  private setupWagmiContractListeners(id: string, options: SubscriptionOptions) {
    // In a real implementation, you would use Wagmi's useContractEvent hook
    // or similar functionality to set up listeners
    console.log('Wagmi contract listeners not implemented in this example');
    // This is a placeholder - the actual implementation would use Wagmi's APIs
  }
  
  /**
   * Unsubscribe from events
   * @param subscriptionId Subscription ID to unsubscribe
   */
  unsubscribe(subscriptionId: string): boolean {
    // Remove subscription
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;
    
    this.subscriptions.delete(subscriptionId);
    
    // Send unsubscribe message to WebSocket if connected
    if (this.wsConnection && this.connectionStatus === 'connected') {
      try {
        this.wsConnection.send(JSON.stringify({
          type: 'unsubscribe',
          id: subscriptionId
        }));
      } catch (error) {
        console.error('Error sending unsubscribe message:', error);
      }
    }
    
    // Remove contract listeners
    for (const [key, listener] of this.contractListeners.entries()) {
      if (key.startsWith(`${subscriptionId}-`)) {
        try {
          listener.contract.off(listener.event, listener.listener);
        } catch (error) {
          console.error(`Error removing listener ${key}:`, error);
        }
        this.contractListeners.delete(key);
      }
    }
    
    return true;
  }
  
  /**
   * Add event listener
   * @param filter Event filter
   * @param callback Callback function
   * @returns Listener ID
   */
  addEventListener(filter: EventFilter | string, callback: (event: EventPayload) => void): string {
    const listenerId = `listener-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Create event name based on filter
    let eventName: string;
    if (typeof filter === 'string') {
      eventName = filter;
    } else {
      if (filter.category && filter.type && filter.address) {
        eventName = `${filter.category}:${filter.type}:${filter.address.toLowerCase()}`;
      } else if (filter.category && filter.type) {
        eventName = `${filter.category}:${filter.type}`;
      } else if (filter.category) {
        eventName = filter.category;
      } else {
        eventName = 'event';
      }
    }
    
    // Add listener
    this.eventEmitter.on(eventName, callback);
    
    // Store listener info for removal
    this.eventEmitter.on('removeListener', (id: string) => {
      if (id === listenerId) {
        this.eventEmitter.off(eventName, callback);
      }
    });
    
    return listenerId;
  }
  
  /**
   * Remove event listener
   * @param listenerId Listener ID to remove
   */
  removeEventListener(listenerId: string): void {
    this.eventEmitter.emit('removeListener', listenerId);
  }
  
  /**
   * Close WebSocket connection and clean up
   */
  close(): void {
    // Close WebSocket connection
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    
    // Remove all contract listeners
    for (const [key, listener] of this.contractListeners.entries()) {
      try {
        listener.contract.off(listener.event, listener.listener);
      } catch (error) {
        console.error(`Error removing listener ${key}:`, error);
      }
    }
    this.contractListeners.clear();
    
    // Clear subscriptions
    this.subscriptions.clear();
    
    // Remove all event listeners
    this.eventEmitter.removeAllListeners();
    
    this.connectionStatus = 'disconnected';
  }
  
  /**
   * Get current connection status
   */
  getStatus(): string {
    return this.connectionStatus;
  }
  
  /**
   * Manually emit an event (useful for testing)
   */
  emitEvent(payload: EventPayload): void {
    this.eventEmitter.emit('event', payload);
    this.eventEmitter.emit(`${payload.category}:${payload.type}`, payload);
    
    if (payload.data?.address) {
      this.eventEmitter.emit(
        `${payload.category}:${payload.type}:${payload.data.address.toLowerCase()}`, 
        payload
      );
    }
  }
}

// Export singleton instance
export const realTimeEventService = new RealTimeEventService();

// Export types
export type { EventPayload, SubscriptionOptions, EventFilter };
