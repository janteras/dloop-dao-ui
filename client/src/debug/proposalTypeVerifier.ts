
export interface ProposalTypeVerificationResult {
  proposalId: number;
  contractType: number;
  mappedType: 'invest' | 'divest';
  contentAnalysisType: 'invest' | 'divest';
  title: string;
  description: string;
  isCorrect: boolean;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Verifies proposal type mapping by analyzing contract data vs content
 */
export class ProposalTypeVerifier {
  /**
   * Verify a single proposal's type mapping
   */
  static verifyProposal(proposal: any): ProposalTypeVerificationResult {
    const { mapContractTypeToUI } = require('@/lib/proposalTypeMapping');
    
    // Get the raw contract type (should be 0 or 1)
    const contractType = typeof proposal.proposalType === 'number' 
      ? proposal.proposalType 
      : parseInt(proposal.proposalType) || 0;
    
    // Map using our fixed logic
    const mappedType = mapContractTypeToUI(contractType, {
      title: proposal.title || proposal.description?.split('\n')[0] || '',
      description: proposal.description || ''
    });
    
    // Analyze content independently
    const contentAnalysisType = this.analyzeContentType(proposal.title, proposal.description);
    
    // Determine if mapping is correct
    const isCorrect = mappedType === contentAnalysisType;
    
    // Determine confidence level
    const confidence = this.calculateConfidence(proposal.title, proposal.description);
    
    return {
      proposalId: proposal.id,
      contractType,
      mappedType,
      contentAnalysisType,
      title: proposal.title || '',
      description: proposal.description || '',
      isCorrect,
      confidence
    };
  }
  
  /**
   * Analyze content to determine expected type
   */
  private static analyzeContentType(title: string = '', description: string = ''): 'invest' | 'divest' {
    const combinedText = `${title} ${description}`.toLowerCase();
    
    // Strong invest indicators
    if (combinedText.includes('invest') || 
        combinedText.includes('add') || 
        combinedText.includes('allocation') ||
        combinedText.match(/into\s+the\s+dao/)) {
      return 'invest';
    }
    
    // Strong divest indicators
    if (combinedText.includes('remove') || 
        combinedText.includes('divest') || 
        combinedText.includes('withdraw') ||
        combinedText.match(/from\s+the\s+dao/)) {
      return 'divest';
    }
    
    // Default to invest if unclear
    return 'invest';
  }
  
  /**
   * Calculate confidence in content analysis
   */
  private static calculateConfidence(title: string = '', description: string = ''): 'high' | 'medium' | 'low' {
    const combinedText = `${title} ${description}`.toLowerCase();
    
    // High confidence indicators
    const highConfidenceTerms = ['invest', 'divest', 'remove', 'add', 'withdraw'];
    const hasHighConfidenceTerm = highConfidenceTerms.some(term => combinedText.includes(term));
    
    if (hasHighConfidenceTerm && combinedText.length > 20) {
      return 'high';
    }
    
    if (hasHighConfidenceTerm) {
      return 'medium';
    }
    
    return 'low';
  }
  
  /**
   * Verify all proposals and generate a report
   */
  static verifyAllProposals(proposals: any[]): ProposalTypeVerificationResult[] {
    return proposals.map(proposal => this.verifyProposal(proposal));
  }
  
  /**
   * Generate a summary report
   */
  static generateSummaryReport(results: ProposalTypeVerificationResult[]) {
    const total = results.length;
    const correct = results.filter(r => r.isCorrect).length;
    const incorrect = total - correct;
    const highConfidence = results.filter(r => r.confidence === 'high').length;
    
    console.log(`
📊 PROPOSAL TYPE VERIFICATION REPORT
====================================
Total Proposals: ${total}
Correctly Mapped: ${correct} (${((correct/total) * 100).toFixed(1)}%)
Incorrectly Mapped: ${incorrect} (${((incorrect/total) * 100).toFixed(1)}%)
High Confidence: ${highConfidence} (${((highConfidence/total) * 100).toFixed(1)}%)

${incorrect > 0 ? '❌ INCORRECT MAPPINGS FOUND:' : '✅ ALL MAPPINGS CORRECT!'}
${results.filter(r => !r.isCorrect).map(r => 
  `- Proposal #${r.proposalId}: Contract=${r.contractType} → Mapped=${r.mappedType}, Expected=${r.contentAnalysisType}`
).join('\n')}
    `);
    
    return {
      total,
      correct,
      incorrect,
      accuracy: (correct / total) * 100,
      highConfidence
    };
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).verifyProposalTypes = (proposals: any[]) => {
    const results = ProposalTypeVerifier.verifyAllProposals(proposals);
    return ProposalTypeVerifier.generateSummaryReport(results);
  };
  
  (window as any).verifyProposal = (proposal: any) => {
    return ProposalTypeVerifier.verifyProposal(proposal);
  };
  
  console.log('🔧 Proposal type verifier available: window.verifyProposalTypes(proposals) and window.verifyProposal(proposal)');
}
