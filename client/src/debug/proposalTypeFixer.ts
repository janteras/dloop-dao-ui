
/**
 * Proposal Type Fixer
 * 
 * Comprehensive utility to diagnose and fix proposal type mapping issues
 */

import { mapContractTypeToUI } from '@/lib/proposalTypeMapping';

export interface ProposalTypeFixAnalysis {
  proposalId: number;
  originalType: any;
  mappedType: string;
  contentInferredType: string;
  recommendedFix: string;
  confidence: 'high' | 'medium' | 'low';
  issues: string[];
}

export function analyzeAndFixProposalType(proposal: any): ProposalTypeFixAnalysis {
  const issues: string[] = [];
  
  // Analyze the original type
  let originalType = proposal.type;
  if (originalType === undefined || originalType === null) {
    issues.push('Type field is missing or null');
  }
  
  // Map using current logic
  const mappedType = mapContractTypeToUI(originalType, {
    title: proposal.title,
    description: proposal.description
  });
  
  // Infer from content independently
  const contentInferredType = inferFromContentOnly(proposal);
  
  // Check for mismatches
  if (mappedType !== contentInferredType) {
    issues.push(`Type mismatch: mapped as '${mappedType}' but content suggests '${contentInferredType}'`);
  }
  
  // Determine confidence and recommendation
  let confidence: 'high' | 'medium' | 'low' = 'high';
  let recommendedFix = mappedType;
  
  if (issues.length > 0) {
    confidence = 'medium';
    // If there's a mismatch, trust the content analysis more
    if (mappedType !== contentInferredType) {
      recommendedFix = contentInferredType;
      confidence = 'low';
    }
  }
  
  return {
    proposalId: proposal.id,
    originalType,
    mappedType,
    contentInferredType,
    recommendedFix,
    confidence,
    issues
  };
}

function inferFromContentOnly(proposal: any): string {
  const title = (proposal.title || '').toLowerCase();
  const description = (proposal.description || '').toLowerCase();
  
  // Very specific patterns for divest
  const divestIndicators = [
    title.includes('remove') && title.includes('usdc'),
    title.includes('withdraw'),
    title.includes('take profit'),
    title.includes('exit'),
    title.includes('sell'),
    description.includes('remove') && description.includes('from our asset portfolio'),
    description.includes('reducing') && description.includes('position'),
    title.startsWith('remove '),
    title.includes('divest from')
  ];
  
  // Specific patterns for invest
  const investIndicators = [
    title.includes('invest in'),
    title.includes('add') && title.includes('usdc'),
    title.includes('buy'),
    title.includes('allocation to'),
    description.includes('invest') && description.includes('into the dao treasury'),
    description.includes('strengthen') && description.includes('reserves'),
    description.includes('allocation') && description.includes('will strengthen'),
    title.startsWith('invest ')
  ];
  
  const divestCount = divestIndicators.filter(Boolean).length;
  const investCount = investIndicators.filter(Boolean).length;
  
  console.log(`Content Analysis for "${title}":`, {
    divestIndicators: divestCount,
    investIndicators: investCount,
    decision: divestCount > investCount ? 'divest' : 'invest'
  });
  
  return divestCount > investCount ? 'divest' : 'invest';
}

export function fixAllProposals(proposals: any[]): {
  fixed: any[];
  report: ProposalTypeFixAnalysis[];
} {
  const report: ProposalTypeFixAnalysis[] = [];
  const fixed = proposals.map(proposal => {
    const analysis = analyzeAndFixProposalType(proposal);
    report.push(analysis);
    
    // Apply the fix if confidence is medium or higher
    if (analysis.confidence !== 'low' || analysis.issues.length > 0) {
      return {
        ...proposal,
        type: analysis.recommendedFix,
        originalType: proposal.type, // Preserve original for debugging
        _fixApplied: true,
        _fixConfidence: analysis.confidence
      };
    }
    
    return proposal;
  });
  
  return { fixed, report };
}

// Auto-run diagnostics when imported in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).fixProposalTypes = fixAllProposals;
  (window as any).analyzeProposalType = analyzeAndFixProposalType;
  console.log('🔧 Proposal type fixer available: window.fixProposalTypes(proposals)');
}

export default { analyzeAndFixProposalType, fixAllProposals };
