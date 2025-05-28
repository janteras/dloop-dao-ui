# AssetDAO Mock Data Removal Strategy

## Overview

This document outlines the strategy for safely removing mock data dependencies from the AssetDAO module as part of the Ethers-to-Wagmi migration and production readiness initiative. The goal is to ensure a smooth transition from development mock data to production API data without disrupting the user experience or causing application failures.

## Current State

The AssetDAO module currently relies on mock data in the following areas:

1. **API Responses**: Mock data is used when real API endpoints are unavailable or unstable
2. **Contract Interactions**: Test contract responses are used during development
3. **UI Components**: Some components have hardcoded fallback values

## Challenges

Transitioning from mock data presents several challenges:

1. **Data Structure Differences**: Real API data may have different structure than mock data
2. **Partial API Availability**: Some endpoints may be available while others are still in development
3. **Environment Differences**: Development, staging, and production environments may have different API availability
4. **Error Handling**: Production code needs robust error handling for real-world conditions
5. **Fallback Behavior**: Application must gracefully degrade when APIs are unavailable

## Phased Removal Strategy

### Phase 1: Telemetry and API Validation (Week 1)

1. **Implement API Telemetry**:
   - Track all mock data usage with `apiTelemetry.recordApiEvent()`
   - Add mock data flag to telemetry events to identify mock vs. real data usage
   - Track error rates and response times for both mock and real data

2. **Add API Validation**:
   - Implement TypeScript interface validation for all API responses
   - Add runtime type checking for API responses
   - Create unit tests for API response validation

3. **Implement Feature Flags**:
   - Add `useRealApi` feature flag in app configuration
   - Allow per-endpoint feature flags for granular control

### Phase 2: Parallel Data Fetching (Week 2)

1. **Shadow Requests**:
   - Implement "shadow mode" for API requests that fetch from both mock and real endpoints
   - Compare responses for consistency and log discrepancies
   - Do not block UI rendering on real API if it's slower than mock data

2. **Implement Caching Layer**:
   - Add robust caching for API responses to reduce dependency on real-time data
   - Implement stale-while-revalidate pattern for all API calls
   - Add cache invalidation strategies for contract events

3. **UI Component Updates**:
   - Update all UI components to handle null/undefined values gracefully
   - Add loading states for all data-dependent components
   - Implement error boundaries around critical components

### Phase 3: Gradual Rollout (Week 3)

1. **Environment-Based Strategy**:
   - Use 100% mock data in development by default
   - Use 50% mock data / 50% real data in staging environment
   - Use 100% real data in production with mock data fallbacks

2. **Component-by-Component Removal**:
   Priority order:
   - Non-critical display components
   - Read-only data components
   - Interactive components
   - Transaction components (last)

3. **User-Based Rollout**:
   - Implement user segment-based feature flags
   - Roll out to internal users first
   - Expand to beta testers
   - Finally roll out to all users

### Phase 4: Complete Removal (Week 4)

1. **Mock Data Cleanup**:
   - Remove mock data imports from production code
   - Keep mock data for testing only
   - Update all tests to use standardized mock data

2. **Monitoring & Alerts**:
   - Set up alerts for API failures
   - Implement circuit breakers for unreliable endpoints
   - Add dashboard for API health monitoring

3. **Documentation**:
   - Update all documentation to reference real API usage
   - Document fallback strategies for different failure scenarios

## Implementation Details

### Enhanced API Utilities

The `enhanced-api-utils.ts` utility has been implemented with several features to facilitate the mock data removal strategy:

```typescript
// Example usage of enhanced API utilities
import { fetchAPI, shouldUseMockData, clearApiCache } from '@/utils/enhanced-api-utils';

// Fetching data with fallback to mock data
const data = await fetchAPI('/api/proposals', {
  cacheTTL: 5 * 60 * 1000, // 5 minute cache
  forceMock: false, // Use mock data only if needed
  validator: validateProposalResponse, // Type validation function
  retries: 3 // Retry 3 times before failing
});
```

### Mock Data Detection

To safely detect when mock data is being used, the following strategy is employed:

```typescript
// Inside component
const { proposals, isLoading, error, isMockData } = useProposals();

// Conditionally render indicator for mock data
{isMockData && (
  <div className="text-amber-500 text-xs">
    Using development data
  </div>
)}
```

### Feature Flag Implementation

```typescript
// In app-config.ts
export const useAppConfig = () => {
  const [config] = useState({
    featureFlags: {
      useRealApiForProposals: process.env.NODE_ENV === 'production',
      useRealApiForMetrics: process.env.NODE_ENV === 'production',
      useWagmiForAssetDao: true,
    }
  });
  
  return config;
};
```

## Testing Strategy

To ensure that the transition from mock to real data is robust, the following testing strategy will be implemented:

1. **Unit Tests**:
   - Test all API utility functions with both mock and real data
   - Test UI components with various data states (loading, error, partial data)

2. **Integration Tests**:
   - Test the complete flow from API to UI with both mock and real data
   - Test fallback behavior when APIs fail

3. **End-to-End Tests**:
   - Simulate real API interactions in a controlled environment
   - Test performance with real API latency

## Success Metrics

The following metrics will be used to measure the success of the mock data removal strategy:

1. **Error Rate**: < 0.1% error rate for API calls in production
2. **Performance**: < 200ms average API response time
3. **Coverage**: 100% of components can function with real API data
4. **Fallback Rate**: < 5% of requests fall back to mock data in production

## Conclusion

This phased approach to mock data removal ensures that the AssetDAO module can be safely transitioned to production while maintaining a good user experience. By implementing robust telemetry, validation, and caching, we can identify and resolve issues before they impact users.
