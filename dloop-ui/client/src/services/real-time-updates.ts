/**
 * Real-time updates service for blockchain events
 * 
 * Provides WebSocket-based real-time notifications for:
 * - New proposals
 * - Votes on proposals
 * - Proposal executions
 * - State changes
 * 
 * Uses React Query for efficient cache invalidation and optimistic updates
 */

import { ethers } from 'ethers';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from 'react-query';
import { ASSET_DAO_KEYS } from '@/hooks/query/useAssetDaoQueries';
import { useUnifiedWallet } from '@/hooks/unified';
import { NotificationService } from '@/services/notificationService';
import { AssetDaoContractABI } from '@/contracts/AssetDaoContract';
import { ProposalState } from '@/services/enhanced-assetDaoService';

// Events we want to listen for
export enum AssetDaoEvent {
  ProposalCreated = 'ProposalCreated',
  VoteCast = 'VoteCast',
  ProposalExecuted = 'ProposalExecuted',
  ProposalCanceled = 'ProposalCanceled',
  StateChanged = 'StateChanged'
}

// Typed event data interfaces
export interface ProposalCreatedEvent {
  proposalId: number;
  proposer: string;
  title: string;
  description: string;
  targets: string[];
  values: string[];
  calldatas: string[];
  voteStart: number;
  voteEnd: number;
}

export interface VoteCastEvent {
  voter: string;
  proposalId: number;
  support: boolean;
  weight: string;
}

export interface ProposalExecutedEvent {
  proposalId: number;
  executor: string;
}

export interface ProposalCanceledEvent {
  proposalId: number;
  canceler: string;
}

export interface StateChangedEvent {
  proposalId: number;
  oldState: ProposalState;
  newState: ProposalState;
}

// Union type for all event data
export type AssetDaoEventData = 
  | ProposalCreatedEvent 
  | VoteCastEvent 
  | ProposalExecutedEvent 
  | ProposalCanceledEvent
  | StateChangedEvent;

// Event handler function type
export type EventHandler = (eventName: AssetDaoEvent, data: AssetDaoEventData) => void;

/**
 * Class to manage real-time event subscriptions
 */
export class AssetDaoEventManager {
  private provider: ethers.providers.WebSocketProvider | null = null;
  private contract: ethers.Contract | null = null;
  private handlers: Record<string, EventHandler[]> = {};
  private contractAddress: string;
  private reconnectAttempts = 0;
  private reconnectMaxAttempts = 5;
  private reconnectDelay = 2000; // ms
  private isReconnecting = false;
  
  constructor(contractAddress: string, wsUrl?: string) {
    this.contractAddress = contractAddress;
    
    // Initialize WebSocket provider if URL provided
    if (wsUrl) {
      this.connectWebSocket(wsUrl);
    }
  }
  
