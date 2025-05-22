# D-Loop UI Optimization: 1-Week Action Plan

**Version:** 1.0.0  
**Created:** 2025-05-22  
**Status:** In Progress

## Executive Summary

This document outlines a 1-week action plan to address identified issues in the D-Loop UI codebase, focusing on reducing technical debt, improving code quality, and enhancing performance. The plan is structured into three phases, with specific tasks and deliverables for each day.

## Table of Contents
- [Phase 1: Consolidation & Architecture (Days 1-2)](#phase-1-consolidation--architecture-days-1-2)
- [Phase 2: Performance Optimization (Days 3-4)](#phase-2-performance-optimization-days-3-4)
- [Phase 3: Feature Enhancements (Days 5-7)](#phase-3-feature-enhancements-days-5-7)
- [Implementation Guidelines](#implementation-guidelines)
- [Success Metrics](#success-metrics)
- [Progress Tracking](#progress-tracking)

## Phase 1: Consolidation & Architecture (Days 1-2)

### Day 1: Unify Component Structure

**Morning Tasks:**
1. **Create Unified Component Pattern**
   ```typescript
   // Create shared interfaces
   export interface ProposalCardProps {
     proposal: Proposal;
     onActionComplete?: () => void;
     implementation?: 'ethers' | 'wagmi';
   }
   
   // Create unified component with implementation switching
   export const UnifiedProposalCard: React.FC<ProposalCardProps> = (props) => {
     const useWagmi = useFeatureFlag('wagmi.enabled') || props.implementation === 'wagmi';
     return useWagmi ? <WagmiProposalCard {...props} /> : <ProposalCard {...props} />;
   };
   ```

2. **Create Component Factory**
   ```typescript
   // components/common/factory.ts
   export function createImplementationComponent<P>(
     EthersComponent: React.ComponentType<P>,
     WagmiComponent: React.ComponentType<P>,
     featureKey: string
   ) {
     return (props: P & { forceImplementation?: 'ethers' | 'wagmi' }) => {
       const useWagmi = useFeatureFlag(featureKey) || props.forceImplementation === 'wagmi';
       const Component = useWagmi ? WagmiComponent : EthersComponent;
       return <Component {...props} />;
     };
   }
   ```

**Afternoon Tasks:**
1. **Apply Factory Pattern to AssetDAO Components**
   - Convert ProposalCard, CreateProposalModal, and AssetDAO components
   - Remove duplicate component implementations
   - Verify UI behavior matches before/after changes

**Deliverables:**
- Consolidated component structure with implementation switching
- Removal of at least 50% of duplicated component code

### Day 2: Centralize Contract Integration

**Morning Tasks:**
1. **Create Enhanced Unified Hook Pattern**
   ```typescript
   // hooks/unified/useUnifiedProposals.ts
   export function useUnifiedProposalList(options = {}) {
     const { useWagmi = useFeatureFlag('wagmi.assetdao.enabled') } = options;
     
     // Use implementation-specific hook based on feature flag
     const ethersResult = useProposals();
     const wagmiResult = useWagmiProposalList();
     
     // Return normalized result with implementation details
     return {
       ...(useWagmi ? wagmiResult : ethersResult),
       implementation: useWagmi ? 'wagmi' : 'ethers',
       telemetry: {
         implementation: useWagmi ? 'wagmi' : 'ethers',
         startTime: performance.now(),
       },
     };
   }
   ```

2. **Implement Centralized Error Handling**
   ```typescript
   // services/errorHandling.ts
   export function handleContractError(error, context) {
     // Categorize errors
     if (error.code === 'CALL_EXCEPTION') {
       // Log detailed error for analytics
       logContractError(error, context);
       
       // Return user-friendly error
       return {
         message: 'Unable to complete the transaction',
         details: error.reason || 'The contract rejected the request',
         recoverable: isRecoverableError(error),
       };
     }
     
     // Handle other error categories...
   }
   ```

**Afternoon Tasks:**
1. **Apply Enhanced Error Handling to Contract Hooks**
   - Refactor `useAssetDaoContract.ts` to use centralized error handling
   - Add telemetry collection to measure function call performance
   - Implement consistent error recovery strategies

**Deliverables:**
- Unified hook pattern with implementation details
- Centralized error handling service
- Enhanced telemetry for contract interactions

## Phase 2: Performance Optimization (Days 3-4)

### Day 3: React Query Integration

**Morning Tasks:**
1. **Set Up React Query Framework**
   ```typescript
   // lib/query/config.ts
   import { QueryClient } from 'react-query';
   
   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 30000, // 30 seconds
         cacheTime: 5 * 60 * 1000, // 5 minutes
         retry: (failureCount, error) => {
           // Custom retry logic for contract calls
           if (isContractError(error)) {
             return failureCount < 3;
           }
           return failureCount < 2;
         },
       },
     },
   });
   ```

2. **Create Contract Query Hooks**
   ```typescript
   // hooks/queries/useProposalQueries.ts
   import { useQuery } from 'react-query';
   
   export function useProposalListQuery(options = {}) {
     const { implementation = 'wagmi', ...queryOptions } = options;
     
     return useQuery(
       ['proposals', implementation, queryOptions],
       () => fetchProposals(implementation, queryOptions),
       {
         // Query-specific options
         staleTime: 60000, // 1 minute
         onError: (error) => handleContractError(error, { 
           context: 'proposalList',
           implementation,
         }),
       }
     );
   }
   ```

**Afternoon Tasks:**
1. **Refactor AssetDAO Container to Use React Query**
   - Convert proposal fetching to use query hooks
   - Implement optimistic updates for voting actions
   - Add prefetching for improved UX

**Deliverables:**
- React Query implementation for contract data
- Optimistic UI updates for user actions
- Data prefetching for common user flows

### Day 4: Bundle Optimization & Code Splitting

**Morning Tasks:**
1. **Implement Dynamic Imports for Implementation-Specific Code**
   ```typescript
   // components/features/asset-dao/ProposalCard.tsx
   import React, { lazy, Suspense } from 'react';
   
   // Dynamically import implementation-specific components
   const EthersProposalCard = lazy(() => import('./implementations/EthersProposalCard'));
   const WagmiProposalCard = lazy(() => import('./implementations/WagmiProposalCard'));
   
   export const ProposalCard = (props) => {
     const { useWagmi } = useImplementation();
     
     return (
       <Suspense fallback={<ProposalCardSkeleton {...props} />}>
         {useWagmi ? <WagmiProposalCard {...props} /> : <EthersProposalCard {...props} />}
       </Suspense>
     );
   };
   ```

2. **Create Shared Component Types**
   ```typescript
   // types/components.ts
   export interface SharedProposalCardProps {
     proposal: ProposalType;
     onVote: (id: number, support: boolean) => Promise<void>;
     onExecute: (id: number) => Promise<void>;
     // Common props
   }
   
   // Implementation-specific extensions
   export interface EthersProposalCardProps extends SharedProposalCardProps {
     // Ethers-specific props
   }
   
   export interface WagmiProposalCardProps extends SharedProposalCardProps {
     // Wagmi-specific props
   }
   ```

**Afternoon Tasks:**
1. **Optimize Bundle Size**
   - Analyze bundle with webpack-bundle-analyzer
   - Extract common dependencies to reduce duplication
   - Implement route-based code splitting

**Deliverables:**
- Dynamic imports for implementation-specific code
- Shared type definitions for components
- Bundle size reduction report

## Phase 3: Feature Enhancements (Days 5-7)

### Day 5: Proposal Type & Token Resolution Improvements

**Morning Tasks:**
1. **Refactor Proposal Type System**
   ```typescript
   // services/proposalType.ts
   export enum ProposalTypeEnum {
     INVEST = 0,
     DIVEST = 1,
     PARAMETER_CHANGE = 2,
     OTHER = 3,
   }
   
   export const proposalTypeMapping = {
     [ProposalTypeEnum.INVEST]: {
       label: 'Invest',
       color: 'green',
       icon: InvestIcon,
       description: 'Proposal to invest funds',
     },
     [ProposalTypeEnum.DIVEST]: {
       label: 'Divest',
       color: 'red',
       icon: DivestIcon,
       description: 'Proposal to withdraw funds',
     },
     // Additional types...
   };
   ```

2. **Create Enhanced Token Resolution Service**
   ```typescript
   // services/tokenService.ts
   export class TokenMetadataService {
     private tokenCache = new Map();
     
     async getTokenMetadata(address: string): Promise<TokenMetadata> {
       if (this.tokenCache.has(address)) {
         return this.tokenCache.get(address);
       }
       
       // Fetch from multiple sources with fallbacks
       try {
         const metadata = await this.fetchFromPrimarySource(address);
         this.tokenCache.set(address, metadata);
         return metadata;
       } catch (error) {
         // Try fallback sources
         return this.fetchFromFallbackSources(address);
       }
     }
     
     // Additional methods...
   }
   ```

**Afternoon Tasks:**
1. **Integrate Token Service with AssetDAO Components**
   - Update ProposalCard to use enhanced token resolution
   - Create TokenDisplay component with advanced formatting
   - Add token icons and tooltips

**Deliverables:**
- Consistent proposal type system
- Enhanced token metadata service
- Improved token display in UI

### Day 6: Event Subscriptions & Real-time Updates

**Morning Tasks:**
1. **Implement WebSocket Event Subscription Service**
   ```typescript
   // services/eventSubscription.ts
   export class ContractEventService {
     private subscriptions = new Map();
     
     subscribe(contractAddress: string, eventName: string, callback: Function): string {
       const id = generateSubscriptionId();
       
       // Create provider based on implementation
       const provider = this.getWebSocketProvider();
       
       // Create filter for the event
       const filter = {
         address: contractAddress,
         topics: [ethers.utils.id(`${eventName}(address,uint256,bool)`)],
       };
       
       // Subscribe to the event
       const subscription = provider.on(filter, (log) => {
         const parsedEvent = this.parseEvent(log, eventName);
         callback(parsedEvent);
       });
       
       this.subscriptions.set(id, { subscription, provider });
       return id;
     }
     
     // Additional methods...
   }
   ```

2. **Create React Hook for Event Subscriptions**
   ```typescript
   // hooks/useContractEvents.ts
   export function useContractEvent(contractAddress, eventName, callback) {
     const eventService = useEventService();
     
     useEffect(() => {
       const subscriptionId = eventService.subscribe(
         contractAddress,
         eventName,
         callback
       );
       
       return () => {
         eventService.unsubscribe(subscriptionId);
       };
     }, [contractAddress, eventName, callback]);
   }
   ```

**Afternoon Tasks:**
1. **Integrate Real-time Updates with AssetDAO UI**
   - Add new proposal notifications
   - Implement real-time voting updates
   - Create toast notifications for proposal status changes

**Deliverables:**
- WebSocket-based event subscription service
- React hooks for contract events
- Real-time UI updates for proposal actions

### Day 7: Testing & Documentation

**Morning Tasks:**
1. **Write Unit Tests for New Components**
   - Test unified components with both implementations
   - Verify error handling behavior
   - Validate event subscription functionality

2. **Create Migration Documentation**
   ```markdown
   # Unified Contract Pattern Documentation
   
   ## Overview
   The Unified Contract Pattern provides a consistent way to interact with blockchain contracts
   while supporting multiple implementations (Ethers.js and Wagmi).
   
   ## Using Unified Hooks
   ```

**Afternoon Tasks:**
1. **Perform Integration Testing**
   - Test complete user flows with both implementations
   - Verify performance improvements
   - Validate bundle size reduction

2. **Finalize Documentation**
   - Update code comments
   - Create architecture diagrams
   - Document migration strategy for remaining components

**Deliverables:**
- Comprehensive test suite for new components
- Updated documentation with migration guidelines
- Performance and bundle size metrics

## Implementation Guidelines

1. **Feature Flag System**
   - Use environment variables for feature flags during development
   - Implement gradual rollout strategy for production

2. **Consistent Styling**
   - Ensure all components use the same styling approach (Tailwind)
   - Extract common UI patterns into shared components

3. **Error Recovery**
   - Implement graceful degradation for contract errors
   - Provide clear user feedback for recoverable errors

4. **Performance Monitoring**
   - Add performance marks for critical user interactions
   - Track contract call success rates and performance

## Success Metrics

- **Code Reduction**: 40% reduction in duplicated code
- **Bundle Size**: 25% reduction in main bundle size
- **Performance**: 30% improvement in contract data loading time
- **Error Rate**: 50% reduction in unhandled contract errors

## Progress Tracking

| Phase | Task | Status | Notes | Completion Date |
|-------|------|--------|-------|----------------|
| 1 | Unified Component Pattern | Completed | Created base component patterns | 2025-05-22 |
| 1 | Component Factory | Completed | Implemented in `/components/common/factory.ts` | 2025-05-22 |
| 1 | Apply Factory to AssetDAO | Completed | Created UnifiedProposalCard, UnifiedAssetDAO, and UnifiedCreateProposalModal | 2025-05-22 |
| 1 | Unified Hook Pattern | Completed | Implemented enhanced hooks in `/hooks/unified/` | 2025-05-22 |
| 1 | Centralized Error Handling | Completed | Created error handling service in `/services/errorHandling.ts` | 2025-05-22 |
| 1 | Apply Error Handling | Completed | Integrated with hooks and components | 2025-05-22 |
| 1 | TypeScript Fixes | Completed | Fixed component TypeScript errors and created shared type definitions | 2025-05-22 |
| 2 | React Query Setup | Completed | Implemented in `/lib/query/config.ts` and `/lib/query/provider.tsx` | 2025-05-22 |
| 2 | Contract Query Hooks | Completed | Created optimized hooks in `/hooks/query/` | 2025-05-22 |
| 2 | Refactor AssetDAO Container | Completed | Created `OptimizedAssetDAO` with React Query | 2025-05-22 |
| 2 | Dynamic Imports | Completed | Implemented in `/components/features/asset-dao/dynamic/` | 2025-05-22 |
| 2 | Shared Component Types | Completed | Created unified type definitions | 2025-05-22 |
| 2 | Bundle Optimization | Completed | Implemented code splitting and lazy loading | 2025-05-22 |
| 3 | Proposal Type System | Completed | Implemented in `/types/proposals.ts` | 2025-05-22 |
| 3 | Token Resolution Service | Completed | Implemented in `/services/enhancedTokenService.ts` | 2025-05-22 |
| 3 | Token Service Integration | Completed | Created hooks in `/hooks/useEnhancedTokenInfo.ts` | 2025-05-22 |
| 3 | WebSocket Events | Completed | Implemented in `/services/realTimeEventService.ts` | 2025-05-22 |
| 3 | Event Subscription Hooks | Completed | Created hooks in `/hooks/useRealTimeEvents.ts` | 2025-05-22 |
| 3 | Real-time UI Updates | Completed | Implemented in `/components/features/asset-dao/realtime/` | 2025-05-22 |
| 3 | Unit Tests | In Progress | Creating tests for enhanced components | - |
| 3 | Migration Documentation | Not Started | Planned for Day 7 | - |
| 3 | Integration Tests | Not Started | Planned for Day 7 | - |
| 3 | Final Documentation | Not Started | Planned for Day 7 | - |

## Current Progress Summary

Phase 3 (Feature Enhancements) has been largely completed, with the following key achievements:

1. **Enhanced Proposal Type System**: Created a robust type system in `/types/proposals.ts` with comprehensive validation, enum types, and Zod schemas.

2. **Token Resolution Service**: Implemented an enhanced token service in `/services/enhancedTokenService.ts` with support for multiple chains, caching, and async loading.

3. **Real-time Updates**: Built a WebSocket-based event system in `/services/realTimeEventService.ts` and accompanying React hooks for live updates.

4. **Enhanced AssetDAO Components**: Created the `RealTimeAssetDAO` component that leverages all the enhancements to provide a modern, responsive user experience.

Next steps involve creating comprehensive tests, documentation, and finalizing the migration strategy.

Phase 1 (Architecture & Consolidation) has been completed. We've successfully implemented a unified component pattern with a factory approach that allows dynamically switching between Ethers.js and Wagmi implementations. We've created centralized error handling, unified hooks with telemetry, and resolved TypeScript errors. The key components created include UnifiedProposalCard, UnifiedAssetDAO, and UnifiedCreateProposalModal.

We're now beginning Phase 2 (Performance Optimization) with the implementation of React Query for more efficient data fetching and state management, followed by bundle optimization through code splitting and dynamic imports.

We've successfully completed Phase 1 of our action plan, implementing the core architectural components for unifying Ethers and Wagmi implementations. The key achievements include:

1. **Component Factory Pattern**: Created a reusable factory for switching between implementations
2. **Unified Hooks**: Developed enhanced hooks with telemetry and error handling
3. **Centralized Error Handling**: Implemented a comprehensive error handling service
4. **Unified AssetDAO Components**: Built unified components that work with both implementations

These components now provide a consistent interface regardless of which implementation (Ethers or Wagmi) is being used, with improved error handling and telemetry for monitoring migration progress.

Next steps will focus on Phase 2: Performance Optimization, where we'll implement React Query for more efficient data fetching and optimize bundle size through code splitting and dynamic imports.
