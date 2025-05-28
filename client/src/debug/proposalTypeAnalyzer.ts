
/**
 * Proposal Type Analyzer
 * 
 * This utility provides comprehensive analysis of proposal type mapping issues
 * to help identify why all proposals might be showing as "Divest"
 */

import { mapContractTypeToUI } from '@/lib/proposalTypeMapping';

export interface ProposalTypeAnalysis {
  proposalId: number;
  rawType: any;
  typeOf: string;
  mappedType: string;
  title: string;
  titleAnalysis: {
    hasInvestKeywords: boolean;
    hasDivestKeywords: boolean;
    keywords: string[];
  };
  issues: string[];
  confidence: 'high' | 'medium' | 'low';
}

export function analyzeProposalType(proposal: any): ProposalTypeAnalysis {
  const issues: string[] = [];
  const titleLower = (proposal.title || '').toLowerCase();
  const descLower = (proposal.description || '').toLowerCase();
  
  // Analyze title for keywords
  const investKeywords = ['invest in', 'investment', 'lets invest', "let's invest", 'allocation to'];
  const divestKeywords = ['divest from', 'divest', 'withdraw from', 'remove from', 'exit'];
  
  const hasInvestKeywords = investKeywords.some(keyword => 
    titleLower.includes(keyword) || descLower.includes(keyword)
  );
  const hasDivestKeywords = divestKeywords.some(keyword => 
    titleLower.includes(keyword) || descLower.includes(keyword)
  );
  
  const foundKeywords = [
    ...investKeywords.filter(keyword => titleLower.includes(keyword) || descLower.includes(keyword)),
    ...divestKeywords.filter(keyword => titleLower.includes(keyword) || descLower.includes(keyword))
  ];
  
  // Check for type field issues
  if (proposal.type === undefined) {
    issues.push('Type field is undefined');
  }
  if (proposal.type === null) {
    issues.push('Type field is null');
  }
  if (typeof proposal.type === 'string' && proposal.type === '') {
    issues.push('Type field is empty string');
  }
  
  // Map the type
  const mappedType = mapContractTypeToUI(proposal.type);
  
  // Check for mapping conflicts
  if (mappedType === 'divest' && hasInvestKeywords && !hasDivestKeywords) {
    issues.push('Mapped as divest but title/description suggests invest');
  }
  if (mappedType === 'invest' && hasDivestKeywords && !hasInvestKeywords) {
    issues.push('Mapped as invest but title/description suggests divest');
  }
  
  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'high';
  if (issues.length > 0) {
    confidence = issues.length > 2 ? 'low' : 'medium';
  }
  
  return {
    proposalId: proposal.id,
    rawType: proposal.type,
    typeOf: typeof proposal.type,
    mappedType,
    title: proposal.title || 'No title',
    titleAnalysis: {
      hasInvestKeywords,
      hasDivestKeywords,
      keywords: foundKeywords
    },
    issues,
    confidence
  };
}

export function analyzeAllProposals(proposals: any[]): {
  totalAnalyzed: number;
  investCount: number;
  divestCount: number;
  issuesFound: number;
  highConfidenceCorrect: number;
  suspiciousProposals: ProposalTypeAnalysis[];
  summary: string;
} {
  const analyses = proposals.map(analyzeProposalType);
  
  const investCount = analyses.filter(a => a.mappedType === 'invest').length;
  const divestCount = analyses.filter(a => a.mappedType === 'divest').length;
  const issuesFound = analyses.filter(a => a.issues.length > 0).length;
  const highConfidenceCorrect = analyses.filter(a => a.confidence === 'high' && a.issues.length === 0).length;
  const suspiciousProposals = analyses.filter(a => a.issues.length > 0 || a.confidence === 'low');
  
  // Generate summary
  const summary = `
📊 PROPOSAL TYPE ANALYSIS SUMMARY
=================================
Total Proposals: ${proposals.length}
Invest: ${investCount} (${Math.round(investCount/proposals.length*100)}%)
Divest: ${divestCount} (${Math.round(divestCount/proposals.length*100)}%)
Issues Found: ${issuesFound}
High Confidence: ${highConfidenceCorrect}
Suspicious: ${suspiciousProposals.length}

${suspiciousProposals.length > 0 ? '⚠️ ISSUES DETECTED - Check suspicious proposals below' : '✅ All proposals appear correctly mapped'}
  `;

  console.log(summary);
  
  if (suspiciousProposals.length > 0) {
    console.group('🚨 Suspicious Proposals');
    suspiciousProposals.forEach(analysis => {
      console.log(`Proposal #${analysis.proposalId}:`, analysis);
    });
    console.groupEnd();
  }
  
  return {
    totalAnalyzed: proposals.length,
    investCount,
    divestCount,
    issuesFound,
    highConfidenceCorrect,
    suspiciousProposals,
    summary
  };
}

// Auto-run analysis when imported in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).analyzeProposalTypes = analyzeAllProposals;
  (window as any).analyzeProposal = analyzeProposalType;
  console.log('🔧 Proposal type analysis tools available on window.analyzeProposalTypes() and window.analyzeProposal()');
}

export default { analyzeProposalType, analyzeAllProposals };
