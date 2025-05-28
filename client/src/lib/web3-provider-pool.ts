import { ethers } from 'ethers';

/**
 * Cache configuration for web3 provider connections
 * @interface ProviderCacheConfig
 */
interface ProviderCacheConfig {
  /** Maximum time (in ms) to keep a cached provider instance */
  ttl: number;
  /** Maximum number of providers to keep in cache */
  maxSize: number;
}

/**
 * Cached provider entry
 * @interface CachedProvider
 */
interface CachedProvider {
  /** The provider instance */
  provider: ethers.JsonRpcProvider;
  /** When the provider was last accessed */
  lastAccessed: number;
  /** When the provider was created */
  created: number;
  /** Network information */
  network: string;
  /** Flag indicating if the provider is connected */
  isConnected: boolean;
}

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_CONFIG: ProviderCacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 5,
};

/**
 * A singleton class that manages and caches web3 provider connections
 * to improve performance and reduce redundant instantiations.
 */
class Web3ProviderPool {
  private static instance: Web3ProviderPool;
  private providerCache: Map<string, CachedProvider> = new Map();
  private config: ProviderCacheConfig;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Private constructor for singleton pattern
   * @param config - Cache configuration
   */
  private constructor(config: ProviderCacheConfig = DEFAULT_CACHE_CONFIG) {
    this.config = config;
    this.startCleanupInterval();
  }

  /**
   * Get the singleton instance
   * @param config - Optional configuration override
   * @returns The Web3ProviderPool instance
   */
  public static getInstance(config?: ProviderCacheConfig): Web3ProviderPool {
    if (!Web3ProviderPool.instance) {
      Web3ProviderPool.instance = new Web3ProviderPool(config);
    }
    return Web3ProviderPool.instance;
  }

  /**
   * Start the cleanup interval to remove expired providers
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupCache();
    }, Math.min(this.config.ttl / 2, 60000)); // Run at least every minute
  }

  /**
   * Clean up expired or excess provider instances
   */
  private cleanupCache(): void {
    const now = Date.now();
    
    // First, remove expired providers
    for (const [url, entry] of this.providerCache.entries()) {
      if (now - entry.lastAccessed > this.config.ttl) {
        this.providerCache.delete(url);
      }
    }
    
    // If we still have too many, remove the oldest by last accessed time
    if (this.providerCache.size > this.config.maxSize) {
      const entries = Array.from(this.providerCache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      // Remove oldest entries until we're under the limit
      const excessCount = this.providerCache.size - this.config.maxSize;
      for (let i = 0; i < excessCount; i++) {
        this.providerCache.delete(entries[i][0]);
      }
    }
  }

  /**
   * Get a provider for the specified RPC URL
   * @param url - The RPC URL
   * @returns A cached or new provider
   */
  public getProvider(url: string): ethers.JsonRpcProvider {
    // Check if we have a cached provider for this URL
    if (this.providerCache.has(url)) {
      const entry = this.providerCache.get(url)!;
      entry.lastAccessed = Date.now();
      return entry.provider;
    }
    
    // Create a new provider
    console.log(`Creating new JsonRpcProvider for ${url}`);
    const provider = new ethers.JsonRpcProvider(url);
    
    // Cache the provider
    this.providerCache.set(url, {
      provider,
      lastAccessed: Date.now(),
      created: Date.now(),
      network: 'unknown', // Will be updated when network is determined
      isConnected: false,
    });
    
    // Initialize provider and update cache with network info
    this.initializeProvider(url, provider);
    
    return provider;
  }

  /**
   * Initialize a provider by fetching its network information
   * @param url - The RPC URL
   * @param provider - The provider instance
   */
  private async initializeProvider(url: string, provider: ethers.JsonRpcProvider): Promise<void> {
    try {
      // Get network information
      const network = await provider.getNetwork();
      
      // Update cache entry
      const entry = this.providerCache.get(url);
      if (entry) {
        entry.network = network.name;
        entry.isConnected = true;
      }
    } catch (error) {
      console.error(`Failed to initialize provider for ${url}:`, error);
      
      // Remove from cache if initialization failed
      this.providerCache.delete(url);
    }
  }

  /**
   * Get a browser provider (for wallet connections)
   * @returns A browser provider instance
   */
  public getBrowserProvider(): ethers.BrowserProvider | null {
    // Browser provider is not cached as it's tied to the user's wallet
    if (typeof window !== 'undefined' && window.ethereum) {
      return new ethers.BrowserProvider(window.ethereum);
    }
    return null;
  }

  /**
   * Clear the entire provider cache
   */
  public clearCache(): void {
    this.providerCache.clear();
  }

  /**
   * Get statistics about the provider cache
   * @returns Cache statistics
   */
  public getCacheStats() {
    return {
      size: this.providerCache.size,
      maxSize: this.config.maxSize,
      ttl: this.config.ttl,
      providers: Array.from(this.providerCache.entries()).map(([url, entry]) => ({
        url,
        network: entry.network,
        isConnected: entry.isConnected,
        age: Date.now() - entry.created,
        lastAccessed: Date.now() - entry.lastAccessed,
      })),
    };
  }
}

/**
 * Returns a cached provider for the given URL or creates a new one
 * @param rpcUrl - The RPC URL
 * @returns An ethers provider instance
 */
export function getPooledProvider(rpcUrl: string): ethers.JsonRpcProvider {
  return Web3ProviderPool.getInstance().getProvider(rpcUrl);
}

/**
 * Gets a browser provider for wallet connections
 * @returns A browser provider or null if not available
 */
export function getBrowserProvider(): ethers.BrowserProvider | null {
  return Web3ProviderPool.getInstance().getBrowserProvider();
}

/**
 * Clear the provider cache
 */
export function clearProviderCache(): void {
  Web3ProviderPool.getInstance().clearCache();
}

/**
 * Get provider cache statistics
 * @returns Cache statistics
 */
export function getProviderCacheStats() {
  return Web3ProviderPool.getInstance().getCacheStats();
}

/**
 * Default RPC URL for Sepolia testnet
 */
export const DEFAULT_SEPOLIA_RPC_URL = 'https://sepolia.infura.io/v3/';

/**
 * Get the default Sepolia provider
 * @returns A provider connected to Sepolia
 */
export function getSepoliaProvider(): ethers.JsonRpcProvider {
  return getPooledProvider(DEFAULT_SEPOLIA_RPC_URL);
}

// Add a global type for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
