/**
 * AssetDAO Fix Verification Script
 * 
 * This script helps verify that the fixes for the AssetDAO proposal card are working correctly.
 * It provides detailed logging and validation of the data flow from contract to UI.
 */

import { formatEther } from 'ethers/lib/utils';
import { 
  getTokenSymbol, 
  mapContractTypeToUI, 
  formatAmount 
} from '@/utils/proposal-helpers';

/**
 * Test the proposal type mapping functionality
 */
export function testProposalTypeMapping() {
  console.log('🧪 Testing proposal type mapping...');
  
  const testCases = [
    { input: 0, expected: 'invest' },
    { input: 1, expected: 'divest' },
    { input: '0', expected: 'invest' },
    { input: '1', expected: 'divest' },
    { input: 'invest', expected: 'invest' },
    { input: 'divest', expected: 'divest' },
    { input: 'investment', expected: 'invest' },
    { input: 'divestment', expected: 'divest' },
    { input: undefined, expected: 'invest' } // Default case
  ];
  
  for (const testCase of testCases) {
    const result = mapContractTypeToUI(testCase.input as any);
    const success = result === testCase.expected;
    
    console.log(
      `${success ? '✅' : '❌'} Type mapping: ${JSON.stringify(testCase.input)} => ${result} ${success ? '' : `(expected: ${testCase.expected})`}`
    );
  }
  
  console.log('');
}

/**
 * Test the token symbol resolution
 */
export function testTokenSymbolResolution() {
  console.log('🧪 Testing token symbol resolution...');
  
  const testCases = [
    { 
      input: '0x05B366778566e93abfB8e4A9B794e4ad006446b4', 
      expected: 'DLOOP' 
    },
    { 
      input: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', 
      expected: 'USDC' 
    },
    { 
      input: '0xCA063A2AB07491eE991dCecb456D1265f842b568', 
      expected: 'WBTC' 
    },
    { 
      input: '0x0000000000000000000000000000000000000000', 
      expected: 'ETH' 
    },
    { 
      input: '0xUnknownAddress', 
      expected: '0xUnkno...dress' // Shortened version
    },
    { 
      input: '', 
      expected: 'Unknown' 
    }
  ];
  
  for (const testCase of testCases) {
    const result = getTokenSymbol(testCase.input);
    const success = result === testCase.expected;
    
    console.log(
      `${success ? '✅' : '❌'} Token symbol: ${testCase.input} => ${result} ${success ? '' : `(expected: ${testCase.expected})`}`
    );
  }
  
  console.log('');
}

/**
 * Test amount formatting
 */
export function testAmountFormatting() {
  console.log('🧪 Testing amount formatting...');
  
  const testCases = [
    { input: 1000000000000000000n, expected: '1.00' }, // 1 ETH in wei
    { input: '1000000000000000000', expected: '1.00' },
    { input: 1.5, expected: '1.50' },
    { input: '1.5', expected: '1.50' },
    { input: 0, expected: '0.00' },
    { input: undefined, expected: '0.00' },
    { input: '0x38D7EA4C68000', expected: '0.00' }, // Hex string
    { input: { toString: () => '1000000000000000000' }, expected: '1.00' } // Object with toString
  ];
  
  for (const testCase of testCases) {
    const result = formatAmount(testCase.input as any);
    const success = result === testCase.expected;
    
    console.log(
      `${success ? '✅' : '❌'} Amount formatting: ${testCase.input} => ${result} ${success ? '' : `(expected: ${testCase.expected})`}`
    );
  }
  
  console.log('');
}

/**
 * Test simulated contract data mapping
 */
export function testContractDataMapping() {
  console.log('🧪 Testing contract data mapping...');
  
  // Simulate a contract proposal with typical issues
  const mockProposal = {
    id: 1,
    title: 'Test Proposal',
    description: 'This is a test proposal',
    proposer: '0x1234567890123456789012345678901234567890',
    proposalType: 1, // Divest
    token: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC
    amount: '1000000000000000000', // 1 ETH in wei
    forVotes: '500000000000000000', // 0.5 ETH in wei
    againstVotes: '200000000000000000', // 0.2 ETH in wei
    executed: false,
    canceled: false,
    createdAt: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
    votingEnds: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
  };
  
  console.log('📄 Mock proposal data:', mockProposal);
  
  // Try to map this data as our contract service would
  try {
    const formattedAmount = formatAmount(mockProposal.amount);
    const tokenSymbol = getTokenSymbol(mockProposal.token);
    const proposalType = mapContractTypeToUI(mockProposal.proposalType);
    
    console.log('📊 Mapped data:');
    console.log(`- Amount: ${formattedAmount}`);
    console.log(`- Token: ${tokenSymbol}`);
    console.log(`- Type: ${proposalType}`);
    
    console.log('✅ Contract data mapping successful');
  } catch (error) {
    console.error('❌ Contract data mapping failed:', error);
  }
  
  console.log('');
}

/**
 * Run all tests
 */
export function runAllTests() {
  console.log('🔍 Starting AssetDAO Fix Verification Tests');
  console.log('==========================================');
  
  testProposalTypeMapping();
  testTokenSymbolResolution();
  testAmountFormatting();
  testContractDataMapping();
  
  console.log('==========================================');
  console.log('🏁 All tests completed');
}

// Run tests automatically when in development mode
if (process.env.NODE_ENV === 'development') {
  // Don't run immediately, wait for the page to load
  setTimeout(() => {
    console.log('Running AssetDAO fix verification tests...');
    runAllTests();
  }, 2000);
}

export default {
  runAllTests,
  testProposalTypeMapping,
  testTokenSymbolResolution,
  testAmountFormatting,
  testContractDataMapping
};
