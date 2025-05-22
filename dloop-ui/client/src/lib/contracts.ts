import { ethers } from 'ethers';
import { getABI, getContractAddress as getAddressFromRegistry, getContractVersion, ContractName } from './abiRegistry';

/**
 * Re-export getContractAddress for backward compatibility
 * @param contractName The name of the contract
 * @returns The address of the contract
 * @throws Error if contract address is not found
 */
export const getContractAddress = (contractName: string): string => {
  const address = getAddressFromRegistry(contractName);
  if (!address) {
    throw new Error(`Contract address for ${contractName} not found`);
  }
  return address;
};

/**
 * Get an instance of a contract with the provided signer or provider
 * @param contractName The name of the contract to get
 * @param signerOrProvider The signer or provider to use for the contract
 * @param version Optional specific version of the contract ABI to use
 * @returns A contract instance
 */
export const getContract = (
  contractName: ContractName,
  signerOrProvider: ethers.BrowserProvider | ethers.JsonRpcSigner | ethers.JsonRpcProvider | null,
  version?: string
) => {
  if (!signerOrProvider) {
    throw new Error('No signer or provider provided');
  }
  
  const abi = getABI(contractName, version);
  const address = getContractAddress(contractName);
  
  if (!abi) {
    throw new Error(`ABI for contract ${contractName} not found`);
  }
  
  if (!address) {
    throw new Error(`Address for contract ${contractName} not found`);
  }
  
  return new ethers.Contract(
    address,
    abi,
    signerOrProvider
  );
};

/**
 * Get the current version of a contract ABI
 * @param contractName The name of the contract
 * @returns The current version of the contract ABI
 */
export const getCurrentVersion = (contractName: ContractName): string => {
  return getContractVersion(contractName);
};

/**
 * Get a read-only (view) contract that doesn't require signing transactions
 * @param contractName The name of the contract
 * @param provider The provider to use for reading contract state
 * @param version Optional specific version of the contract ABI to use
 * @returns A read-only contract instance
 */
export function getReadOnlyContract(
  contractName: ContractName,
  provider: ethers.JsonRpcProvider | ethers.BrowserProvider | null,
  version?: string
) {
  if (!provider) {
    throw new Error('No provider available');
  }
  
  return getContract(contractName, provider, version);
};

/**
 * Helper function to get an AssetDAO contract instance with the correct type
 * @param signerOrProvider The signer or provider to use for the contract
 * @param version Optional specific version of the contract ABI to use
 * @returns A typed contract instance
 */
export const AssetDAOContract = (
  signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcProvider,
  version?: string
) => {
  return getContract('AssetDAO', signerOrProvider, version);
};

/**
 * Helper function to get a ProtocolDAO contract instance
 * @param signerOrProvider The signer or provider to use for the contract
 * @param version Optional specific version of the contract ABI to use
 * @returns A typed contract instance
 */
export const ProtocolDAOContract = (
  signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcProvider,
  version?: string
) => {
  return getContract('ProtocolDAO', signerOrProvider, version);
};

/**
 * Helper function to get a DLoopToken contract instance
 * @param signerOrProvider The signer or provider to use for the contract
 * @param version Optional specific version of the contract ABI to use
 * @returns A typed contract instance
 */
export const DLoopTokenContract = (
  signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcProvider,
  version?: string
) => {
  return getContract('DLoopToken', signerOrProvider, version);
};

/**
 * Helper function to get an AINodeRegistry contract instance
 * @param signerOrProvider The signer or provider to use for the contract
 * @param version Optional specific version of the contract ABI to use
 * @returns A typed contract instance
 */
export const AINodeRegistryContract = (
  signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcProvider,
  version?: string
) => {
  return getContract('AINodeRegistry', signerOrProvider, version);
};

/**
 * Helper function to get a SoulboundNFT contract instance
 * @param signerOrProvider The signer or provider to use for the contract
 * @param version Optional specific version of the contract ABI to use
 * @returns A typed contract instance
 */
export const SoulboundNFTContract = (
  signerOrProvider: ethers.JsonRpcSigner | ethers.JsonRpcProvider,
  version?: string
) => {
  return getContract('SoulboundNFT', signerOrProvider, version);
};