  /**
   * Connect to WebSocket endpoint
   */
  public connectWebSocket(wsUrl: string): void {
    try {
      // Close existing connection if any
      this.disconnect();
      
      // Create new WebSocket provider
      this.provider = new ethers.providers.WebSocketProvider(wsUrl);
      
      // Create contract instance
      this.contract = new ethers.Contract(
        this.contractAddress,
        AssetDaoContractABI,
        this.provider
      );
      
      // Set up event listeners
      this.subscribeToEvents();
      
      // Setup reconnection logic
      this.provider._websocket.addEventListener('close', () => {
        console.log('WebSocket connection closed');
        if (!this.isReconnecting) {
          this.attemptReconnect(wsUrl);
        }
      });
      
      // Reset reconnect attempts on successful connection
      this.reconnectAttempts = 0;
      
      console.log('WebSocket connection established');
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.attemptReconnect(wsUrl);
    }
  }
  
  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(wsUrl: string): void {
    if (this.isReconnecting || this.reconnectAttempts >= this.reconnectMaxAttempts) {
      return;
    }
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.reconnectMaxAttempts})...`);
    
    setTimeout(() => {
      this.connectWebSocket(wsUrl);
      this.isReconnecting = false;
    }, this.reconnectDelay * this.reconnectAttempts);
  }
  
  /**
   * Disconnect WebSocket connection
   */
  public disconnect(): void {
    if (this.provider) {
      this.provider.removeAllListeners();
      // @ts-ignore - private property access
      if (this.provider._websocket) {
        // @ts-ignore - private property access
        this.provider._websocket.close();
      }
      this.provider = null;
      this.contract = null;
    }
  }
  
  /**
   * Subscribe to contract events
   */
  private subscribeToEvents(): void {
    if (!this.contract) return;
    
    // ProposalCreated event
    this.contract.on('ProposalCreated', (
      proposalId, proposer, title, description, targets, values, calldatas, voteStart, voteEnd
    ) => {
      const eventData: ProposalCreatedEvent = {
        proposalId: proposalId.toNumber(),
        proposer,
        title,
        description,
        targets,
        values: values.map((v: ethers.BigNumber) => v.toString()),
        calldatas,
        voteStart: voteStart.toNumber(),
        voteEnd: voteEnd.toNumber()
      };
      this.notifyHandlers(AssetDaoEvent.ProposalCreated, eventData);
    });
    
    // VoteCast event
    this.contract.on('VoteCast', (voter, proposalId, support, weight) => {
      const eventData: VoteCastEvent = {
        voter,
        proposalId: proposalId.toNumber(),
        support,
        weight: weight.toString()
      };
      this.notifyHandlers(AssetDaoEvent.VoteCast, eventData);
    });
    
    // ProposalExecuted event
    this.contract.on('ProposalExecuted', (proposalId, executor) => {
      const eventData: ProposalExecutedEvent = {
        proposalId: proposalId.toNumber(),
        executor
      };
      this.notifyHandlers(AssetDaoEvent.ProposalExecuted, eventData);
    });
    
    // ProposalCanceled event
    this.contract.on('ProposalCanceled', (proposalId, canceler) => {
      const eventData: ProposalCanceledEvent = {
        proposalId: proposalId.toNumber(),
        canceler
      };
      this.notifyHandlers(AssetDaoEvent.ProposalCanceled, eventData);
    });
    
    // StateChanged event
    this.contract.on('StateChanged', (proposalId, oldState, newState) => {
      const eventData: StateChangedEvent = {
        proposalId: proposalId.toNumber(),
        oldState: oldState.toNumber(),
        newState: newState.toNumber()
      };
      this.notifyHandlers(AssetDaoEvent.StateChanged, eventData);
    });
  }
  
  /**
   * Register an event handler
   */
  public on(eventName: AssetDaoEvent | 'all', handler: EventHandler): void {
    if (!this.handlers[eventName]) {
      this.handlers[eventName] = [];
    }
    this.handlers[eventName].push(handler);
  }
  
  /**
   * Remove an event handler
   */
  public off(eventName: AssetDaoEvent | 'all', handler: EventHandler): void {
    if (!this.handlers[eventName]) return;
    
    this.handlers[eventName] = this.handlers[eventName].filter(h => h !== handler);
  }
  
  /**
   * Notify all registered handlers for an event
   */
  private notifyHandlers(eventName: AssetDaoEvent, data: AssetDaoEventData): void {
    // Notify handlers registered for this specific event
    if (this.handlers[eventName]) {
      this.handlers[eventName].forEach(handler => {
        try {
          handler(eventName, data);
        } catch (error) {
          console.error(`Error in handler for ${eventName}:`, error);
        }
      });
    }
    
    // Notify handlers registered for all events
    if (this.handlers['all']) {
      this.handlers['all'].forEach(handler => {
        try {
          handler(eventName, data);
        } catch (error) {
          console.error(`Error in 'all' handler for ${eventName}:`, error);
        }
      });
    }
  }
}

// Singleton instance for the event manager
let eventManagerInstance: AssetDaoEventManager | null = null;

/**
 * Initialize the event manager singleton
 */
export function initializeEventManager(contractAddress: string, wsUrl: string): AssetDaoEventManager {
  if (!eventManagerInstance) {
    eventManagerInstance = new AssetDaoEventManager(contractAddress, wsUrl);
  }
  return eventManagerInstance;
}

/**
 * Get the event manager instance
 */
export function getEventManager(): AssetDaoEventManager | null {
  return eventManagerInstance;
}

/**
 * React hook for subscribing to AssetDAO events
 */
export function useAssetDaoEvents(
  contractAddress: string,
  wsUrl: string,
  options: {
    onProposalCreated?: (data: ProposalCreatedEvent) => void;
    onVoteCast?: (data: VoteCastEvent) => void;
    onProposalExecuted?: (data: ProposalExecutedEvent) => void;
    onProposalCanceled?: (data: ProposalCanceledEvent) => void;
    onStateChanged?: (data: StateChangedEvent) => void;
    invalidateCache?: boolean;
    showNotifications?: boolean;
  } = {}
) {
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();
  const { address } = useUnifiedWallet();
  const eventManagerRef = useRef<AssetDaoEventManager | null>(null);
  
  // Generic event handler
  const handleEvent = useCallback((eventName: AssetDaoEvent, data: AssetDaoEventData) => {
    // If invalidateCache is true, invalidate relevant queries
    if (options.invalidateCache) {
      switch (eventName) {
        case AssetDaoEvent.ProposalCreated:
          queryClient.invalidateQueries(ASSET_DAO_KEYS.proposals());
          break;
        case AssetDaoEvent.VoteCast:
        case AssetDaoEvent.ProposalExecuted:
        case AssetDaoEvent.ProposalCanceled:
        case AssetDaoEvent.StateChanged:
          const proposalId = 
            'proposalId' in data ? data.proposalId : undefined;
          
          if (proposalId !== undefined) {
            queryClient.invalidateQueries(ASSET_DAO_KEYS.proposal(proposalId));
            queryClient.invalidateQueries(ASSET_DAO_KEYS.proposals());
          }
          break;
      }
    }
    
    // Show notifications if enabled
    if (options.showNotifications) {
      switch (eventName) {
        case AssetDaoEvent.ProposalCreated:
          const createdData = data as ProposalCreatedEvent;
          NotificationService.info(
            'New Proposal Created',
            `Proposal #${createdData.proposalId}: ${createdData.title}`
          );
          break;
        case AssetDaoEvent.VoteCast:
          const voteData = data as VoteCastEvent;
          // Only show notifications for the current user's votes
          if (voteData.voter.toLowerCase() === address?.toLowerCase()) {
            NotificationService.success(
              'Vote Cast Successfully',
              `Your vote on Proposal #${voteData.proposalId} was recorded`
            );
          }
          break;
        case AssetDaoEvent.ProposalExecuted:
          const executedData = data as ProposalExecutedEvent;
          NotificationService.success(
            'Proposal Executed',
            `Proposal #${executedData.proposalId} was executed`
          );
          break;
        case AssetDaoEvent.ProposalCanceled:
          const canceledData = data as ProposalCanceledEvent;
          NotificationService.info(
            'Proposal Canceled',
            `Proposal #${canceledData.proposalId} was canceled`
          );
          break;
        case AssetDaoEvent.StateChanged:
          const stateData = data as StateChangedEvent;
          NotificationService.info(
            'Proposal State Changed',
            `Proposal #${stateData.proposalId} state changed from ${ProposalState[stateData.oldState]} to ${ProposalState[stateData.newState]}`
          );
          break;
      }
    }
    
    // Call specific event handlers if provided
    switch (eventName) {
      case AssetDaoEvent.ProposalCreated:
        options.onProposalCreated?.(data as ProposalCreatedEvent);
        break;
      case AssetDaoEvent.VoteCast:
        options.onVoteCast?.(data as VoteCastEvent);
        break;
      case AssetDaoEvent.ProposalExecuted:
        options.onProposalExecuted?.(data as ProposalExecutedEvent);
        break;
      case AssetDaoEvent.ProposalCanceled:
        options.onProposalCanceled?.(data as ProposalCanceledEvent);
        break;
      case AssetDaoEvent.StateChanged:
        options.onStateChanged?.(data as StateChangedEvent);
        break;
    }
  }, [
    address,
    options.invalidateCache,
    options.showNotifications,
    options.onProposalCreated,
    options.onVoteCast,
    options.onProposalExecuted,
    options.onProposalCanceled,
    options.onStateChanged,
    queryClient
  ]);
  
  // Setup event subscriptions
  useEffect(() => {
    let eventManager = getEventManager();
    
    // Initialize event manager if not already initialized
    if (!eventManager) {
      eventManager = initializeEventManager(contractAddress, wsUrl);
    }
    
    eventManagerRef.current = eventManager;
    setIsConnected(!!eventManager);
    
    // Register event handler for all events
    eventManager.on('all', handleEvent);
    
    return () => {
      // Cleanup
      if (eventManagerRef.current) {
        eventManagerRef.current.off('all', handleEvent);
      }
    };
  }, [contractAddress, wsUrl, handleEvent]);
  
  // Return methods for manual control
  return {
    isConnected,
    reconnect: () => {
      if (eventManagerRef.current) {
        eventManagerRef.current.connectWebSocket(wsUrl);
        setIsConnected(true);
      }
    },
    disconnect: () => {
      if (eventManagerRef.current) {
        eventManagerRef.current.disconnect();
        setIsConnected(false);
      }
    }
  };
}
