/**
 * @file abiRegistry.ts
 * @description Centralized registry for ABI management with versioning
 */

// Define the valid contract names as a union type for type safety
export type ContractName = 'AssetDAO' | 'ProtocolDAO' | 'DLoopToken' | 'AINodeRegistry' | 'SoulboundNFT' | 'GovernanceRewards' | 'Treasury' | 'PriceOracle' | 'ChainlinkPriceOracle' | 'AINodeGovernance' | 'FeeCalculator' | 'FeeProcessor';

import AssetDAOABI from '@/abis/assetdao.abi.v1.json';
import ProtocolDAOABI from '@/abis/protocoldao.abi.v1.json';
import DLoopTokenABI from '@/abis/dlooptoken.abi.v1.json';
import AINodeRegistryABI from '@/abis/ainoderegistry.abi.v1.json';
import SoulboundNFTABI from '@/abis/soulboundnft.abi.v1.json';

import { normalizeABI, isValidABI } from './abiUtils';

/**
 * Contract network configuration
 * @interface NetworkConfig
 */
export interface NetworkConfig {
  /** Network chain ID */
  chainId: number;
  /** Contract deployment addresses for this network */
  addresses: Record<string, string>;
  /** Block explorer base URL */
  explorerUrl: string;
  /** Network name */
  name: string;
}

/**
 * Contract registry entry
 * @interface ContractRegistryEntry
 */
export interface ContractRegistryEntry {
  /** Contract name */
  name: string;
  /** ABI for this contract */
  abi: any;
  /** Current ABI version */
  version: string;
  /** First supported ABI version */
  firstVersion: string;
  /** Contract documentation URL */
  docs?: string;
  /** Mapping of functions to their descriptions */
  functionDocs?: Record<string, string>;
}

/**
 * Sepolia testnet configuration
 */
export const SEPOLIA_CONFIG: NetworkConfig = {
  chainId: 11155111,
  name: 'Sepolia Testnet',
  explorerUrl: 'https://sepolia.etherscan.io',
  addresses: {
    AssetDAO: '0xa87e662061237a121Ca2E83E77dA8251bc4B3529',
    ProtocolDAO: '0x012e4042ab5F55A556a8B453aBeC852D9466aFb0',
    DLoopToken: '0x05B366778566e93abfB8e4A9B794e4ad006446b4',
    SoulboundNFT: '0x6391C14631b2Be5374297fA3110687b80233104c',
    AINodeRegistry: '0x0045c7D99489f1d8A5900243956B0206344417DD',
    GovernanceRewards: '0x295e6f4644AcC2b0bB762bBE1bba86F08D8b85f2',
    Treasury: '0x476aAF510540F4c755cCe7E0FAaC7560b5D711F4',
    PriceOracle: '0x3D3aEA9D8ad748398a55bf0f7f9832498758f92a',
    ChainlinkPriceOracle: '0xa1A0B6F1a771faBe3a3963b922bf6ea1D4F7bb1b',
    AINodeGovernance: '0x28fe6eA0D91D5Ca8C080E727cdEb02B2B740f458',
    FeeCalculator: '0x0EB08c64dB39286680B89B548e7A545708F48adf',
    FeeProcessor: '0x96664603DDFB16DfaF3Ea329216Dd461AcfEffaA',
    // Add more contract addresses as needed
  },
};

/**
 * ABI registry for all contracts
 */
export const ABI_REGISTRY: Record<string, ContractRegistryEntry> = {
  AssetDAO: {
    name: 'Asset DAO',
    abi: AssetDAOABI,
    version: '1.0.0',
    firstVersion: '1.0.0',
    docs: 'https://docs.dloop.io/contracts/assetdao',
    functionDocs: {
      createProposal: 'Creates a new proposal in the AssetDAO',
      vote: 'Votes on an existing proposal',
      executeProposal: 'Executes a passed proposal',
      invest: 'Invests in an asset pool',
      divest: 'Divests from an asset pool',
    },
  },
  ProtocolDAO: {
    name: 'Protocol DAO',
    abi: ProtocolDAOABI,
    version: '1.0.0',
    firstVersion: '1.0.0',
    docs: 'https://docs.dloop.io/contracts/protocoldao',
  },
  DLoopToken: {
    name: 'DLOOP Token',
    abi: DLoopTokenABI,
    version: '1.0.0',
    firstVersion: '1.0.0',
    docs: 'https://docs.dloop.io/contracts/dlooptoken',
  },
  AINodeRegistry: {
    name: 'AI Node Registry',
    abi: AINodeRegistryABI,
    version: '1.0.0',
    firstVersion: '1.0.0',
    docs: 'https://docs.dloop.io/contracts/ainoderegistry',
  },
  SoulboundNFT: {
    name: 'Soulbound NFT',
    abi: SoulboundNFTABI,
    version: '1.0.0',
    firstVersion: '1.0.0',
    docs: 'https://docs.dloop.io/contracts/soulboundnft',
  },
};

