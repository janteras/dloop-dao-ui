/**
 * Performance Testing Framework
 * 
 * Provides tools for comparing performance metrics between Ethers and Wagmi implementations.
 * This service helps validate the migration success and ensure that the Wagmi implementation
 * meets or exceeds the performance of the Ethers implementation.
 */

import { ContractImplementation } from '@/types/unified-contracts';
import { ApiTelemetryEvent, ContractTelemetryEvent } from '@/types/api-types';

// Define performance metric types
export interface PerformanceMetric {
  operation: string;
  implementation: ContractImplementation;
  responseTime: number;
  success: boolean;
  timestamp: number;
  params?: Record<string, any>;
  chainId?: number;
}

export interface ImplementationPerformance {
  implementation: ContractImplementation;
  metrics: ImplementationPerformanceMetrics;
}

export interface PerformanceComparison {
  operation: string;
  ethers: ImplementationPerformance['metrics'];
  wagmi: ImplementationPerformance['metrics'];
  percentImprovement: {
    averageResponseTime: number;
    p95ResponseTime: number;
    successRate: number;
  };
  timestamp: number;
  sampleSize: {
    ethers: number;
    wagmi: number;
  };
}

export interface OperationPerformance {
  operation: string;
  ethersPerformance?: ImplementationPerformanceMetrics;
  wagmiPerformance?: ImplementationPerformanceMetrics;
  hybridPerformance?: ImplementationPerformanceMetrics;
}

export interface ImplementationPerformanceMetrics {
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  successRate: number;
  sampleCount: number;
}

// Singleton class for performance testing
export class PerformanceTestingService {
  private static instance: PerformanceTestingService;
  private metrics: PerformanceMetric[] = [];
  private comparisons: Record<string, PerformanceComparison> = {};
  private operationPerformance: Record<string, OperationPerformance> = {};
  private testInProgress = false;
  private testConfig: {
    operations: string[];
    iterations: number;
    delayBetweenTests: number;
    parallel: boolean;
  } | null = null;
  
