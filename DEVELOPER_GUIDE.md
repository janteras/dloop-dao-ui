# D-Loop UI Developer Guide

## Application Architecture

This document provides an overview of the D-Loop UI application architecture, development patterns, and best practices.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Component Architecture](#component-architecture)
3. [State Management](#state-management)
4. [Web3 Integration](#web3-integration)
5. [Testing Strategy](#testing-strategy)
6. [Performance Considerations](#performance-considerations)
7. [Naming Conventions](#naming-conventions)
8. [ABI Management](#abi-management)

## Project Structure

The D-Loop UI follows a modern React project structure:

```
dloop-ui/
├── client/                # Main frontend application
│   ├── src/
│   │   ├── app/           # Application configuration
│   │   ├── assets/        # Static assets
│   │   ├── components/    # UI components
│   │   │   ├── assetdao/  # AssetDAO specific components
│   │   │   ├── features/  # Feature-specific components
│   │   │   ├── ui/        # Reusable UI components
│   │   ├── contexts/      # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions and libraries
│   │   ├── pages/         # Application pages/routes
│   │   ├── services/      # API and service integrations
│   │   ├── types/         # TypeScript type definitions
│   ├── index.html         # HTML entry point
├── attached_assets/       # Documentation and resources
├── *.abi.json             # Smart contract ABIs
```

## Component Architecture

The application uses a component-based architecture with the following patterns:

### Component Types

1. **Page Components**: Top-level components that correspond to routes
2. **Feature Components**: Specific business logic implementations
3. **UI Components**: Reusable, presentational components
4. **Layout Components**: Structure and organization components

### Component Organization

Components follow this structure:

```typescript
// Component file (ComponentName.tsx)
import { useState } from 'react';
import { useComponentHook } from './useComponentHook';
import './ComponentName.css';

/**
 * @component ComponentName
 * @description Brief description of the component's purpose
 */
interface ComponentNameProps {
  /** Description of prop1 */
  prop1: string;
  /** Description of prop2 */
  prop2?: number;
}

export function ComponentName({ prop1, prop2 = 0 }: ComponentNameProps) {
  // Component implementation
  return (
    <div className="component-name">
      {/* Component JSX */}
    </div>
  );
}
```

## State Management

The application uses multiple state management approaches:

1. **Local Component State**: For UI-specific state using `useState` and `useReducer`
2. **React Context**: For shared state that needs to be accessed by multiple components
3. **React Query**: For server state, caching, and data fetching
4. **URL State**: For state that should be reflected in the URL

### When to Use Each Approach

- **Local State**: Component-specific UI state (open/closed, hover, etc.)
- **Context**: Theme, user settings, authentication state
- **React Query**: API data, blockchain state, anything from an external data source
- **URL State**: Current page, filters, search parameters

## Web3 Integration

The application integrates with Ethereum using ethers.js v6:

### Key Integration Points

1. **Wallet Connection**: Handled via `useWallet` and `useWalletConnect` hooks
2. **Contract Interactions**: Handled via service classes and custom hooks
3. **Transaction Management**: Includes progress tracking, confirmation, and error handling
4. **Event Listening**: For real-time updates from blockchain events

### Contract Integration Example

```typescript
// Example of contract integration
import { ethers } from 'ethers';
import { getContract } from '@/lib/contracts';

// In a service or hook:
const assetDAOContract = getContract('AssetDAO', provider);
const result = await assetDAOContract.createProposal(
  type, // ProposalType enum value
  assetAddress,
  ethers.parseEther(amount.toString()),
  description
);
```

## Testing Strategy

The application uses a comprehensive testing approach:

1. **Unit Tests**: For individual functions and components
2. **Integration Tests**: For component interactions
3. **Contract Interaction Tests**: Using mock providers
4. **End-to-End Tests**: For critical user flows

### Testing Tools

- Jest: Test runner and assertion library
- React Testing Library: Component testing
- Cypress: End-to-end testing
- Mock Service Worker: API mocking

## Performance Considerations

The application implements several performance optimizations:

1. **Code Splitting**: Using dynamic imports for route-based code splitting
2. **Memoization**: Using React.memo, useMemo, and useCallback
3. **Virtualization**: For long lists and tables
4. **Optimistic UI Updates**: For improved perceived performance
5. **Pagination**: For large data sets

## Naming Conventions

To maintain consistency across the codebase:

1. **Files and Directories**:
   - React components: `PascalCase.tsx` (e.g., `ProposalCard.tsx`)
   - Hooks: `useHookName.ts` (e.g., `useProposals.ts`)
   - Utilities: `camelCase.ts` (e.g., `formatUtils.ts`)
   - Test files: `*.test.ts` or `*.spec.ts`

2. **Variables and Functions**:
   - Variables: `camelCase` (e.g., `proposalData`)
   - Constants: `UPPER_SNAKE_CASE` (e.g., `DEFAULT_GAS_LIMIT`)
   - Functions: `camelCase` (e.g., `fetchProposals`)
   - Classes: `PascalCase` (e.g., `AssetDAOService`)

3. **Component Props**:
   - Props interface: `ComponentNameProps` (e.g., `ProposalCardProps`)
   - Event handlers: `onEventName` (e.g., `onClick`, `onVote`)

## ABI Management

ABIs are managed using a centralized approach:

1. **ABI Files**: Stored in both root directory and in `/client/src/abis/`
2. **Versioning**: Each ABI includes a version in its metadata
3. **ABI Registry**: A central registry maps contract names to their current ABI version
4. **Type Generation**: TypeScript types are generated from ABIs for type safety

### ABI Registry Example

```typescript
// src/lib/abiRegistry.ts
export const abiRegistry = {
  AssetDAO: {
    currentVersion: '1.0.0',
    address: '0xa87e662061237a121Ca2E83E77dA8251bc4B3529',
    // Other metadata
  },
  // Other contracts
};
```