/**
 * Network configurations by chain ID
 */
export const NETWORKS: Record<number, NetworkConfig> = {
  11155111: SEPOLIA_CONFIG,
};

/**
 * Default network to use
 */
export const DEFAULT_NETWORK = SEPOLIA_CONFIG;

/**
 * Get the ABI for a contract
 * @param contractName - Name of the contract
 * @param version - Optional specific version of the ABI to retrieve
 * @returns The normalized ABI array or undefined if not found
 */
export function getABI(contractName: string, version?: string): any {
  try {
    const entry = ABI_REGISTRY[contractName];
    if (!entry) {
      console.error(`Contract ${contractName} not found in ABI registry`);
      return undefined;
    }

    // If no version is specified, use the latest
    let abi;
    if (!version) {
      abi = entry.abi;
    } else {
      // If a specific version is requested, handle version-specific logic here
      // This would require having multiple versions of the ABI available
      console.warn(`Specific version ${version} requested for ${contractName}, but versioning is not fully implemented yet`);
      abi = entry.abi;
    }

    // Normalize the ABI to ensure it's in the correct format
    const normalizedABI = normalizeABI(abi);
    
    // Validate the normalized ABI
    if (!isValidABI(normalizedABI)) {
      console.error(`Invalid ABI format for ${contractName}:`, normalizedABI);
      throw new Error(`Invalid ABI format for ${contractName}`);
    }
    
    return normalizedABI;
  } catch (error: any) {
    console.error(`Error getting ABI for ${contractName}:`, error);
    const errorMessage = error.message || 'Unknown error';
    throw new Error(`Failed to get ABI for ${contractName}: ${errorMessage}`);
  }
}

/**
 * Get the address for a contract on a specific network
 * @param contractName - Name of the contract
 * @param chainId - Chain ID of the network
 * @returns The contract address or undefined if not found
 */
export function getContractAddress(contractName: string, chainId: number = DEFAULT_NETWORK.chainId): string | undefined {
  const network = NETWORKS[chainId];
  if (!network) {
    console.error(`Network with chain ID ${chainId} not found`);
    return undefined;
  }

  const address = network.addresses[contractName];
  if (!address) {
    console.error(`Contract ${contractName} not found on network ${network.name}`);
    return undefined;
  }

  return address;
}

/**
 * Get the contract configuration
 * @param contractName - Name of the contract
 * @returns The contract configuration or undefined if not found
 */
export function getContractConfig(contractName: string): ContractRegistryEntry | undefined {
  return ABI_REGISTRY[contractName];
}

/**
 * Get the current version of a contract's ABI
 * @param contractName - Name of the contract
 * @returns The current version of the contract's ABI or undefined if not found
 */
export function getContractVersion(contractName: string): string {
  const contract = ABI_REGISTRY[contractName];
  if (!contract) {
    console.error(`Contract ${contractName} not found in ABI registry`);
    return '0.0.0';
  }
  return contract.version;
}

/**
 * Get the explorer URL for a contract
 * @param contractName - Name of the contract
 * @param chainId - Chain ID of the network
 * @returns The explorer URL for the contract
 */
export function getContractExplorerUrl(contractName: string, chainId: number = DEFAULT_NETWORK.chainId): string | undefined {
  const address = getContractAddress(contractName, chainId);
  if (!address) {
    return undefined;
  }

  const network = NETWORKS[chainId];
  if (!network) {
    return undefined;
  }

  return `${network.explorerUrl}/address/${address}`;
}

/**
 * Get all supported contracts
 * @returns Array of contract names
 */
export function getSupportedContracts(): string[] {
  return Object.keys(ABI_REGISTRY);
}

/**
 * Contract metadata including name, version, and address
 * @interface ContractMetadata
 */
export interface ContractMetadata {
  name: string;
  fullName: string;
  version: string;
  address: string;
  explorerUrl: string;
}

/**
 * Get metadata for all contracts on a specific network
 * @param chainId - Chain ID of the network
 * @returns Array of contract metadata
 */
export function getAllContractsMetadata(chainId: number = DEFAULT_NETWORK.chainId): ContractMetadata[] {
  const network = NETWORKS[chainId];
  if (!network) {
    console.error(`Network with chain ID ${chainId} not found`);
    return [];
  }

  return Object.keys(ABI_REGISTRY).map(contractName => {
    const contract = ABI_REGISTRY[contractName];
    const address = network.addresses[contractName] || '';
    
    return {
      name: contractName,
      fullName: contract.name,
      version: contract.version,
      address,
      explorerUrl: address ? `${network.explorerUrl}/address/${address}` : '',
    };
  });
}
