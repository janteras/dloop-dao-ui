import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import assetDaoAbi from '@/abis/assetdao.abi.v1.json';
import dloopTokenAbi from '@/abis/dlooptoken.abi.v1.json';
import protocolDaoAbi from '@/abis/protocoldao.abi.v1.json';
import aiNodeRegistryAbi from '@/abis/ainoderegistry.abi.v1.json';
import soulboundNftAbi from '@/abis/soulboundnft.abi.v1.json';

// Contract ABI registry with validation
const CONTRACT_ABIS = {
  AssetDAO: assetDaoAbi.abi,
  DLoopToken: dloopTokenAbi.abi,
  ProtocolDAO: protocolDaoAbi.abi,
  AINodeRegistry: aiNodeRegistryAbi.abi,
  SoulboundNFT: soulboundNftAbi.abi,
} as const;

type ContractName = keyof typeof CONTRACT_ABIS;

/**
 * Validate ABI has required methods
 */
function validateContractABI(contractName: ContractName, abi: any[]): boolean {
  const requiredMethods: Record<ContractName, string[]> = {
    AssetDAO: ['getProposal', 'getProposalCount', 'vote', 'createProposal', 'hasVoted'],
    DLoopToken: ['balanceOf', 'transfer', 'approve'],
    ProtocolDAO: ['getProposal', 'vote'],
    AINodeRegistry: ['getNode'],
    SoulboundNFT: ['balanceOf', 'tokenURI']
  };

  const methods = abi
    .filter(item => item.type === 'function')
    .map(item => item.name);

  const required = requiredMethods[contractName] || [];
  const missing = required.filter(method => !methods.includes(method));

  if (missing.length > 0) {
    console.error(`❌ ABI validation failed for ${contractName}. Missing methods:`, missing);
    return false;
  }

  console.log(`✅ ABI validation passed for ${contractName}`);
  return true;
}

/**
 * Get contract instance with enhanced error handling and ABI validation
 */
export function getContract(
  name: ContractName,
  provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner
): ethers.Contract {
  try {
    console.log(`🔗 Getting contract instance for ${name}...`);

    const address = CONTRACT_ADDRESSES[name];
    if (!address) {
      throw new Error(`No address found for contract ${name}`);
    }

    const abi = CONTRACT_ABIS[name];
    if (!abi) {
      throw new Error(`No ABI found for contract ${name}`);
    }

    // Validate ABI has required methods
    if (!validateContractABI(name, abi)) {
      console.warn(`⚠️ ABI validation failed for ${name}, proceeding with caution`);
    }

    console.log(`📍 Contract ${name} address: ${address}`);
    console.log(`📋 Contract ${name} ABI methods:`, abi.filter(item => item.type === 'function').map(item => item.name));

    const contract = new ethers.Contract(address, abi, provider);

    // Test contract accessibility
    if (name === 'AssetDAO') {
      // Test getProposalCount method specifically for AssetDAO
      try {
        // First check if we're on the correct network (non-blocking)
        provider.getNetwork().then((network) => {
          const currentChainId = Number(network.chainId);

          if (currentChainId !== 11155111) { // Sepolia chain ID
            // Only log network warning once per session and only if wallet is connected
            const warningKey = `network-warning-${currentChainId}`;
            if (!sessionStorage.getItem(warningKey) && window.ethereum) {
              // Check if wallet is actually connected before showing warning
              window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
                if (accounts.length > 0) {
                  const networkName = currentChainId === 1 ? 'Ethereum Mainnet' : `Chain ${currentChainId}`;
                  console.warn(`🚨 Wrong Network: Connected to ${networkName} (${currentChainId}), but D-Loop requires Sepolia Testnet (11155111). Please switch networks.`);

                  // Provide more helpful error message
                  const errorMessage = currentChainId === 1
                    ? 'D-Loop is currently running on Sepolia Testnet. Please switch from Ethereum Mainnet to Sepolia Testnet in your wallet.'
                    : `Wrong network: Connected to chain ${currentChainId}, but D-Loop requires Sepolia Testnet (11155111). Please switch networks.`;

                  sessionStorage.setItem(warningKey, 'true');
                }
              }).catch(() => {
                // Ignore error if can't check accounts
              });
            }
            return;
          }

          // Clear any network warning flags if we're on the correct network
          Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('network-warning-')) {
              sessionStorage.removeItem(key);
            }
          });

          // Test the contract by calling a simple method (non-blocking)
          contract.getProposalCount().then((count) => {
            console.log(`✅ AssetDAO contract verified on Sepolia. Proposal count: ${count}`);
          }).catch((asyncError) => {
            console.log(`❌ AssetDAO contract test failed:`, asyncError.message || asyncError);
          });
        }).catch((networkError) => {
          console.log(`❌ AssetDAO network check failed:`, networkError.message || networkError);
        });
      } catch (error) {
        console.log(`❌ AssetDAO contract test failed:`, error);
      }
    }

    return contract;

  } catch (error) {
    console.error(`❌ Error creating contract instance for ${name}:`, error);
    throw error;
  }
}

