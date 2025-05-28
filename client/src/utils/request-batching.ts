/**
 * Request Batching Utility
 * 
 * Provides functions for batching multiple blockchain requests into single calls
 * to reduce network overhead and improve performance
 */

import { Contract } from 'ethers';
import { useUnifiedAssetDaoContract } from '@/hooks/unified/useUnifiedAssetDaoContract';
import { Proposal } from '@/services/enhanced-assetDaoService';

/**
 * Interface for batch request options
 */
export interface BatchRequestOptions {
  maxBatchSize?: number;
  retryCount?: number;
  timeout?: number;
}

/**
 * Class that handles batching of blockchain requests
 */
export class RequestBatcher {
  private batchQueue: Array<{
    method: string;
    params: any[];
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private options: Required<BatchRequestOptions>;
  private contract: Contract;

  constructor(contract: Contract, options: BatchRequestOptions = {}) {
    this.contract = contract;
    this.options = {
      maxBatchSize: options.maxBatchSize || 50,
      retryCount: options.retryCount || 3,
      timeout: options.timeout || 100, // ms
    };
  }

  /**
   * Adds a request to the batch queue
   * @param method Contract method to call
   * @param params Parameters for the method
   * @returns Promise that resolves with the result
   */
  public queueRequest<T>(method: string, params: any[] = []): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        method,
        params,
        resolve,
        reject,
      });

      this.scheduleBatch();
    });
  }

  /**
   * Schedules a batch to be executed after a timeout
   */
  private scheduleBatch(): void {
    if (this.batchTimeout !== null) {
      return; // Already scheduled
    }

    this.batchTimeout = setTimeout(() => {
      this.executeBatch();
    }, this.options.timeout);
  }

  /**
   * Executes all queued requests in a batch
   */
  private async executeBatch(): void {
    const queue = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    if (queue.length === 0) {
      return;
    }

    // Group requests by method
    const methodGroups = this.groupRequestsByMethod(queue);

    // Process each method group
    for (const [method, requests] of Object.entries(methodGroups)) {
      try {
        // Split into chunks if needed
        const chunks = this.chunkRequests(requests, this.options.maxBatchSize);
        
        for (const chunk of chunks) {
          try {
            await this.processChunk(method, chunk);
          } catch (error) {
            console.error(`Error processing batch chunk for ${method}:`, error);
            
            // Reject all requests in the failed chunk
            chunk.forEach(req => req.reject(error));
          }
        }
      } catch (error) {
        console.error(`Error processing batch for ${method}:`, error);
      }
    }
  }

  /**
   * Groups requests by method name
   */
  private groupRequestsByMethod(queue: typeof this.batchQueue) {
    const groups: Record<string, typeof this.batchQueue> = {};
    
    for (const request of queue) {
      if (!groups[request.method]) {
        groups[request.method] = [];
      }
      groups[request.method].push(request);
    }
    
    return groups;
  }

  /**
   * Splits requests into chunks of a specified size
   */
  private chunkRequests(requests: typeof this.batchQueue, chunkSize: number) {
    const chunks: typeof this.batchQueue[] = [];
    
    for (let i = 0; i < requests.length; i += chunkSize) {
      chunks.push(requests.slice(i, i + chunkSize));
    }
    
    return chunks;
  }

  /**
   * Processes a chunk of requests for a given method
   */
  private async processChunk(method: string, requests: typeof this.batchQueue) {
    // For methods that support batching, we can use multicall
    if (this.supportsBatchProcessing(method)) {
      await this.processBatchableMethod(method, requests);
    } else {
      // For methods that don't support batching, process individually
      await this.processIndividualRequests(method, requests);
    }
  }

  /**
   * Processes a method that supports batch processing (e.g., via multicall)
   */
  private async processBatchableMethod(method: string, requests: typeof this.batchQueue) {
    try {
      // Extract all parameters for the batch call
      const allParams = requests.map(req => req.params);
      
      // Make a single batch call
      const results = await this.contract[`${method}Batch`](allParams);
      
      // Resolve each request with its corresponding result
      requests.forEach((req, index) => {
        req.resolve(results[index]);
      });
    } catch (error) {
      // If the batch call fails, fall back to individual processing
      console.warn(`Batch call failed for ${method}, falling back to individual calls:`, error);
      await this.processIndividualRequests(method, requests);
    }
  }

  /**
   * Processes requests individually
   */
  private async processIndividualRequests(method: string, requests: typeof this.batchQueue) {
    // Process in parallel but limit concurrency
    const promises = requests.map(async (req) => {
      try {
        const result = await this.contract[method](...req.params);
        req.resolve(result);
      } catch (error) {
        req.reject(error);
      }
    });
    
    await Promise.allSettled(promises);
  }

  /**
   * Checks if a method supports batch processing
   */
  private supportsBatchProcessing(method: string): boolean {
    return typeof this.contract[`${method}Batch`] === 'function';
  }

  /**
   * Cancels all pending requests
   */
  public cancelAll(): void {
    if (this.batchTimeout !== null) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    const error = new Error('Batch requests cancelled');
    this.batchQueue.forEach(request => request.reject(error));
    this.batchQueue = [];
  }
}

/**
 * Helper functions for common batched operations
 */

/**
 * Batches multiple proposal requests into a single call
 * @param proposalIds Array of proposal IDs to fetch
 * @returns Promise resolving to an array of proposals
 */
export async function batchGetProposals(proposalIds: number[]): Promise<Proposal[]> {
  const { contract, implementation } = useUnifiedAssetDaoContract();
  
  if (!contract || !proposalIds.length) {
    return [];
  }
  
  const batcher = new RequestBatcher(contract);
  
  const promises = proposalIds.map(id => 
    batcher.queueRequest<Proposal>('getProposal', [id])
  );
  
  return Promise.all(promises);
}

/**
 * Batches multiple token balance requests into a single call
 * @param tokenAddresses Array of token addresses
 * @param userAddress User address to check balances for
 * @returns Promise resolving to an array of token balances
 */
export async function batchGetTokenBalances(
  tokenAddresses: string[],
  userAddress: string
): Promise<string[]> {
  const { contract } = useUnifiedAssetDaoContract();
  
  if (!contract || !tokenAddresses.length || !userAddress) {
    return [];
  }
  
  const batcher = new RequestBatcher(contract);
  
  const promises = tokenAddresses.map(tokenAddress => 
    batcher.queueRequest<string>('getTokenBalance', [tokenAddress, userAddress])
  );
  
  return Promise.all(promises);
}

/**
 * Batches multiple voting power requests into a single call
 * @param proposalIds Array of proposal IDs
 * @param userAddress User address to check voting power for
 * @returns Promise resolving to an array of voting powers
 */
export async function batchGetVotingPower(
  proposalIds: number[],
  userAddress: string
): Promise<string[]> {
  const { contract } = useUnifiedAssetDaoContract();
  
  if (!contract || !proposalIds.length || !userAddress) {
    return [];
  }
  
  const batcher = new RequestBatcher(contract);
  
  const promises = proposalIds.map(proposalId => 
    batcher.queueRequest<string>('getVotingPower', [proposalId, userAddress])
  );
  
  return Promise.all(promises);
}

/**
 * Hook for creating a request batcher for custom use cases
 * @param options Batch request options
 * @returns A RequestBatcher instance
 */
export function useBatcher(options: BatchRequestOptions = {}): RequestBatcher | null {
  const { contract } = useUnifiedAssetDaoContract();
  
  if (!contract) {
    return null;
  }
  
  return new RequestBatcher(contract, options);
}
