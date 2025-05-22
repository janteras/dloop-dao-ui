import { useCallback, useEffect, useRef } from 'react';
import { useAppConfig, MigrationMetric } from '@/config/app-config';
import { Web3Implementation } from '@/types/web3-types';

export interface TelemetryOptions {
  component: string;
  implementation: Web3Implementation;
  alertThresholds?: {
    responseTime?: number;  // Alert if response time exceeds this value (ms)
    errorRate?: number;     // Alert if error rate exceeds this value (%)
  }
}

export interface MigrationAlert {
  id: string;
  component: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: number;
}

/**
 * Hook to monitor and collect telemetry data for migration components
 * 
 * @param options Configuration options for telemetry collection
 * @returns Functions to record performance metrics and errors
 */
export function useMigrationTelemetry(options: TelemetryOptions) {
  const { component, implementation, alertThresholds = {} } = options;
  const { recordMetric, getMetricsForComponent } = useAppConfig();
  
  // Keep track of metrics for alert generation
  const metrics = useRef<{
    startTime?: number;
    errorCount: number;
    totalCalls: number;
    alerts: MigrationAlert[];
  }>({
    errorCount: 0,
    totalCalls: 0,
    alerts: []
  });
  
  // Clean up metrics at regular intervals
  useEffect(() => {
    const pruneInterval = setInterval(() => {
      // Reset counters every hour to get fresh data
      metrics.current = {
        errorCount: 0,
        totalCalls: 0,
        alerts: metrics.current.alerts
      };
    }, 60 * 60 * 1000); // 1 hour
    
    return () => clearInterval(pruneInterval);
  }, []);
  
  /**
   * Start timing an operation
   */
  const startTiming = useCallback(() => {
    metrics.current.startTime = performance.now();
    metrics.current.totalCalls++;
  }, []);
  
  /**
   * End timing and record the metric
   */
  const endTiming = useCallback((status: 'not-started' | 'in-progress' | 'completed' = 'completed') => {
    if (!metrics.current.startTime) return undefined;
    
    const endTime = performance.now();
    const responseTime = endTime - metrics.current.startTime;
    
    // Record the metric
    const metric: MigrationMetric = {
      component,
      implementation,
      timestamp: Date.now(),
      responseTime,
      errorRate: metrics.current.totalCalls > 0 
        ? (metrics.current.errorCount / metrics.current.totalCalls) * 100 
        : 0,
      status
    };
    
    recordMetric(metric);
    
    // Check for alerts based on thresholds
    if (alertThresholds.responseTime && responseTime > alertThresholds.responseTime) {
      createAlert({
        message: `Response time (${responseTime.toFixed(2)}ms) exceeds threshold (${alertThresholds.responseTime}ms)`,
        severity: 'warning'
      });
    }
    
    // Reset timing
    metrics.current.startTime = undefined;
    
    return responseTime as number;
  }, [component, implementation, recordMetric, alertThresholds]);
  
  /**
   * Record an error
   */
  const recordError = useCallback((error: unknown) => {
    metrics.current.errorCount++;
    
    // Calculate current error rate
    const errorRate = metrics.current.totalCalls > 0 
      ? (metrics.current.errorCount / metrics.current.totalCalls) * 100 
      : 0;
    
    // Check if error rate exceeds threshold
    if (alertThresholds.errorRate && errorRate > alertThresholds.errorRate) {
      createAlert({
        message: `Error rate (${errorRate.toFixed(2)}%) exceeds threshold (${alertThresholds.errorRate}%)`,
        severity: 'error'
      });
    }
    
    // Log error for debugging
    console.error(`[Migration Telemetry] Error in ${component} (${implementation}):`, error);
    
    return errorRate;
  }, [component, implementation, alertThresholds]);
  
  /**
   * Create an alert about performance or errors
   */
  const createAlert = useCallback(({ message, severity }: Pick<MigrationAlert, 'message' | 'severity'>) => {
    const alert: MigrationAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      component,
      message,
      severity,
      timestamp: Date.now()
    };
    
    metrics.current.alerts.push(alert);
    
    // Also log to console based on severity level
    if (severity === 'error') {
      console.error(`[Migration Alert] ${component}: ${message}`);
    } else if (severity === 'warning') {
      console.warn(`[Migration Alert] ${component}: ${message}`);
    } else {
      console.info(`[Migration Alert] ${component}: ${message}`);
    }
    
    return alert;
  }, [component]);
  
  /**
   * Get recent performance metrics for this component
   */
  const getMetrics = useCallback(() => {
    return getMetricsForComponent(component);
  }, [component, getMetricsForComponent]);
  
  /**
   * Get active alerts for this component
   */
  const getAlerts = useCallback(() => {
    return metrics.current.alerts;
  }, []);
  
  /**
   * Clear alerts for this component
   */
  const clearAlerts = useCallback(() => {
    metrics.current.alerts = [];
  }, []);
  
  return {
    startTiming,
    endTiming,
    recordError,
    getMetrics,
    getAlerts,
    clearAlerts,
    createAlert
  };
}
