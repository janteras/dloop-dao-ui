import React from 'react';
import { QueryProvider } from '../src/providers/QueryProvider';
import { MemoryRouter } from 'react-router-dom';
import '../src/styles/globals.css';

// Mock implementation of useUnifiedWallet for Storybook
const mockWallet = {
  address: '0x1234567890123456789012345678901234567890',
  isConnected: true,
  balance: '1000000000000000000', // 1 ETH
  chainId: 1,
  connector: 'MetaMask',
};

// Mock the unified hooks
jest.mock('../src/hooks/unified', () => ({
  useUnifiedWallet: () => mockWallet,
}));

// Create a decorator that wraps all stories with necessary providers
export const decorators = [
  (Story) => (
    <QueryProvider>
      <MemoryRouter>
        <div className="p-6 max-w-6xl mx-auto">
          <Story />
        </div>
      </MemoryRouter>
    </QueryProvider>
  ),
];

// Configure Storybook parameters
export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  // Add implementation selector toolbar item
  toolbars: {
    implementation: {
      icon: 'database',
      title: 'Web3 Implementation',
      items: [
        { value: 'ethers', title: 'Ethers.js' },
        { value: 'wagmi', title: 'Wagmi' },
      ],
    },
  },
  // Group stories by component type
  options: {
    storySort: {
      order: [
        'Introduction',
        'Migration Guide',
        'Components',
        ['Unified', 'Optimized', 'Analytics'],
        'Hooks',
        'Services',
      ],
    },
  },
};
