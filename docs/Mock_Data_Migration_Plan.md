# Mock Data Migration Plan

This document outlines the strategy for removing mock data dependencies from the AssetDAO implementation and transitioning to production-ready data fetching.

## Current Mock Data Dependencies

### 1. API Mock Data (`/client/src/mocks/api-mock-data.ts`)
- **MOCK_PROTOCOL_METRICS**: Used as fallback for protocol metrics API endpoints
- **MOCK_PROTOCOL_PROPOSALS**: Used as fallback for proposal data API endpoints

### 2. Hardcoded Mock Values
- **Token addresses and symbols**: Currently in `TOKEN_ADDRESSES` in `proposal-helpers.ts`
- **Amount formatting**: Previously used `formatUnits` from ethers, now using pre-formatted values

### 3. Service-Level Mock Data
- **AI Node Service**: Uses mock data when blockchain data is unavailable
- **NFT Service**: Uses mock data for development environments

## Migration Strategy

### Phase 1: Centralize Mock Data Access (Completed)
- ✅ Create a robust API utility (`api-utils.ts`) with centralized mock data handling
- ✅ Add feature flags to control when mock data is used
- ✅ Implement development vs. production environment detection

### Phase 2: Remove Direct Mock Data References (In Progress)
- ⏳ Replace direct imports of mock data with calls to the API utility
- ⏳ Add proper error handling for when API calls fail in production
- ⏳ Implement fallback mechanisms for critical data

### Phase 3: Implement Production Data Sources (Upcoming)
- 🔲 Integrate with real API endpoints for protocol metrics
- 🔲 Ensure proper caching for performance optimization
- 🔲 Add telemetry to monitor API health and performance

## Implementation Details

### API Utility Pattern

The new API utility pattern provides:

1. **Environment-aware data fetching**:
   ```typescript
   // Use the utility for data fetching
   const proposals = await fetchAPI('/api/proposals');
   ```

2. **Automatic mock data fallback in development**:
   ```typescript
   // Mock data will be used in development or when API fails
   try {
     const metrics = await fetchAPI('/api/metrics');
   } catch (error) {
     // Handle the error appropriately
   }
   ```

3. **Explicit mock data control**:
   ```typescript
   // Force using real API even in development
   const realData = await fetchAPI('/api/data', { forceMock: false });
   
   // Force using mock data even in production (for testing)
   const mockData = await fetchAPI('/api/data', { forceMock: true });
   ```

### Caching Strategy

The API utility implements a time-based caching mechanism:

- Default cache TTL: 5 minutes
- Cache can be bypassed with `skipCache: true`
- Custom TTL can be specified per request
- Cache can be cleared programmatically with `clearApiCache()`

## Testing Requirements

1. **Unit Tests**:
   - Test API utility functions with mock responses
   - Verify caching behavior works as expected
   - Ensure environment detection works correctly

2. **Integration Tests**:
   - Test fallback to mock data when API fails
   - Verify components render correctly with both real and mock data
   - Test performance with caching enabled vs. disabled

3. **End-to-End Tests**:
   - Simulate API failures and verify graceful degradation
   - Test with different network conditions (slow, intermittent)
   - Verify data consistency between UI and API

## Future Improvements

1. **Typed API Responses**:
   - Add TypeScript interfaces for all API responses
   - Implement runtime type validation for API responses

2. **Mock Data Factory**:
   - Create a factory function for generating varied mock data
   - Support different scenarios (empty data, error states, edge cases)

3. **API Version Control**:
   - Add support for API versioning
   - Create migration utilities for handling API schema changes

## Conclusion

This migration plan provides a clear path to removing mock data dependencies while maintaining a good development experience. By centralizing mock data access and adding robust error handling, we can ensure the application works reliably in both development and production environments.
