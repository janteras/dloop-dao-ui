/**
 * Implementation Factory Pattern
 * 
 * This utility enables a unified approach to handling multiple implementations
 * of the same component (Ethers and Wagmi) with a consistent interface.
 * It follows the unified contract access pattern established during the migration.
 */

import React from 'react';
import { useFeatureFlag } from '@/config/feature-flags';

/**
 * Creates a unified component that can switch between Ethers and Wagmi implementations
 * based on feature flags or explicit implementation choice.
 * 
 * @param EthersComponent Original Ethers-based component implementation
 * @param WagmiComponent Wagmi-based component implementation
 * @param featureKey Feature flag key to check for implementation decision
 * @returns A component that renders either implementation based on feature flags
 */
export function createImplementationComponent<P>(
  EthersComponent: React.ComponentType<P>,
  WagmiComponent: React.ComponentType<P>,
  featureKey: string
) {
  return (props: P & { forceImplementation?: 'ethers' | 'wagmi' }) => {
    const { forceImplementation, ...componentProps } = props as any;
    const useWagmi = useFeatureFlag(featureKey) || forceImplementation === 'wagmi';
    
    // Choose the appropriate component based on feature flag or forced implementation
    const Component = useWagmi ? WagmiComponent : EthersComponent;
    
    return <Component {...componentProps} />;
  };
}

/**
 * Shared props interface for implementation components with telemetry
 */
export interface ImplementationProps {
  /**
   * Force a specific implementation regardless of feature flags
   */
  forceImplementation?: 'ethers' | 'wagmi';
  
  /**
   * Optional callback for implementation-specific telemetry
   */
  onTelemetry?: (data: TelemetryData) => void;
}

/**
 * Telemetry data interface for tracking implementation performance
 */
export interface TelemetryData {
  implementation: 'ethers' | 'wagmi';
  component: string;
  action?: string;
  duration?: number;
  status: 'success' | 'error' | 'pending';
  error?: Error;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Creates telemetry data with implementation details
 */
export function createTelemetryData(
  implementation: 'ethers' | 'wagmi',
  component: string,
  status: 'success' | 'error' | 'pending',
  options: Partial<Omit<TelemetryData, 'implementation' | 'component' | 'status' | 'timestamp'>> = {}
): TelemetryData {
  return {
    implementation,
    component,
    status,
    timestamp: Date.now(),
    ...options
  };
}

/**
 * Utility to track implementation performance
 */
export function trackImplementationPerformance<T>(
  implementation: 'ethers' | 'wagmi',
  component: string,
  action: string,
  fn: () => Promise<T>,
  onTelemetry?: (data: TelemetryData) => void
): Promise<T> {
  const startTime = performance.now();
  
  // Send initial telemetry data
  const pendingData = createTelemetryData(implementation, component, 'pending', {
    action,
    metadata: { startTime }
  });
  
  onTelemetry?.(pendingData);
  
  return fn()
    .then(result => {
      // Calculate duration and send success telemetry
      const duration = performance.now() - startTime;
      const successData = createTelemetryData(implementation, component, 'success', {
        action,
        duration,
        metadata: { startTime }
      });
      
      onTelemetry?.(successData);
      return result;
    })
    .catch(error => {
      // Calculate duration and send error telemetry
      const duration = performance.now() - startTime;
      const errorData = createTelemetryData(implementation, component, 'error', {
        action,
        duration,
        error,
        metadata: { startTime }
      });
      
      onTelemetry?.(errorData);
      throw error;
    });
}
