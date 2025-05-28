
<line_number>1</line_number>
/**
 * Proposal Type Validation Utility
 * 
 * This utility helps validate that the proposal type mapping fixes are working correctly
 * across the entire AssetDAO system.
 */

import { mapContractTypeToUI } from '@/lib/proposalTypeMapping';

export interface ValidationResult {
  proposalId: number | string;
  contractType: any;
  mappedType: string;
  contentType: string;
  isCorrect: boolean;
  confidence: 'high' | 'medium' | 'low';
  issues: string[];
}

/**
 * Validates proposal type mapping for a single proposal
 */
export function validateProposalType(proposal: {
  id: number | string;
  type: any;
  title?: string;
  description?: string;
}): ValidationResult {
  const issues: string[] = [];
  
  // Map the contract type
  const mappedType = mapContractTypeToUI(proposal.type, {
    title: proposal.title,
    description: proposal.description
  });
  
  // Determine expected type from content
  const title = (proposal.title || '').toLowerCase();
  const description = (proposal.description || '').toLowerCase();
  
  let expectedType: string;
  if (title.includes('remove') || title.includes('divest') || title.includes('withdraw')) {
    expectedType = 'divest';
  } else if (title.includes('invest') || title.includes('add') || description.includes('treasury')) {
    expectedType = 'invest';
  } else {
    expectedType = 'unknown';
  }
  
  // Check for correctness
  const isCorrect = expectedType === 'unknown' || mappedType === expectedType;
  
  if (!isCorrect) {
    issues.push(`Expected '${expectedType}' but got '${mappedType}'`);
  }
  
  // Determine confidence
  let confidence: 'high' | 'medium' | 'low' = 'high';
  if (expectedType === 'unknown') {
    confidence = 'low';
  } else if (issues.length > 0) {
    confidence = 'medium';
  }
  
  return {
    proposalId: proposal.id,
    contractType: proposal.type,
    mappedType,
    contentType: expectedType,
    isCorrect,
    confidence,
    issues
  };
}

/**
 * Validates all proposals and generates a comprehensive report
 */
export function validateAllProposals(proposals: any[]): {
  summary: {
    total: number;
    correct: number;
    incorrect: number;
    accuracy: number;
  };
  details: ValidationResult[];
  recommendations: string[];
} {
  const results = proposals.map(validateProposalType);
  
  const correct = results.filter(r => r.isCorrect).length;
  const incorrect = results.filter(r => !r.isCorrect).length;
  const accuracy = proposals.length > 0 ? (correct / proposals.length) * 100 : 0;
  
  const recommendations: string[] = [];
  
  if (accuracy < 90) {
    recommendations.push('Proposal type mapping accuracy is below 90%. Review content analysis patterns.');
  }
  
  const highConfidenceErrors = results.filter(r => !r.isCorrect && r.confidence === 'high');
  if (highConfidenceErrors.length > 0) {
    recommendations.push(`${highConfidenceErrors.length} high-confidence mapping errors detected. Review these immediately.`);
  }
  
  return {
    summary: {
      total: proposals.length,
      correct,
      incorrect,
      accuracy: Math.round(accuracy * 100) / 100
    },
    details: results,
    recommendations
  };
}

/**
 * Test the mapping with known test cases
 */
export function runMappingTests(): void {
  console.log('🧪 Running Proposal Type Mapping Tests...');
  
  const testCases = [
    // Numeric contract values
    { input: 0, expected: 'invest', description: 'Investment enum (0)' },
    { input: 1, expected: 'divest', description: 'Divestment enum (1)' },
    { input: '0', expected: 'invest', description: 'Investment string (0)' },
    { input: '1', expected: 'divest', description: 'Divestment string (1)' },
    
    // String values
    { input: 'invest', expected: 'invest', description: 'Direct string invest' },
    { input: 'divest', expected: 'divest', description: 'Direct string divest' },
    { input: 'investment', expected: 'invest', description: 'Investment variant' },
    { input: 'divestment', expected: 'divest', description: 'Divestment variant' },
    
    // Edge cases
    { input: null, expected: 'invest', description: 'Null value' },
    { input: undefined, expected: 'invest', description: 'Undefined value' },
    { input: '', expected: 'invest', description: 'Empty string' },
    
    // With content analysis
    { 
      input: 1, 
      expected: 'divest', 
      description: 'Divest with matching content',
      proposal: { title: 'Remove 1000 USDC', description: 'Remove USDC from our asset portfolio' }
    },
    { 
      input: 0, 
      expected: 'invest', 
      description: 'Invest with matching content',
      proposal: { title: 'Invest in USDC', description: 'Invest into the DAO treasury' }
    },
  ];
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    const result = mapContractTypeToUI(testCase.input as any, testCase.proposal);
    const success = result === testCase.expected;
    
    console.log(
      `${success ? '✅' : '❌'} Test ${index + 1}: ${testCase.description} - ${testCase.input} => ${result} ${success ? '' : `(expected: ${testCase.expected})`}`
    );
    
    if (success) {
      passed++;
    } else {
      failed++;
    }
  });
  
  console.log(`\n📊 Test Results: ${passed}/${testCases.length} passed (${Math.round((passed / testCases.length) * 100)}% success rate)`);
  
  if (failed > 0) {
    console.warn(`⚠️ ${failed} tests failed. Please review the mapping logic.`);
  } else {
    console.log('🎉 All tests passed! Proposal type mapping is working correctly.');
  }
}

// Auto-run tests in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).validateProposalTypes = validateAllProposals;
  (window as any).runProposalTypeMappingTests = runMappingTests;
  console.log('🔧 Proposal type validation available: window.runProposalTypeMappingTests()');
}

export default {
  validateProposalType,
  validateAllProposals,
  runMappingTests
};
