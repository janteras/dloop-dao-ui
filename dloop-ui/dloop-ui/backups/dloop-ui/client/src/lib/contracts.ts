import { ethers } from 'ethers';
import { contracts, ADDRESSES, ABIS } from '@/config/contracts';

/**
 * Get an instance of a contract with the provided signer or provider
 * @param contractName The name of the contract to get
 * @param signerOrProvider The signer or provider to use for the contract
 * @returns A contract instance
 */
export const getContract = (
  contractName: keyof typeof contracts, 
  signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcProvider | null
) => {
  if (!contracts[contractName]) {
    throw new Error(`Contract ${contractName} not found`);
  }
  
  if (!signerOrProvider) {
    throw new Error('No signer or provider provided');
  }
  
  return new ethers.Contract(
    contracts[contractName].address,
    contracts[contractName].abi,
    signerOrProvider
  );
};

/**
 * Get the address of a contract
 * @param contractName The name of the contract
 * @returns The address of the contract
 */
export const getContractAddress = (contractName: keyof typeof ADDRESSES) => {
  if (!ADDRESSES[contractName]) {
    throw new Error(`Contract address for ${contractName} not found`);
  }
  
  return ADDRESSES[contractName];
};

/**
 * Get a read-only (view) contract that doesn't require signing transactions
 * @param contractName The name of the contract
 * @param provider The provider to use for reading contract state
 * @returns A read-only contract instance
 */
export const getReadOnlyContract = (
  contractName: keyof typeof contracts,
  provider: ethers.JsonRpcProvider | null
) => {
  if (!provider) {
    throw new Error('No provider available');
  }
  
  return getContract(contractName, provider);
};

/**
 * Helper function to get an AssetDAO contract instance with the correct type
 * @param signerOrProvider The signer or provider to use for the contract
 * @returns A contract instance
 */
export const AssetDAOContract = (signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcProvider) => {
  return new ethers.Contract(
    ADDRESSES.AssetDAO,
    ABIS.AssetDAO,
    signerOrProvider
  );
};