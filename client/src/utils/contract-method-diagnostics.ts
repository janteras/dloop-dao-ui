
/**
 * Contract Method Diagnostics
 * 
 * Analyzes why contract methods might be failing and suggests solutions
 */

import { ethers } from 'ethers';
import { getContract } from '@/lib/contracts';

export interface MethodDiagnostic {
  methodName: string;
  success: boolean;
  error?: string;
  gasEstimate?: string;
  result?: any;
}

export interface ContractDiagnostic {
  contractName: string;
  address: string;
  accessible: boolean;
  blockNumber?: number;
  methodResults: MethodDiagnostic[];
  recommendations: string[];
}

/**
 * Test all AssetDAO contract methods to identify issues
 */
export async function diagnoseAssetDAOContract(
  provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Promise<ContractDiagnostic> {
  const diagnostic: ContractDiagnostic = {
    contractName: 'AssetDAO',
    address: '',
    accessible: false,
    methodResults: [],
    recommendations: []
  };

  try {
    const assetDAO = getContract('AssetDAO', provider);
    diagnostic.address = assetDAO.target as string;
    
    // Get current block number for context
    try {
      diagnostic.blockNumber = await provider.getBlockNumber();
    } catch (err) {
      diagnostic.recommendations.push('Provider connection issues detected');
    }

    // Test core read methods
    const readMethods = [
      'getProposalCount',
      'quorum',
      'votingDelay',
      'votingPeriod'
    ];

    for (const methodName of readMethods) {
      try {
        console.log(`Testing method: ${methodName}`);
        const result = await assetDAO[methodName]();
        
        diagnostic.methodResults.push({
          methodName,
          success: true,
          result: result.toString()
        });
        
        diagnostic.accessible = true;
        
      } catch (error: any) {
        console.error(`Method ${methodName} failed:`, error);
        
        diagnostic.methodResults.push({
          methodName,
          success: false,
          error: error.message
        });

        // Analyze specific error types
        if (error.message.includes('execution reverted')) {
          diagnostic.recommendations.push(`Method ${methodName}: Contract execution reverted - check contract state`);
        } else if (error.message.includes('network')) {
          diagnostic.recommendations.push(`Method ${methodName}: Network connectivity issues`);
        } else if (error.message.includes('gas')) {
          diagnostic.recommendations.push(`Method ${methodName}: Gas estimation failed`);
        } else {
          diagnostic.recommendations.push(`Method ${methodName}: ${error.message}`);
        }
      }
    }

    // Test with specific proposal ID if proposals exist
    if (diagnostic.accessible) {
      try {
        const proposalCount = await assetDAO.getProposalCount();
        const count = Number(proposalCount);
        
        if (count > 0) {
          // Test getProposal with first proposal
          try {
            const proposal = await assetDAO.getProposal(0);
            diagnostic.methodResults.push({
              methodName: 'getProposal(0)',
              success: true,
              result: JSON.stringify({
                proposer: proposal.proposer,
                forVotes: proposal.forVotes?.toString(),
                againstVotes: proposal.againstVotes?.toString(),
                state: Number(proposal.state || proposal.status || 0)
              })
            });
          } catch (error: any) {
            diagnostic.methodResults.push({
              methodName: 'getProposal(0)',
              success: false,
              error: error.message
            });
          }
        }
      } catch (err) {
        // Already handled above
      }
    }

    // Generate final recommendations
    if (!diagnostic.accessible) {
      diagnostic.recommendations.push('Contract is not accessible - check network connection and contract address');
    }

    const failedMethods = diagnostic.methodResults.filter(m => !m.success);
    if (failedMethods.length > 0) {
      diagnostic.recommendations.push(`${failedMethods.length} methods failed - contract may not be fully deployed or network issues`);
    }

    return diagnostic;

  } catch (error: any) {
    diagnostic.recommendations.push(`Contract initialization failed: ${error.message}`);
    return diagnostic;
  }
}

/**
 * Test governance token contract methods
 */
export async function diagnoseTokenContract(
  provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Promise<ContractDiagnostic> {
  const diagnostic: ContractDiagnostic = {
    contractName: 'DLoopToken',
    address: '',
    accessible: false,
    methodResults: [],
    recommendations: []
  };

  try {
    const dloopToken = getContract('DLoopToken', provider);
    diagnostic.address = dloopToken.target as string;
    
    const readMethods = [
      'name',
      'symbol',
      'decimals',
      'totalSupply'
    ];

    for (const methodName of readMethods) {
      try {
        const result = await dloopToken[methodName]();
        diagnostic.methodResults.push({
          methodName,
          success: true,
          result: result.toString()
        });
        diagnostic.accessible = true;
      } catch (error: any) {
        diagnostic.methodResults.push({
          methodName,
          success: false,
          error: error.message
        });
      }
    }

    if (!diagnostic.accessible) {
      diagnostic.recommendations.push('Token contract not accessible - check governance token address');
    }

    return diagnostic;

  } catch (error: any) {
    diagnostic.recommendations.push(`Token contract initialization failed: ${error.message}`);
    return diagnostic;
  }
}

/**
 * Comprehensive contract diagnostics
 */
export async function runFullContractDiagnostics(
  provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Promise<{
  assetDAO: ContractDiagnostic;
  token: ContractDiagnostic;
  summary: {
    totalMethods: number;
    successfulMethods: number;
    failedMethods: number;
    criticalIssues: string[];
  };
}> {
  console.log('🔍 Running comprehensive contract diagnostics...');
  
  const [assetDAO, token] = await Promise.all([
    diagnoseAssetDAOContract(provider),
    diagnoseTokenContract(provider)
  ]);

  const allMethods = [...assetDAO.methodResults, ...token.methodResults];
  const successfulMethods = allMethods.filter(m => m.success).length;
  const failedMethods = allMethods.filter(m => !m.success).length;
  
  const criticalIssues: string[] = [];
  
  if (!assetDAO.accessible) {
    criticalIssues.push('AssetDAO contract not accessible');
  }
  
  if (!token.accessible) {
    criticalIssues.push('Governance token contract not accessible');
  }
  
  if (failedMethods > successfulMethods) {
    criticalIssues.push('More methods failing than succeeding - potential network or deployment issues');
  }

  return {
    assetDAO,
    token,
    summary: {
      totalMethods: allMethods.length,
      successfulMethods,
      failedMethods,
      criticalIssues
    }
  };
}
