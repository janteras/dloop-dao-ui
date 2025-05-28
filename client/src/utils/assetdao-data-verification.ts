
/**
 * AssetDAO Data Verification Utility
 * 
 * This utility helps verify data consistency between different sources
 * and identify potential mock data contamination issues.
 */

import { ethers } from 'ethers';
import { getContract } from '@/lib/contracts';

export interface DataSourceComparison {
  source: 'contract' | 'api' | 'cache';
  proposalCount: number;
  sampleProposal?: any;
  timestamp: number;
  error?: string;
}

export interface VerificationReport {
  timestamp: number;
  sources: DataSourceComparison[];
  discrepancies: string[];
  recommendations: string[];
  mockDataDetected: boolean;
}

/**
 * Verifies proposal data across different sources
 */
export async function verifyProposalDataSources(
  provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Promise<VerificationReport> {
  const report: VerificationReport = {
    timestamp: Date.now(),
    sources: [],
    discrepancies: [],
    recommendations: [],
    mockDataDetected: false
  };

  try {
    // 1. Verify contract data
    const contractData = await verifyContractData(provider);
    report.sources.push(contractData);

    // 2. Verify API data
    const apiData = await verifyApiData();
    report.sources.push(apiData);

    // 3. Compare data sources
    const analysis = analyzeDataConsistency(report.sources);
    report.discrepancies = analysis.discrepancies;
    report.recommendations = analysis.recommendations;
    report.mockDataDetected = analysis.mockDataDetected;

  } catch (error: any) {
    report.discrepancies.push(`Verification failed: ${error.message}`);
  }

  return report;
}

async function verifyContractData(
  provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner
): Promise<DataSourceComparison> {
  try {
    const assetDAO = getContract('AssetDAO', provider);
    
    // Get proposal count directly from contract
    const proposalCount = await assetDAO.getProposalCount();
    const count = Number(proposalCount);

    // Get a sample proposal if any exist
    let sampleProposal;
    if (count > 0) {
      const proposalId = Math.min(count - 1, 0); // Get the first or last proposal
      sampleProposal = await assetDAO.getProposal(proposalId);
    }

    return {
      source: 'contract',
      proposalCount: count,
      sampleProposal: sampleProposal ? {
        id: proposalId,
        proposer: sampleProposal.proposer,
        forVotes: sampleProposal.forVotes?.toString(),
        againstVotes: sampleProposal.againstVotes?.toString(),
        state: Number(sampleProposal.state || sampleProposal.status || 0)
      } : undefined,
      timestamp: Date.now()
    };
  } catch (error: any) {
    return {
      source: 'contract',
      proposalCount: 0,
      timestamp: Date.now(),
      error: error.message
    };
  }
}

async function verifyApiData(): Promise<DataSourceComparison> {
  try {
    // Check protocol proposals API
    const response = await fetch('/api/protocol-proposals');
    const data = await response.json();
    
    return {
      source: 'api',
      proposalCount: data.proposals?.length || data.total || 0,
      sampleProposal: data.proposals?.[0],
      timestamp: Date.now()
    };
  } catch (error: any) {
    return {
      source: 'api',
      proposalCount: 0,
      timestamp: Date.now(),
      error: error.message
    };
  }
}

function analyzeDataConsistency(sources: DataSourceComparison[]): {
  discrepancies: string[];
  recommendations: string[];
  mockDataDetected: boolean;
} {
  const discrepancies: string[] = [];
  const recommendations: string[] = [];
  let mockDataDetected = false;

  const contractSource = sources.find(s => s.source === 'contract');
  const apiSource = sources.find(s => s.source === 'api');

  // Check for proposal count discrepancies
  if (contractSource && apiSource) {
    if (contractSource.proposalCount !== apiSource.proposalCount) {
      discrepancies.push(
        `Proposal count mismatch: Contract (${contractSource.proposalCount}) vs API (${apiSource.proposalCount})`
      );
      recommendations.push('Verify API is fetching from correct contract address');
    }
  }

  // Check for mock data indicators
  if (apiSource?.sampleProposal) {
    const proposal = apiSource.sampleProposal;
    
    // Look for common mock data patterns
    if (
      proposal.title?.includes('Mock') ||
      proposal.description?.includes('mock') ||
      proposal.proposer === '0x0000000000000000000000000000000000000000' ||
      (proposal.id && proposal.id > 1000) // Unusually high ID for testnet
    ) {
      mockDataDetected = true;
      discrepancies.push('Mock data detected in API responses');
      recommendations.push('Remove mock data from production API responses');
    }
  }

  // Check for error conditions
  sources.forEach(source => {
    if (source.error) {
      discrepancies.push(`${source.source} error: ${source.error}`);
      if (source.source === 'contract') {
        recommendations.push('Verify contract address and network configuration');
      }
    }
  });

  return { discrepancies, recommendations, mockDataDetected };
}

/**
 * Compares on-chain vote data with UI display
 */
export async function verifyVoteData(
  provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner,
  proposalId: number,
  displayedForVotes: number,
  displayedAgainstVotes: number
): Promise<{
  consistent: boolean;
  onChainFor: string;
  onChainAgainst: string;
  discrepancy?: string;
}> {
  try {
    const assetDAO = getContract('AssetDAO', provider);
    const proposal = await assetDAO.getProposal(proposalId);
    
    const onChainFor = ethers.formatEther(proposal.forVotes || proposal.yesVotes || 0);
    const onChainAgainst = ethers.formatEther(proposal.againstVotes || proposal.noVotes || 0);
    
    const onChainForNum = parseFloat(onChainFor);
    const onChainAgainstNum = parseFloat(onChainAgainst);
    
    // Allow for small floating point differences
    const tolerance = 0.000001;
    const forMatch = Math.abs(onChainForNum - displayedForVotes) < tolerance;
    const againstMatch = Math.abs(onChainAgainstNum - displayedAgainstVotes) < tolerance;
    
    const consistent = forMatch && againstMatch;
    
    return {
      consistent,
      onChainFor,
      onChainAgainst,
      discrepancy: consistent ? undefined : 
        `UI shows ${displayedForVotes}/${displayedAgainstVotes}, on-chain shows ${onChainFor}/${onChainAgainst}`
    };
  } catch (error: any) {
    return {
      consistent: false,
      onChainFor: '0',
      onChainAgainst: '0',
      discrepancy: `Failed to fetch on-chain data: ${error.message}`
    };
  }
}