  private constructor() {
    // Initialize performance metrics storage
    this.loadFromLocalStorage();
    
    // Attach unload handler to save metrics
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.saveToLocalStorage();
      });
    }
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): PerformanceTestingService {
    if (!PerformanceTestingService.instance) {
      PerformanceTestingService.instance = new PerformanceTestingService();
    }
    return PerformanceTestingService.instance;
  }
  
  /**
   * Record a performance metric
   */
  public recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    this.updateOperationPerformance(metric);
    this.saveToLocalStorage();
  }
  
  /**
   * Record a batch of performance metrics
   */
  public recordMetrics(metrics: PerformanceMetric[]): void {
    this.metrics.push(...metrics);
    metrics.forEach(metric => this.updateOperationPerformance(metric));
    this.saveToLocalStorage();
  }
  
  /**
   * Start an automated performance test
   * @param config Test configuration
   */
  public async startAutomatedTest(config: {
    operations: string[];
    iterations: number;
    delayBetweenTests: number;
    parallel: boolean;
    testFunction: (operation: string, implementation: ContractImplementation) => Promise<PerformanceMetric>;
  }): Promise<PerformanceComparison[]> {
    if (this.testInProgress) {
      throw new Error('A performance test is already in progress');
    }
    
    this.testInProgress = true;
    this.testConfig = {
      operations: config.operations,
      iterations: config.iterations,
      delayBetweenTests: config.delayBetweenTests,
      parallel: config.parallel
    };
    
    try {
      const metrics: PerformanceMetric[] = [];
      
      // Run tests for each operation
      for (const operation of config.operations) {
        if (config.parallel) {
          // Run Ethers and Wagmi tests in parallel
          await Promise.all([
            this.runOperationTest(operation, 'ethers', config.iterations, config.delayBetweenTests, config.testFunction, metrics),
            this.runOperationTest(operation, 'wagmi', config.iterations, config.delayBetweenTests, config.testFunction, metrics)
          ]);
        } else {
          // Run tests sequentially
          await this.runOperationTest(operation, 'ethers', config.iterations, config.delayBetweenTests, config.testFunction, metrics);
          await this.runOperationTest(operation, 'wagmi', config.iterations, config.delayBetweenTests, config.testFunction, metrics);
        }
      }
      
      // Record all metrics at once
      this.recordMetrics(metrics);
      
      // Generate comparisons
      const comparisons = this.generateComparisons(config.operations);
      return comparisons;
    } finally {
      this.testInProgress = false;
      this.testConfig = null;
    }
  }
  
  /**
   * Run a test for a specific operation and implementation
   */
  private async runOperationTest(
    operation: string,
    implementation: ContractImplementation,
    iterations: number,
    delayBetweenTests: number,
    testFunction: (operation: string, implementation: ContractImplementation) => Promise<PerformanceMetric>,
    metrics: PerformanceMetric[]
  ): Promise<void> {
    for (let i = 0; i < iterations; i++) {
      try {
        const metric = await testFunction(operation, implementation);
        metrics.push(metric);
        
        if (delayBetweenTests > 0 && i < iterations - 1) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenTests));
        }
      } catch (error) {
        console.error(`Error in test iteration ${i} for ${operation} with ${implementation}:`, error);
        
        // Record error metric
        metrics.push({
          operation,
          implementation,
          responseTime: 0,
          success: false,
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * Generate performance comparisons for specified operations
   */
  public generateComparisons(operations?: string[]): PerformanceComparison[] {
    const opsToCompare = operations || Object.keys(this.operationPerformance);
    const comparisons: PerformanceComparison[] = [];
    
    for (const operation of opsToCompare) {
      const perfData = this.operationPerformance[operation];
      if (!perfData || !perfData.ethersPerformance || !perfData.wagmiPerformance) {
        continue;
      }
      
      const ethersMetrics = perfData.ethersPerformance;
      const wagmiMetrics = perfData.wagmiPerformance;
      
      // Calculate percentage improvements
      const ethersAvgRt = ethersMetrics.averageResponseTime || 1; // Avoid division by zero
      const ethersP95Rt = ethersMetrics.p95ResponseTime || 1; // Avoid division by zero
      const ethersSuccessRate = ethersMetrics.successRate || 1; // Avoid division by zero
      
      const avgRtImprovement = ((ethersAvgRt - wagmiMetrics.averageResponseTime) / ethersAvgRt) * 100;
      const p95RtImprovement = ((ethersP95Rt - wagmiMetrics.p95ResponseTime) / ethersP95Rt) * 100;
      const successRateImprovement = ((wagmiMetrics.successRate - ethersSuccessRate) / ethersSuccessRate) * 100;
      
      const comparison: PerformanceComparison = {
        operation,
        ethers: ethersMetrics,
        wagmi: wagmiMetrics,
        percentImprovement: {
          averageResponseTime: avgRtImprovement,
          p95ResponseTime: p95RtImprovement,
          successRate: successRateImprovement
        },
        timestamp: Date.now(),
        sampleSize: {
          ethers: ethersMetrics.sampleCount,
          wagmi: wagmiMetrics.sampleCount
        }
      };
      
      this.comparisons[operation] = comparison;
      comparisons.push(comparison);
    }
    
    return comparisons;
  }
  
  /**
   * Get performance metrics for a specific operation
   */
  public getOperationMetrics(operation: string): PerformanceMetric[] {
    return this.metrics.filter(metric => metric.operation === operation);
  }
  
  /**
   * Get performance comparison for a specific operation
   */
  public getComparison(operation: string): PerformanceComparison | null {
    return this.comparisons[operation] || null;
  }
  
  /**
   * Get all performance comparisons
   */
  public getAllComparisons(): PerformanceComparison[] {
    return Object.values(this.comparisons);
  }
  
  /**
   * Clear all metrics data
   */
  public clearMetrics(): void {
    this.metrics = [];
    this.comparisons = {};
    this.operationPerformance = {};
    this.saveToLocalStorage();
  }
  
  /**
   * Generate a performance report
   */
  public generateReport(): string {
    const comparisons = this.generateComparisons();
    let report = '# Ethers vs Wagmi Performance Report\n\n';
    
    report += `Generated: ${new Date().toISOString()}\n\n`;
    report += `Total operations compared: ${comparisons.length}\n\n`;
    
    report += '## Summary\n\n';
    
    if (comparisons.length === 0) {
      report += 'No comparison data available.\n';
      return report;
    }
    
    // Calculate overall metrics
    const avgRtImprovements = comparisons.map(c => c.percentImprovement.averageResponseTime);
    const overallAvgRtImprovement = avgRtImprovements.length > 0 ? 
      avgRtImprovements.reduce((a, b) => a + b, 0) / avgRtImprovements.length : 0;
    
    const p95RtImprovements = comparisons.map(c => c.percentImprovement.p95ResponseTime);
    const overallP95RtImprovement = p95RtImprovements.length > 0 ?
      p95RtImprovements.reduce((a, b) => a + b, 0) / p95RtImprovements.length : 0;
    
    const successRateImprovements = comparisons.map(c => c.percentImprovement.successRate);
    const overallSuccessRateImprovement = successRateImprovements.length > 0 ?
      successRateImprovements.reduce((a, b) => a + b, 0) / successRateImprovements.length : 0;
    
    report += `Overall average response time improvement: ${overallAvgRtImprovement.toFixed(2)}%\n`;
    report += `Overall p95 response time improvement: ${overallP95RtImprovement.toFixed(2)}%\n`;
    report += `Overall success rate improvement: ${overallSuccessRateImprovement.toFixed(2)}%\n\n`;
    
    report += '## Detailed Comparisons\n\n';
    
    comparisons.forEach(comparison => {
      report += `### ${comparison.operation}\n\n`;
      report += '| Metric | Ethers | Wagmi | Improvement |\n';
      report += '|--------|--------|-------|-------------|\n';
      report += `| Avg Response Time | ${comparison.ethers.averageResponseTime.toFixed(2)}ms | ${comparison.wagmi.averageResponseTime.toFixed(2)}ms | ${comparison.percentImprovement.averageResponseTime.toFixed(2)}% |\n`;
      report += `| P95 Response Time | ${comparison.ethers.p95ResponseTime.toFixed(2)}ms | ${comparison.wagmi.p95ResponseTime.toFixed(2)}ms | ${comparison.percentImprovement.p95ResponseTime.toFixed(2)}% |\n`;
      report += `| Success Rate | ${comparison.ethers.successRate.toFixed(2)}% | ${comparison.wagmi.successRate.toFixed(2)}% | ${comparison.percentImprovement.successRate.toFixed(2)}% |\n`;
      report += `| Sample Count | ${comparison.sampleSize.ethers} | ${comparison.sampleSize.wagmi} | - |\n\n`;
    });
    
    return report;
  }
  
  /**
   * Update operation performance metrics with a new metric
   */
  private updateOperationPerformance(metric: PerformanceMetric): void {
    const { operation, implementation, responseTime, success } = metric;
    
    // Get or create operation performance data
    let operationPerf = this.operationPerformance[operation];
    if (!operationPerf) {
      operationPerf = { operation };
      this.operationPerformance[operation] = operationPerf;
    }
    
    // Get or create implementation performance data
    const implKey = `${implementation}Performance` as keyof OperationPerformance;
    let implPerf = operationPerf[implKey] as ImplementationPerformanceMetrics | undefined;
    
    if (!implPerf) {
      implPerf = {
        averageResponseTime: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        successRate: 0,
        sampleCount: 0
      };
    }
    
    // Get all metrics for this operation and implementation
    const metrics = this.metrics.filter(
      m => m.operation === operation && m.implementation === implementation
    );
    
    // Add the new metric
    metrics.push(metric);
    
    // Calculate metrics
    const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const successCount = metrics.filter(m => m.success).length;
    
    implPerf.sampleCount = metrics.length;
    implPerf.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    implPerf.successRate = (successCount / metrics.length) * 100;
    
    // Calculate percentiles
    if (responseTimes.length > 0) {
      implPerf.p50ResponseTime = this.calculatePercentile(responseTimes, 50);
      implPerf.p95ResponseTime = this.calculatePercentile(responseTimes, 95);
      implPerf.p99ResponseTime = this.calculatePercentile(responseTimes, 99);
    }
    
    // Update the implementation performance
    operationPerf[implKey] = implPerf as any; // Type assertion to avoid circular reference issues
  }
  
  /**
   * Calculate a percentile value from an array of numbers
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, Math.min(index, values.length - 1))];
  }
  
  /**
   * Save metrics to local storage
   */
  private saveToLocalStorage(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('performance-metrics', JSON.stringify({
          metrics: this.metrics,
          comparisons: this.comparisons,
          operationPerformance: this.operationPerformance,
          lastUpdated: Date.now()
        }));
      } catch (error) {
        console.warn('Failed to save performance metrics to localStorage:', error);
      }
    }
  }
  
  /**
   * Load metrics from local storage
   */
  private loadFromLocalStorage(): void {
    if (typeof localStorage !== 'undefined') {
      try {
        const data = localStorage.getItem('performance-metrics');
        if (data) {
          const parsed = JSON.parse(data);
          this.metrics = parsed.metrics || [];
          this.comparisons = parsed.comparisons || {};
          this.operationPerformance = parsed.operationPerformance || {};
        }
      } catch (error) {
        console.warn('Failed to load performance metrics from localStorage:', error);
      }
    }
  }
}

// Export singleton instance
export const performanceTesting = PerformanceTestingService.getInstance();

/**
 * Custom hook for testing Ethers vs Wagmi performance
 */
export function usePerformanceTesting() {
  return {
    recordMetric: performanceTesting.recordMetric.bind(performanceTesting),
    recordMetrics: performanceTesting.recordMetrics.bind(performanceTesting),
    startAutomatedTest: performanceTesting.startAutomatedTest.bind(performanceTesting),
    generateComparisons: performanceTesting.generateComparisons.bind(performanceTesting),
    getOperationMetrics: performanceTesting.getOperationMetrics.bind(performanceTesting),
    getComparison: performanceTesting.getComparison.bind(performanceTesting),
    getAllComparisons: performanceTesting.getAllComparisons.bind(performanceTesting),
    clearMetrics: performanceTesting.clearMetrics.bind(performanceTesting),
    generateReport: performanceTesting.generateReport.bind(performanceTesting),
  };
}
