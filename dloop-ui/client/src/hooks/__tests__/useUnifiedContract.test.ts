import { renderHook, act } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { useUnifiedContract } from '../useUnifiedContract';
// Use relative paths for imports to avoid module resolution issues
import { useAppConfig } from '../../config/app-config';
import { useUnifiedWallet } from '../useUnifiedWallet';
import { useReadContract, useWriteContract, useSimulateContract } from 'wagmi';
// Import ethers and explicitly import BigNumber for testing
import { ethers } from 'ethers';
import { BigNumber } from '@ethersproject/bignumber';

// Mock dependencies
jest.mock('../../config/app-config', () => ({
  useAppConfig: jest.fn(),
}));

jest.mock('../useUnifiedWallet', () => ({
  useUnifiedWallet: jest.fn(),
}));

jest.mock('wagmi', () => ({
  useReadContract: jest.fn(),
  useWriteContract: jest.fn(),
  useSimulateContract: jest.fn(),
}));

// Sample ABI for testing
const testAbi = [
  {
    inputs: [],
    name: 'getCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'newCount', type: 'uint256' }],
    name: 'setCount',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

describe('useUnifiedContract Hook', () => {
  // Default test values
  const contractAddress = '0x1234567890123456789012345678901234567890';
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default implementation using ethers
    (useAppConfig as unknown as jest.Mock).mockReturnValue(false);
    (useAppConfig as unknown as jest.Mock).mockImplementation((selector) => {
      if (typeof selector === 'function') {
        const state = {
          useWagmi: false,
          markComponentMigrated: jest.fn(),
        };
        return selector(state);
      }
      return undefined;
    });
    
    // Mock useUnifiedWallet
    (useUnifiedWallet as jest.Mock).mockReturnValue({
      signer: {},
      provider: {},
      isConnected: true,
    });
    
    // Mock Wagmi hooks
    (useReadContract as jest.Mock).mockReturnValue({
      data: '100',
      isLoading: false,
      error: null,
    });
    
    (useWriteContract as jest.Mock).mockReturnValue({
      writeContractAsync: jest.fn().mockResolvedValue('0xhash'),
      data: '0xhash',
      error: null,
    });
    
    (useSimulateContract as jest.Mock).mockReturnValue({
      data: {},
      error: null,
    });
  });
  
  describe('Ethers Implementation', () => {
    test('should return the ethers implementation when useWagmi is false', () => {
      const { result } = renderHook(() => useUnifiedContract(contractAddress, testAbi));
      
      expect(result.current.implementation).toBe('ethers');
      expect(result.current.contract).toBeTruthy();
    });
    
    test('should provide read function for ethers implementation', async () => {
      // Mock the ethers contract instance
      const mockContractInstance = {
        getCount: jest.fn().mockResolvedValue(BigNumber.from(42)),
      };
      
      jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContractInstance as any);
      
      const { result } = renderHook(() => useUnifiedContract(contractAddress, testAbi));
      
      let readResult;
      await act(async () => {
        readResult = await result.current.read('getCount');
      });
      
      expect(mockContractInstance.getCount).toHaveBeenCalled();
      expect(readResult).toEqual(BigNumber.from(42));
    });
    
    test('should provide write function for ethers implementation', async () => {
      // Mock the transaction
      const mockTx = {
        wait: jest.fn().mockResolvedValue({ hash: '0xmockhash' }),
      };
      
      // Mock the ethers contract instance
      const mockContractInstance = {
        setCount: jest.fn().mockResolvedValue(mockTx),
      };
      
      jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContractInstance as any);
      
      const { result } = renderHook(() => useUnifiedContract(contractAddress, testAbi));
      
      let writeResult;
      await act(async () => {
        writeResult = await result.current.write('setCount', [123]);
      });
      
      expect(mockContractInstance.setCount).toHaveBeenCalledWith(123);
      expect(mockTx.wait).toHaveBeenCalled();
      expect(writeResult).toBe('0xmockhash');
    });
    
    test('should handle errors in ethers read operations', async () => {
      // Mock the ethers contract instance with error
      const mockError = new Error('Contract read failed');
      const mockContractInstance = {
        getCount: jest.fn().mockRejectedValue(mockError),
      };
      
      jest.spyOn(ethers, 'Contract').mockImplementation(() => mockContractInstance as any);
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useUnifiedContract(contractAddress, testAbi));
      
      await expect(result.current.read('getCount')).rejects.toThrow('Contract read failed');
      expect(console.error).toHaveBeenCalled();
    });
    
    // Test for graceful degradation as mentioned in the memories
    test('should handle missing provider gracefully', async () => {
      (useUnifiedWallet as jest.Mock).mockReturnValue({
        signer: null,
        provider: null,
        isConnected: false,
      });
      
      const { result } = renderHook(() => useUnifiedContract(contractAddress, testAbi));
      
      expect(result.current.contract).toBeNull();
      await expect(result.current.read('getCount')).resolves.toBeNull();
      await expect(result.current.write('setCount', [123])).resolves.toBeNull();
    });
  });
  
  describe('Wagmi Implementation', () => {
    beforeEach(() => {
      // Set useWagmi to true
      (useAppConfig as unknown as jest.Mock).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          const state = {
            useWagmi: true,
            markComponentMigrated: jest.fn(),
          };
          return selector(state);
        }
        return undefined;
      });
    },);
    
    test('should return the wagmi implementation when useWagmi is true', () => {
      const { result } = renderHook(() => useUnifiedContract(contractAddress, testAbi));
      
      expect(result.current.implementation).toBe('wagmi');
      expect(result.current.contract).toBeNull();
    });
    
    test('should provide read function for wagmi implementation', async () => {
      (useReadContract as jest.Mock).mockReturnValue({
        data: 42,
        isLoading: false,
        error: null,
      });
      
      const { result } = renderHook(() => useUnifiedContract(contractAddress, testAbi));
      
      let readResult;
      await act(async () => {
        readResult = await result.current.read('getCount');
      });
      
      expect(useReadContract).toHaveBeenCalled();
      expect(readResult).toBe(42);
    });
    
    test('should provide write function for wagmi implementation', async () => {
      const writeContractAsyncMock = jest.fn().mockResolvedValue('0xwagmihash');
      
      (useWriteContract as jest.Mock).mockReturnValue({
        writeContractAsync: writeContractAsyncMock,
        data: '0xwagmihash',
        error: null,
      });
      
      const { result } = renderHook(() => useUnifiedContract(contractAddress, testAbi));
      
      let writeResult;
      await act(async () => {
        writeResult = await result.current.write('setCount', [123]);
      });
      
      expect(writeContractAsyncMock).toHaveBeenCalledWith(expect.objectContaining({
        address: contractAddress,
        functionName: 'setCount',
        args: [123],
      }));
      expect(writeResult).toBe('0xwagmihash');
    });
    
    test('should handle errors in wagmi read operations', async () => {
      const mockError = new Error('Wagmi read failed');
      
      (useReadContract as jest.Mock).mockImplementation(() => {
        throw mockError;
      });
      
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useUnifiedContract(contractAddress, testAbi));
      
      await expect(result.current.read('getCount')).rejects.toThrow('Wagmi read failed');
      expect(console.error).toHaveBeenCalled();
    });
    
    test('should handle errors in wagmi write operations', async () => {
      const mockError = new Error('Wagmi write failed');
      const writeContractAsyncMock = jest.fn().mockRejectedValue(mockError);
      
      (useWriteContract as jest.Mock).mockReturnValue({
        writeContractAsync: writeContractAsyncMock,
        data: null,
        error: null,
      });
      
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const { result } = renderHook(() => useUnifiedContract(contractAddress, testAbi));
      
      await expect(result.current.write('setCount', [123])).rejects.toThrow('Wagmi write failed');
      expect(console.error).toHaveBeenCalled();
    });
    
    // Test the telemetry marking functionality
    test('should mark component as migrated', () => {
      const markComponentMigratedMock = jest.fn();
      
      (useAppConfig as unknown as jest.Mock).mockImplementation((selector) => {
        if (typeof selector === 'function') {
          const state = {
            useWagmi: true,
            markComponentMigrated: markComponentMigratedMock,
          };
          return selector(state);
        }
        return undefined;
      });
      
      renderHook(() => useUnifiedContract(contractAddress, testAbi));
      
      expect(markComponentMigratedMock).toHaveBeenCalledWith('ContractInteractions');
    });
  });
});
