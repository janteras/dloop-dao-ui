# Ethers to Wagmi Migration Guide

This guide outlines the process of migrating from Ethers.js to Wagmi in the D-Loop UI application. It provides a step-by-step approach, best practices, and examples to help developers make this transition smoothly and efficiently.

## Table of Contents

1. [Introduction](#introduction)
2. [Migration Strategy](#migration-strategy)
3. [The Unified Pattern](#the-unified-pattern)
4. [Migration Steps](#migration-steps)
5. [Testing and Validation](#testing-and-validation)
6. [Advanced Features](#advanced-features)
7. [Troubleshooting](#troubleshooting)
8. [Checklists](#checklists)

## Introduction

### Why Migrate?

Wagmi offers several advantages over Ethers.js:

- **React-centric approach**: Wagmi provides React hooks specifically designed for web3 interactions
- **Automatic state management**: Built-in caching, loading states, and error handling
- **Improved developer experience**: Reduced boilerplate and stronger TypeScript support
- **Better performance**: Optimized for React's rendering lifecycle
- **Simplified wallet management**: Streamlined connection and transaction handling

### Incremental Approach

Our migration follows an incremental approach with parallel implementations to minimize risk:

- Existing Ethers code remains functional during migration
- Feature flags control which implementation is active
- Components are migrated one at a time
- Thorough testing ensures consistent behavior

## Migration Strategy

### Three-Phase Approach

1. **Preparation Phase**
   - Create unified contract hooks
   - Set up feature flags
   - Implement core services
   - Establish testing patterns

2. **Implementation Phase**
   - Migrate components
   - Update dependencies
   - Create unified interfaces
   - Add React Query optimizations

3. **Rollout Phase**
   - Enable feature flags gradually
   - Monitor performance
   - Address any issues
   - Complete the migration

### Feature Flags

Feature flags in `app-config.ts` control which implementation is active:

```typescript
export const appConfig = {
  featureFlags: {
    enableWagmiForAssetDao: true,
    enableWagmiForTokenVault: false,
    enableWagmiForBountyManager: false,
    // Add other feature flags as needed
  }
};
```

## The Unified Pattern

The unified pattern provides a consistent interface that works with both Ethers.js and Wagmi implementations.

### Core Principles

1. **Abstraction**: Hide implementation details behind unified interfaces
2. **Feature Flags**: Control which implementation is active
3. **Consistent API**: Maintain the same API regardless of implementation
4. **Granular Migration**: Migrate components individually

### Pattern Structure

The pattern consists of three layers:

1. **Unified Hook**: The main entry point that selects the implementation
2. **Implementation Services**: Separate services for Ethers and Wagmi
3. **Component Integration**: Components that use the unified hook

### Example: Unified Contract Hook

```typescript
// useUnifiedContract.ts
import { useAppConfig } from '@/config/app-config';
import { useEthersContract } from './useEthersContract';
import { useWagmiContract } from './useWagmiContract';
import { Web3Implementation } from '@/types/web3-types';

export function useUnifiedContract(
  address?: string,
  abi?: any,
  implementation?: Web3Implementation
) {
  const { featureFlags } = useAppConfig();
  
  // Determine which implementation to use
  const activeImplementation = implementation || 
    (featureFlags.enableWagmi ? 'wagmi' : 'ethers');
  
  // Get the appropriate contract hook
  const ethersContract = useEthersContract(address, abi);
  const wagmiContract = useWagmiContract(address, abi);
  
  // Return the selected implementation
  return activeImplementation === 'wagmi' ? wagmiContract : ethersContract;
}
```

## Migration Steps

### 1. Create Unified Hooks

Start by creating unified hooks that can switch between implementations:

```typescript
// useUnifiedAssetDaoContract.ts
import { useUnifiedContract } from './useUnifiedContract';
import { useAppConfig } from '@/config/app-config';
import { AssetDaoContractABI } from '@/contracts/AssetDaoContract';
import { EthersAssetDaoService } from '@/services/ethers/assetDaoContractService';
import { WagmiAssetDaoService } from '@/services/wagmi/assetDaoContractService';
import { Web3Implementation } from '@/types/web3-types';

export function useUnifiedAssetDaoContract(options = {}) {
  const { featureFlags } = useAppConfig();
  const implementation = options.implementation || 
    (featureFlags.enableWagmiForAssetDao ? 'wagmi' : 'ethers');
  
  const contract = useUnifiedContract(
    process.env.ASSET_DAO_CONTRACT_ADDRESS,
    AssetDaoContractABI,
    implementation
  );
  
  // Use the appropriate service based on implementation
  if (implementation === 'wagmi') {
    return new WagmiAssetDaoService(contract);
  } else {
    return new EthersAssetDaoService(contract);
  }
}
```

### 2. Implement Wagmi Services

Create service classes for the Wagmi implementation:

```typescript
// assetDaoContractService.ts (Wagmi version)
import { useContractRead, useContractWrite } from 'wagmi';

export class WagmiAssetDaoService {
  constructor(contract) {
    this.contract = contract;
  }
  
  async getProposals(options = {}) {
    const { data } = useContractRead({
      address: this.contract.address,
      abi: this.contract.abi,
      functionName: 'getProposals',
      args: [options.limit || 10, options.offset || 0]
    });
    
    return data;
  }
  
  async voteOnProposal(proposalId, support) {
    const { data, write } = useContractWrite({
      address: this.contract.address,
      abi: this.contract.abi,
      functionName: 'castVote',
      args: [proposalId, support]
    });
    
    const result = await write();
    return result.hash;
  }
  
  // Implement other methods...
}
```

### 3. Update Components

Refactor components to use the unified hooks:

```tsx
// Before: Using Ethers directly
import { useAssetDaoContract } from '@/hooks/useAssetDaoContract';

function ProposalList() {
  const contract = useAssetDaoContract();
  const [proposals, setProposals] = useState([]);
  
  useEffect(() => {
    const fetchProposals = async () => {
      const data = await contract.getProposals();
      setProposals(data);
    };
    fetchProposals();
  }, [contract]);
  
  // Render proposals...
}

// After: Using unified hook
import { useUnifiedAssetDaoContract } from '@/hooks/unified/useUnifiedAssetDaoContract';

function UnifiedProposalList() {
  const { getProposals, implementation } = useUnifiedAssetDaoContract();
  const [proposals, setProposals] = useState([]);
  
  useEffect(() => {
    const fetchProposals = async () => {
      const data = await getProposals();
      setProposals(data);
    };
    fetchProposals();
  }, [getProposals]);
  
  // Render proposals with implementation info...
}
```

### 4. Add React Query for Optimized Components

Further optimize with React Query:

```tsx
// Optimized component with React Query
import { useProposalsQuery, useProposalVoteMutation } from '@/hooks/query/useAssetDaoQueries';

function OptimizedProposalList() {
  const { 
    data: proposals, 
    isLoading, 
    isError 
  } = useProposalsQuery();
  
  const voteMutation = useProposalVoteMutation();
  
  const handleVote = async (proposalId, support) => {
    await voteMutation.mutateAsync({ proposalId, support });
  };
  
  if (isLoading) return <LoadingIndicator />;
  if (isError) return <ErrorMessage />;
  
  // Render proposals with optimized loading states...
}
```

## Testing and Validation

### Unit Testing

Test both implementations:

```typescript
// useUnifiedAssetDaoContract.test.ts
describe('useUnifiedAssetDaoContract', () => {
  // Mock app config
  beforeEach(() => {
    jest.mock('@/config/app-config', () => ({
      useAppConfig: () => ({
        featureFlags: {
          enableWagmiForAssetDao: false // Test with Ethers first
        }
      })
    }));
  });
  
  it('uses Ethers implementation when flag is off', () => {
    const { result } = renderHook(() => useUnifiedAssetDaoContract());
    expect(result.current.implementation).toBe('ethers');
  });
  
  it('uses Wagmi implementation when flag is on', () => {
    // Update mock to enable Wagmi
    jest.mock('@/config/app-config', () => ({
      useAppConfig: () => ({
        featureFlags: {
          enableWagmiForAssetDao: true
        }
      })
    }));
    
    const { result } = renderHook(() => useUnifiedAssetDaoContract());
    expect(result.current.implementation).toBe('wagmi');
  });
  
  // Test specific methods...
});
```

### Integration Testing

Verify component behavior with both implementations:

```typescript
// UnifiedProposalList.test.tsx
describe('UnifiedProposalList', () => {
  it('renders correctly with Ethers implementation', async () => {
    // Mock Ethers implementation
    jest.mock('@/hooks/unified/useUnifiedAssetDaoContract', () => ({
      useUnifiedAssetDaoContract: () => ({
        getProposals: jest.fn().mockResolvedValue([mockProposal]),
        implementation: 'ethers'
      })
    }));
    
    render(<UnifiedProposalList />);
    await waitFor(() => {
      expect(screen.getByText(/using ethers implementation/i)).toBeInTheDocument();
      expect(screen.getByText(mockProposal.title)).toBeInTheDocument();
    });
  });
  
  it('renders correctly with Wagmi implementation', async () => {
    // Mock Wagmi implementation
    jest.mock('@/hooks/unified/useUnifiedAssetDaoContract', () => ({
      useUnifiedAssetDaoContract: () => ({
        getProposals: jest.fn().mockResolvedValue([mockProposal]),
        implementation: 'wagmi'
      })
    }));
    
    render(<UnifiedProposalList implementation="wagmi" />);
    await waitFor(() => {
      expect(screen.getByText(/using wagmi implementation/i)).toBeInTheDocument();
      expect(screen.getByText(mockProposal.title)).toBeInTheDocument();
    });
  });
});
```

## Advanced Features

### React Query Integration

React Query offers significant benefits:

```typescript
// useAssetDaoQueries.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useUnifiedAssetDaoContract } from '../unified/useUnifiedAssetDaoContract';

// Query keys for cache management
export const ASSET_DAO_KEYS = {
  all: ['assetDao'],
  proposals: () => [...ASSET_DAO_KEYS.all, 'proposals'],
  proposal: (id) => [...ASSET_DAO_KEYS.proposals(), id],
};

export function useProposalsQuery(options = {}, filters = {}) {
  const { getProposals, implementation } = useUnifiedAssetDaoContract();
  
  return useQuery(
    [...ASSET_DAO_KEYS.proposals(), options, filters],
    async () => {
      return await getProposals({ ...options, ...filters });
    },
    {
      staleTime: 30000, // 30 seconds
      meta: { implementation }
    }
  );
}

export function useProposalVoteMutation() {
  const queryClient = useQueryClient();
  const { voteOnProposal } = useUnifiedAssetDaoContract();
  
  return useMutation(
    async ({ proposalId, support }) => {
      return await voteOnProposal(proposalId, support);
    },
    {
      onSuccess: (_, { proposalId }) => {
        // Invalidate affected queries
        queryClient.invalidateQueries(ASSET_DAO_KEYS.proposal(proposalId));
        queryClient.invalidateQueries(ASSET_DAO_KEYS.proposals());
      }
    }
  );
}
```

### Request Batching

Implement request batching for better performance:

```typescript
// request-batching.ts
export class RequestBatcher {
  // Implementation details...
  
  public queueRequest(method, params = []) {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ method, params, resolve, reject });
      this.scheduleBatch();
    });
  }
  
  private executeBatch() {
    // Process queued requests in a batch...
  }
}

// Usage example
export async function batchGetProposals(proposalIds) {
  const { contract } = useUnifiedAssetDaoContract();
  const batcher = new RequestBatcher(contract);
  
  const promises = proposalIds.map(id => 
    batcher.queueRequest('getProposal', [id])
  );
  
  return Promise.all(promises);
}
```

### Real-Time Updates

Implement WebSocket-based real-time updates:

```typescript
// real-time-updates.ts
export function useAssetDaoEvents(contractAddress, wsUrl, options = {}) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const eventManager = new AssetDaoEventManager(contractAddress, wsUrl);
    
    // Register handlers
    eventManager.on('ProposalCreated', (data) => {
      // Invalidate cache when new proposal is created
      queryClient.invalidateQueries(ASSET_DAO_KEYS.proposals());
      options.onProposalCreated?.(data);
    });
    
    eventManager.on('VoteCast', (data) => {
      // Invalidate specific proposal
      queryClient.invalidateQueries(ASSET_DAO_KEYS.proposal(data.proposalId));
      options.onVoteCast?.(data);
    });
    
    // Other event handlers...
    
    return () => {
      eventManager.disconnect();
    };
  }, [contractAddress, wsUrl, queryClient, options]);
}
```

## Troubleshooting

### Common Issues

1. **State Management Differences**
   - Ethers requires manual state management
   - Wagmi handles states internally

   Solution: Use the unified pattern to abstract these differences

2. **Transaction Handling**
   - Ethers uses Provider/Signer
   - Wagmi uses hooks with built-in state

   Solution: Use the appropriate service methods that handle these differences

3. **Event Listening**
   - Different event subscription methods
   
   Solution: Use the AssetDaoEventManager that works with both implementations

### Migration Audit

Use the migration audit tool to track progress:

```typescript
// Run audit
const audit = new MigrationAudit();
const report = await audit.runMigrationAudit({
  includePaths: ['/src/components'],
  excludePaths: ['/src/components/__tests__']
});

console.log(`Migration progress: ${report.summary.migrationCompletionPercentage}%`);
console.log(`Files with issues: ${report.summary.filesWithIssues}`);
```

## Checklists

### Pre-Migration Checklist

- [ ] Review codebase for direct Ethers usage
- [ ] Set up feature flags in app configuration
- [ ] Create unified contract hooks for each contract
- [ ] Implement basic Wagmi services
- [ ] Set up testing infrastructure

### Component Migration Checklist

- [ ] Identify component to migrate
- [ ] Create unified version of the component
- [ ] Update imports to use unified hooks
- [ ] Test with both implementations
- [ ] Update any dependent components
- [ ] Add documentation

### Post-Migration Validation

- [ ] Run migration audit to ensure full coverage
- [ ] Validate all features work with both implementations
- [ ] Run full test suite
- [ ] Benchmark performance before enabling feature flags
- [ ] Update documentation
- [ ] Deploy and monitor
