
/**
 * Proposal Type Debugging Utility
 * 
 * This utility helps debug proposal type mapping issues by analyzing
 * contract data and UI transformations.
 */

import { mapContractTypeToUI } from '@/lib/proposalTypeMapping';

export interface ProposalTypeDebugInfo {
  proposalId: number;
  contractType: any;
  mappedType: string;
  title?: string;
  description?: string;
  issues: string[];
}

export function debugProposalType(proposal: any): ProposalTypeDebugInfo {
  const issues: string[] = [];
  
  // Check for missing or problematic type field
  if (proposal.type === undefined) {
    issues.push('Type field is undefined');
  }
  if (proposal.type === null) {
    issues.push('Type field is null');
  }
  if (typeof proposal.type === 'string' && proposal.type === '') {
    issues.push('Type field is empty string');
  }
  
  // Check for BigInt conversion issues
  if (typeof proposal.type === 'bigint') {
    issues.push('Type field is BigInt - may need conversion');
  }
  
  // Map the type and check result
  const mappedType = mapContractTypeToUI(proposal.type);
  
  // Check if mapping seems incorrect based on title/description
  const titleLower = proposal.title?.toLowerCase() || '';
  const descLower = proposal.description?.toLowerCase() || '';
  
  if (mappedType === 'divest' && 
      (titleLower.includes('invest in') || titleLower.includes('lets invest'))) {
    issues.push('Mapped as divest but title suggests invest');
  }
  
  if (mappedType === 'invest' && 
      (titleLower.includes('divest from') || titleLower.includes('withdraw from'))) {
    issues.push('Mapped as invest but title suggests divest');
  }
  
  return {
    proposalId: proposal.id,
    contractType: proposal.type,
    mappedType,
    title: proposal.title,
    description: proposal.description?.substring(0, 100),
    issues
  };
}

/**
 * Analyze all proposals for type mapping issues
 */
export function analyzeAllProposalTypes(proposals: any[]): {
  totalProposals: number;
  investCount: number;
  divestCount: number;
  issuesFound: number;
  detailedReport: ProposalTypeDebugInfo[];
} {
  const detailedReport = proposals.map(debugProposalType);
  
  const investCount = detailedReport.filter(p => p.mappedType === 'invest').length;
  const divestCount = detailedReport.filter(p => p.mappedType === 'divest').length;
  const issuesFound = detailedReport.filter(p => p.issues.length > 0).length;
  
  console.log('🔍 Proposal Type Analysis Summary:', {
    totalProposals: proposals.length,
    investCount,
    divestCount,
    issuesFound,
    problemProposals: detailedReport.filter(p => p.issues.length > 0)
  });
  
  return {
    totalProposals: proposals.length,
    investCount,
    divestCount,
    issuesFound,
    detailedReport
  };
}

export default { debugProposalType, analyzeAllProposalTypes };
