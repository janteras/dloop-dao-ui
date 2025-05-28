/**
 * API Telemetry Service
 * 
 * Provides comprehensive tracking of API health and performance metrics,
 * with support for batched reporting to minimize network overhead.
 */

import { ApiTelemetryEvent, TelemetryReport } from '@/types/api-types';
import { isDevelopment } from '@/utils/environment';

// Configuration constants
const BUFFER_FLUSH_INTERVAL = 30000; // 30 seconds
const BUFFER_SIZE_LIMIT = 50; // Max events before forcing flush
const RETENTION_PERIOD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Local storage key for persisting events
const STORAGE_KEY = 'dloop-api-telemetry';

/**
 * API Telemetry Service for tracking API health and performance
 */
export class ApiTelemetryService {
  private static instance: ApiTelemetryService;
  private flushInterval: NodeJS.Timeout | null = null;
  private metricsBuffer: ApiTelemetryEvent[] = [];
  private eventsHistory: ApiTelemetryEvent[] = [];
  private lastFlushTime: number = 0;
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.loadFromStorage();
    this.startFlushInterval();
    
    // Add window event listeners for page unload to save telemetry
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.saveToStorage();
      });
    }
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ApiTelemetryService {
    if (!ApiTelemetryService.instance) {
      ApiTelemetryService.instance = new ApiTelemetryService();
    }
    return ApiTelemetryService.instance;
  }
  
  /**
   * Record an API event in the telemetry system
   * @param event The API event to record
   */
  public recordApiEvent(event: ApiTelemetryEvent): void {
    // Add to buffer for eventual sending
    this.metricsBuffer.push(event);
    
    // Add to history for local reporting
    this.eventsHistory.push(event);
    
    // Prune old events from history
    this.pruneHistory();
    
    // If buffer exceeds limit, flush immediately
    if (this.metricsBuffer.length >= BUFFER_SIZE_LIMIT) {
      this.flushMetrics();
    }
    
    // Log in development mode
    if (isDevelopment()) {
      console.debug('API Telemetry Event:', event);
    }
  }
  
  /**
   * Flush metrics buffer to the backend
   */
  public async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;
    
    const eventsToSend = [...this.metricsBuffer];
    this.metricsBuffer = []; // Clear buffer
    this.lastFlushTime = Date.now();
    
    try {
      // In production, send to actual endpoint
      if (!isDevelopment()) {
        await fetch('/api/telemetry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            events: eventsToSend,
            source: 'assetdao-client',
            version: process.env.VITE_APP_VERSION || 'unknown',
            timestamp: Date.now()
          }),
        });
      }
      
      // Save to storage after successful flush
      this.saveToStorage();
      
    } catch (error) {
      console.error('Failed to send telemetry data:', error);
      // Add events back to buffer to retry later
      this.metricsBuffer = [...this.metricsBuffer, ...eventsToSend];
    }
  }
  
  /**
   * Get API health report based on collected telemetry
   */
  public async getApiHealthReport(): Promise<TelemetryReport> {
    try {
      // In production, fetch from the API
      if (!isDevelopment()) {
        const response = await fetch('/api/telemetry/report');
        return await response.json();
      }
      
      // In development, generate a report from local data
      return this.generateLocalReport();
    } catch (error) {
      console.error('Failed to fetch API health report:', error);
      // Return a basic report with local data as fallback
      return this.generateLocalReport();
    }
  }
  
  /**
   * Generate a local report from collected telemetry
   */
  private generateLocalReport(): TelemetryReport {
    // Calculate summary statistics
    const apiEvents = [...this.eventsHistory];
    const totalRequests = apiEvents.length;
    const successfulRequests = apiEvents.filter(e => e.status >= 200 && e.status < 300).length;
    const cachedRequests = apiEvents.filter(e => e.cached).length;
    const totalResponseTime = apiEvents.reduce((sum, e) => sum + e.responseTime, 0);
    
    return {
      apiEvents,
      contractEvents: [],
      migrationMetrics: [],
      summary: {
        totalApiRequests: totalRequests,
        apiSuccessRate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
        averageApiResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
        cacheHitRate: totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0,
        totalContractCalls: 0,
        contractSuccessRate: 0,
        averageContractResponseTime: 0,
        migrationProgress: 0
      },
      period: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      }
    };
  }
  
  /**
   * Start the interval to periodically flush metrics
   */
  private startFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    this.flushInterval = setInterval(
      () => this.flushMetrics(), 
      BUFFER_FLUSH_INTERVAL
    );
  }
  
  /**
   * Stop the flush interval
   */
  public cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush any remaining metrics
    this.flushMetrics();
  }
  
  /**
   * Remove events older than retention period
   */
  private pruneHistory(): void {
    const cutoffTime = Date.now() - RETENTION_PERIOD;
    this.eventsHistory = this.eventsHistory.filter(event => event.timestamp >= cutoffTime);
  }
  
  /**
   * Save telemetry data to local storage
   */
  private saveToStorage(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          eventsHistory: this.eventsHistory,
          lastUpdated: Date.now()
        }));
      } catch (error) {
        console.warn('Failed to save telemetry data to localStorage:', error);
      }
    }
  }
  
  /**
   * Load telemetry data from local storage
   */
  private loadFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          this.eventsHistory = data.eventsHistory || [];
          // Prune old events after loading
          this.pruneHistory();
        }
      } catch (error) {
        console.warn('Failed to load telemetry data from localStorage:', error);
      }
    }
  }
}

// Export singleton instance
export const apiTelemetry = ApiTelemetryService.getInstance();
