import { useAppConfig } from '@/config/app-config';
import { useReadContract, useWriteContract, useSimulateContract } from 'wagmi';
import { Abi, ContractFunctionArgs, Address } from 'viem';
import { ethers, Contract } from 'ethers';
import { useEffect } from 'react';
import { useUnifiedWallet } from './useUnifiedWallet';
import { Web3Implementation } from '@/types/web3-types';

/**
 * Unified contract hook that provides a consistent interface for reading from
 * and writing to smart contracts using either Ethers or Wagmi
 * 
 * @param contractAddress The address of the contract
 * @param contractAbi The ABI of the contract
 * @returns Methods to interact with the contract using the selected implementation
 */
/**
 * Type for the return value from a contract read operation
 */
export type ContractReadResult<T = unknown> = T | null;

/**
 * Type for the return value from a contract write operation
 */
export type ContractWriteResult = string | null;

/**
 * Type for contract read parameters
 */
export interface ContractReadParams {
  functionName: string;
  args?: unknown[];
}

/**
 * Type for contract write parameters
 */
export interface ContractWriteParams {
  functionName: string;
  args?: unknown[];
}

/**
 * Unified contract hook that provides a consistent interface for reading from
 * and writing to smart contracts using either Ethers or Wagmi
 */
export function useUnifiedContract(contractAddress: string, contractAbi: any) { // Use any for contract ABI to accommodate both Ethers and Viem
  const useWagmi = useAppConfig((state) => state.useWagmi);
  const markComponentMigrated = useAppConfig((state) => state.markComponentMigrated);
  const { signer, provider, isConnected } = useUnifiedWallet();
  
  // Hook for Wagmi write operations - must be at component level, not inside functions
  const { writeContractAsync, data: writeHash } = useWriteContract();
  
  // We'll use the Wagmi hooks in a more direct way instead of with config parameters
  // that aren't compatible with the current version
  
  // Mark this component as migrated
  useEffect(() => {
    markComponentMigrated('ContractInteractions');
  }, [markComponentMigrated]);

  // ------ Wagmi Implementation ------
  
  // For read operations
  const readContractWithWagmi = async <T = unknown>(functionName: string, args: unknown[] = []): Promise<ContractReadResult<T>> => {
    if (!useWagmi) return null;
    
    try {
      // Use the useReadContract hook directly
      const { data } = useReadContract({
        address: contractAddress as `0x${string}`,
        abi: contractAbi,
        functionName,
        args, // We'll use the type assertion after receiving the data instead
      });
      
      // Return the data from the hook with proper typing
      return data as ContractReadResult<T>;
    } catch (error) {
      console.error(`Error reading contract with Wagmi: ${functionName}`, error);
      throw error;
    }
  };
  
  // For write operations - uses the hooks defined at component level
  const writeContractWithWagmi = async (functionName: string, args: unknown[] = []): Promise<ContractWriteResult> => {
    if (!useWagmi || !isConnected) return null;
    
    try {
      // We'll use the already initialized hooks at component level
      // The simulation was done at component level
      
      // Perform the write operation
      const hash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: contractAbi,
        functionName,
        args,
      });
      
      return hash;
    } catch (error) {
      console.error(`Error writing to contract with Wagmi: ${functionName}`, error);
      throw error;
    }
  };
  
  // ------ Ethers Implementation ------
  
  // Create an Ethers contract instance
  const getEthersContract = () => {
    if (!useWagmi && provider) {
      const contractInstance = new ethers.Contract(
        contractAddress,
        contractAbi,
        signer || provider
      );
      return contractInstance;
    }
    return null;
  };
  
  // Read function with Ethers
  const readContractWithEthers = async <T = unknown>(functionName: string, args: unknown[] = []): Promise<ContractReadResult<T>> => {
    if (useWagmi) return null;
    
    const contract = getEthersContract();
    if (!contract) {
      throw new Error('Contract not initialized');
    }
    
    try {
      // @ts-expect-error - Dynamic property access on contract methods is expected
      const result = await contract[functionName](...args);
      return result;
    } catch (error) {
      console.error(`Error reading contract with Ethers: ${functionName}`, error);
      throw error;
    }
  };
  
  // Write function with Ethers
  const writeContractWithEthers = async (functionName: string, args: unknown[] = []): Promise<ContractWriteResult> => {
    if (useWagmi || !isConnected) return null;
    
    const contract = getEthersContract();
    if (!contract || !signer) {
      throw new Error('Contract or signer not initialized');
    }
    
    try {
      // @ts-expect-error - Dynamic property access on contract methods is expected
      const tx = await contract[functionName](...args);
      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error) {
      console.error(`Error writing to contract with Ethers: ${functionName}`, error);
      throw error;
    }
  };
  
  // ------ Unified Interface ------
  
  return {
    read: useWagmi ? readContractWithWagmi : readContractWithEthers,
    write: useWagmi ? writeContractWithWagmi : writeContractWithEthers,
    // Indicate which implementation is being used
    implementation: useWagmi ? 'wagmi' : 'ethers' as Web3Implementation,
    // Provide the raw contract for advanced usage
    contract: useWagmi ? null : getEthersContract(),
  };
}
