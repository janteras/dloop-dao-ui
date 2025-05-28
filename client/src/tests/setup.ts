/**
 * Test setup file for Jest configuration
 * This configures the testing environment for React components and hooks
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';

// Configure testing library
configure({
  // Increase the timeout for async tests
  asyncUtilTimeout: 5000,
  // Set to true to log all events emitted by components
  eventWrapper: process.env.DEBUG === 'true',
  // Get really useful error messages when using findBy queries
  getElementError: (message, container) => {
    const error = new Error(message);
    error.name = 'TestingLibraryElementError';
    error.stack = undefined;
    return error;
  },
});

// Mock the fetch API
global.fetch = jest.fn();

// Mock window.ethereum
Object.defineProperty(window, 'ethereum', {
  value: {
    isMetaMask: true,
    request: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn(),
    autoRefreshOnNetworkChange: false,
    enable: jest.fn(),
    isConnected: jest.fn(() => true),
  },
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback: Function) {
    this.callback = callback;
  }
  callback: Function;
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
};
