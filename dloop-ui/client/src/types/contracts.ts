/**
 * @file contracts.ts
 * @description Type definitions for smart contract interactions to ensure type safety
 */

import { ethers } from 'ethers';

/**
 * AssetDAO Proposal Types as defined in the smart contract
 */
export enum AssetDAOProposalType {
  Investment = 0,
  Divestment = 1,
  ParameterChange = 2,
  Other = 3
}

/**
 * AssetDAO Proposal States as defined in the smart contract
 */
export enum AssetDAOProposalState {
  Pending = 0,
  Active = 1,
  Defeated = 2,
  Succeeded = 3,
  Queued = 4,
  Executed = 5,
  Expired = 6
}

/**
 * AssetDAO Asset States as defined in the smart contract
 */
export enum AssetDAOAssetState {
  Active = 0,
  Paused = 1,
  Liquidated = 2
}

/**
 * Base transaction options for contract interactions
 */
export interface TransactionOptions {
  gasLimit?: ethers.BigNumberish;
  gasPrice?: ethers.BigNumberish;
  nonce?: ethers.BigNumberish;
  value?: ethers.BigNumberish;
  blockTag?: ethers.BlockTag;
}

/**
 * Interface for contract transaction responses
 */
export interface ContractTransactionResponse {
  hash: string;
  wait: (confirmations?: number) => Promise<ethers.ContractTransactionReceipt>;
  confirmations: number;
}

/**
 * Interface for AssetDAO proposal data from the contract
 */
export interface AssetDAOProposalData {
  id: ethers.BigNumberish;
  proposalType: ethers.BigNumberish;
  assetAddress: string;
  amount: ethers.BigNumberish;
  description: string;
  proposer: string;
  createdAt: ethers.BigNumberish;
  votingEnds: ethers.BigNumberish;
  yesVotes: ethers.BigNumberish;
  noVotes: ethers.BigNumberish;
  status: ethers.BigNumberish;
  executed: boolean;
}

/**
 * Interface for AssetDAO asset data from the contract
 */
export interface AssetDAOAssetData {
  id: ethers.BigNumberish;
  name: string;
  description: string;
  creator: string;
  createdAt: ethers.BigNumberish;
  state: ethers.BigNumberish;
  totalInvestment: ethers.BigNumberish;
  totalShares: ethers.BigNumberish;
}

/**
 * Interface for creating a proposal
 */
export interface CreateAssetDAOProposalParams {
  proposalType: AssetDAOProposalType;
  assetAddress: string;
  amount: string | number;
  description: string;
  options?: TransactionOptions;
}

/**
 * Interface for voting on a proposal
 */
export interface VoteOnProposalParams {
  proposalId: ethers.BigNumberish;
  support: boolean;
  options?: TransactionOptions;
}

/**
 * Interface for executing a proposal
 */
export interface ExecuteProposalParams {
  proposalId: ethers.BigNumberish;
  options?: TransactionOptions;
}

/**
 * Interface for investing in an asset
 */
export interface InvestParams {
  assetId: ethers.BigNumberish;
  amount: string | number;
  options?: TransactionOptions;
}

/**
 * Interface for divesting from an asset
 */
export interface DivestParams {
  assetId: ethers.BigNumberish;
  shares: string | number;
  options?: TransactionOptions;
}

/**
 * Interface for the AssetDAO contract methods
 */
export interface AssetDAOContract {
  // Read methods
  getProposal(proposalId: ethers.BigNumberish): Promise<AssetDAOProposalData>;
  getProposalCount(): Promise<ethers.BigNumberish>;
  getAssetDetails(assetId: ethers.BigNumberish): Promise<AssetDAOAssetData>;
  getAssetCount(): Promise<ethers.BigNumberish>;
  getAssetState(assetId: ethers.BigNumberish): Promise<ethers.BigNumberish>;
  getInvestorShares(assetId: ethers.BigNumberish, investor: string): Promise<ethers.BigNumberish>;
  hasVoted(proposalId: ethers.BigNumberish, voter: string): Promise<boolean>;
  
  // Write methods
  createProposal(
    proposalType: ethers.BigNumberish,
    assetAddress: string,
    amount: ethers.BigNumberish,
    description: string,
    options?: TransactionOptions
  ): Promise<ContractTransactionResponse>;
  
  vote(
    proposalId: ethers.BigNumberish,
    support: boolean,
    options?: TransactionOptions
  ): Promise<ContractTransactionResponse>;
  
  executeProposal(
    proposalId: ethers.BigNumberish,
    options?: TransactionOptions
  ): Promise<ContractTransactionResponse>;
  
  invest(
    assetId: ethers.BigNumberish,
    amount: ethers.BigNumberish,
    options?: TransactionOptions
  ): Promise<ContractTransactionResponse>;
  
  divest(
    assetId: ethers.BigNumberish,
    shares: ethers.BigNumberish,
    options?: TransactionOptions
  ): Promise<ContractTransactionResponse>;
  
  // Events
  on(
    event: string,
    listener: (...args: any[]) => void
  ): void;
  
  off(
    event: string,
    listener: (...args: any[]) => void
  ): void;
}

/**
 * Interface for the Protocol DAO contract methods
 */
export interface ProtocolDAOContract {
  // Read methods
  getProposalCount(): Promise<ethers.BigNumberish>;
  // Add other required methods here
}

/**
 * Interface for the DLoop Token contract methods
 */
export interface DLoopTokenContract {
  // Read methods
  balanceOf(account: string): Promise<ethers.BigNumberish>;
  allowance(owner: string, spender: string): Promise<ethers.BigNumberish>;
  totalSupply(): Promise<ethers.BigNumberish>;
  
  // Write methods
  approve(
    spender: string,
    amount: ethers.BigNumberish,
    options?: TransactionOptions
  ): Promise<ContractTransactionResponse>;
  
  transfer(
    recipient: string,
    amount: ethers.BigNumberish,
    options?: TransactionOptions
  ): Promise<ContractTransactionResponse>;
}

/**
 * Map of contract names to their interface types
 * Used for type checking when accessing contracts
 */
export interface ContractTypeMap {
  AssetDAO: AssetDAOContract;
  ProtocolDAO: ProtocolDAOContract;
  DLoopToken: DLoopTokenContract;
}
