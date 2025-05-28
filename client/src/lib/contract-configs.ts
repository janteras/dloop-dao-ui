/**
 * Contract Configurations for wagmi v2
 * 
 * Centralized configuration for all smart contracts used in the application
 */

import { sepolia } from 'viem/chains';

// DAOASSET contract address on Sepolia testnet
export const ASSETDAO_CONTRACT_ADDRESS = '0x8dde1922d5f772890f169714faceef9551791caf';

// AssetDAO ABI for contract interactions in proper JSON format for wagmi v2
export const assetDaoAbi = [
  // Proposal getter methods
  {
    name: 'getProposal',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'proposer', type: 'address' },
        { name: 'description', type: 'string' },
        { name: 'proposalType', type: 'uint8' },
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'forVotes', type: 'uint256' },
        { name: 'againstVotes', type: 'uint256' },
        { name: 'executed', type: 'bool' },
        { name: 'canceled', type: 'bool' },
        { name: 'startBlock', type: 'uint256' },
        { name: 'endBlock', type: 'uint256' }
      ]
    }]
  },
  {
    name: 'getProposalCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'getProposalsInRange',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'start', type: 'uint256' },
      { name: 'end', type: 'uint256' }
    ],
    outputs: [{
      type: 'tuple[]',
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'proposer', type: 'address' },
        { name: 'description', type: 'string' },
        { name: 'proposalType', type: 'uint8' },
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'forVotes', type: 'uint256' },
        { name: 'againstVotes', type: 'uint256' },
        { name: 'executed', type: 'bool' },
        { name: 'canceled', type: 'bool' },
        { name: 'startBlock', type: 'uint256' },
        { name: 'endBlock', type: 'uint256' }
      ]
    }]
  },
  {
    name: 'state',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [{ type: 'uint8' }]
  },
  {
    name: 'hasVoted',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'voter', type: 'address' }
    ],
    outputs: [{ type: 'bool' }]
  },
  
  // Proposal action methods
  {
    name: 'propose',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'description', type: 'string' },
      { name: 'proposalType', type: 'uint8' }
    ],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'castVote',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proposalId', type: 'uint256' },
      { name: 'support', type: 'bool' }
    ],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'execute',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'cancel',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [{ type: 'bool' }]
  },
  
  // Governance methods
  {
    name: 'quorum',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'votingPeriod',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'votingDelay',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  }
] as const;

// ERC20 Token ABI for standard token operations in proper JSON format for wagmi v2
export const erc20Abi = [
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }]
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }]
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'transferFrom',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    type: 'event',
    name: 'Transfer',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'Approval',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ],
    anonymous: false
  }
] as const;

// AssetDAO contract configuration for wagmi v2
export const assetDaoContract = {
  address: ASSETDAO_CONTRACT_ADDRESS as `0x${string}`,
  abi: assetDaoAbi,
  chainId: sepolia.id,
};

// Helper function to get ERC20 contract configuration
export function getErc20Contract(tokenAddress: string) {
  return {
    address: tokenAddress as `0x${string}`,
    abi: erc20Abi,
    chainId: sepolia.id,
  };
}