/**
 * Test contract method accessibility
 */
export async function testContractMethod(
  contractName: ContractName,
  methodName: string,
  provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner,
  args: any[] = []
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    const contract = getContract(contractName, provider);

    if (!contract[methodName]) {
      return {
        success: false,
        error: `Method ${methodName} not found on contract ${contractName}`
      };
    }

    console.log(`🧪 Testing ${contractName}.${methodName}(${args.join(', ')})...`);

    const result = await contract[methodName](...args);

    console.log(`✅ ${contractName}.${methodName} success:`, result);
    return { success: true, result };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ ${contractName}.${methodName} failed:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Run comprehensive contract diagnostics
 */
export async function runContractDiagnostics(
  provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Promise<Record<ContractName, { accessible: boolean; methods: Record<string, boolean>; errors: string[] }>> {
  console.log('🔍 Running comprehensive contract diagnostics...');

  const results = {} as Record<ContractName, { accessible: boolean; methods: Record<string, boolean>; errors: string[] }>;

  for (const contractName of Object.keys(CONTRACT_ABIS) as ContractName[]) {
    results[contractName] = {
      accessible: false,
      methods: {},
      errors: []
    };

    try {
      const contract = getContract(contractName, provider);
      results[contractName].accessible = true;

      // Test key methods
      const keyMethods: Record<ContractName, string[]> = {
        AssetDAO: ['getProposalCount', 'getProposal'],
        DLoopToken: ['totalSupply'],
        ProtocolDAO: ['getProposalCount'],
        AINodeRegistry: ['getActiveNodes'],
        SoulboundNFT: ['totalSupply']
      };

      const methodsToTest = keyMethods[contractName] || [];

      for (const method of methodsToTest) {
        const testResult = await testContractMethod(contractName, method, provider);
        results[contractName].methods[method] = testResult.success;

        if (!testResult.success && testResult.error) {
          results[contractName].errors.push(`${method}: ${testResult.error}`);
        }
      }

    } catch (error) {
      results[contractName].errors.push(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  console.log('📊 Contract diagnostics completed:', results);
  return results;
}

/**
 * Get contract address by name
 */
export function getContractAddress(name: ContractName): string {
  const address = CONTRACT_ADDRESSES[name];
  if (!address) {
    throw new Error(`No address found for contract ${name}`);
  }
  return address;
}

/**
 * Get read-only contract instance (for reading data without a signer)
 */
export function getReadOnlyContract(
  name: ContractName,
  provider: ethers.JsonRpcProvider
): ethers.Contract {
  return getContract(name, provider);
}

export default { getContract, getContractAddress, getReadOnlyContract, testContractMethod, runContractDiagnostics };