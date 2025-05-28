/**
 * Enhanced Proposal Type System
 * 
 * This file contains a comprehensive type system for proposals with
 * improved validation, type guards, and formatting utilities.
 */

import { z } from 'zod';
import { ethers } from 'ethers';

/**
 * Expanded Proposal Status enum with more granular states
 */
export enum ProposalStatus {
  PENDING = 'pending',     // Just created, not yet active
  ACTIVE = 'active',       // Voting period is active
  PASSED = 'passed',       // Voting period ended, passed but not executed
  FAILED = 'failed',       // Voting period ended, did not pass
  EXECUTED = 'executed',   // Proposal has been executed
  CANCELED = 'canceled',   // Proposal was canceled
  EXPIRED = 'expired'      // Proposal passed but expired before execution
}

/**
 * Expanded Proposal Type enum with additional options
 */
export enum ProposalType {
  INVEST = 'invest',            // Investment proposal
  DIVEST = 'divest',            // Divestment proposal
  GOVERNANCE = 'governance',    // Governance parameter change
  UPGRADE = 'upgrade',          // Protocol upgrade
  TREASURY = 'treasury',        // Treasury management
  EMERGENCY = 'emergency',      // Emergency action
  OTHER = 'other'               // Other proposal type
}

/**
 * Token reference for proposals
 */
export interface TokenReference {
  /**
   * Token contract address
   */
  address: string;

  /**
   * Token symbol (if known)
   */
  symbol?: string;

  /**
   * Token decimals (if known)
   */
  decimals?: number;

  /**
   * Token logo URI (if available)
   */
  logoURI?: string;
}

/**
 * Vote direction
 */
export enum VoteDirection {
  FOR = 'for',
  AGAINST = 'against',
  ABSTAIN = 'abstain'
}

/**
 * Base proposal interface with common properties
 */
export interface BaseProposal {
  /**
   * Unique proposal identifier
   */
  id: string | number;

  /**
   * Proposal title
   */
  title: string;

  /**
   * Detailed proposal description
   */
  description: string;

  /**
   * Address of the proposal creator
   */
  proposer: string;

  /**
   * Timestamp when the proposal was created
   */
  createdAt: number;

  /**
   * Timestamp when the proposal voting period ends
   */
  endTime: number;

  /**
   * Current proposal status
   */
  status: ProposalStatus | string;

  /**
   * Optional metadata for the proposal
   */
  metadata?: Record<string, any>;
}

/**
 * Asset DAO proposal with investment/divestment details
 */
export interface AssetProposal extends BaseProposal {
  /**
   * Type of the proposal
   */
  type: ProposalType | string;

  /**
   * Amount of tokens involved
   */
  amount: string | number;

  /**
   * Token address involved in the proposal
   */
  token: string;

  /**
   * Token details (if resolved)
   */
  tokenDetails?: TokenReference;

  /**
   * Number of votes in favor (mapped from forVotes or yesVotes)
   */
  forVotes: number | string;

  /**
   * Number of votes against (mapped from againstVotes or noVotes)
   */
  againstVotes: number | string;

  /**
   * Whether the proposal has been executed
   */
  executed: boolean;

  /**
   * Whether the proposal has been canceled
   */
  canceled: boolean;

  /**
   * Time remaining until proposal ends (formatted string)
   */
  endsIn: string;

  /**
   * ISO string format for the end time
   */
  endTimeISO?: string;

  /**
   * Whether the current user has voted on this proposal
   */
  hasVoted?: boolean;

  /**
   * User's vote (if hasVoted is true)
   */
  vote?: boolean;
}

/**
 * Protocol DAO proposal interface
 */
export interface ProtocolProposal extends BaseProposal {
  /**
   * Last updated timestamp
   */
  updatedAt: number;

  /**
   * Number of votes in favor
   */
  forVotes: number | string;

  /**
   * Number of votes against
   */
  againstVotes: number | string;

  /**
   * Total vote count
   */
  voteCount: number;

  /**
   * Whether the proposal has been executed
   */
  executed: boolean;

  /**
   * Whether the proposal has been canceled
   */
  canceled: boolean;

  /**
   * End date string
   */
  endsAt: string;

  /**
   * ISO string format for the end time
   */
  endTimeISO?: string;

  /**
   * Detailed proposal attributes
   */
  details: ProtocolProposalDetail[];
}

/**
 * Protocol proposal detail attribute
 */
export interface ProtocolProposalDetail {
  /**
   * Attribute label
   */
  label: string;

  /**
   * Attribute value
   */
  value: string;

  /**
   * Whether the attribute should be highlighted
   */
  isHighlighted?: boolean;
}

/**
 * Parameters for creating a new proposal
 */
export interface CreateProposalParams {
  /**
   * Proposal title
   */
  title: string;

  /**
   * Detailed proposal description
   */
  description: string;

  /**
   * Type of the proposal
   */
  type: ProposalType | string;

  /**
   * Amount of tokens involved (for investment/divestment)
   */
  amount: number | string;

  /**
   * Token address involved in the proposal
   */
  token: string;

  /**
   * Duration of the proposal in seconds
   */
  duration: number;
}

/**
 * Result of a proposal vote operation
 */
export interface VoteResult {
  /**
   * Whether the vote was successful
   */
  success: boolean;

  /**
   * Transaction hash (if successful)
   */
  txHash?: string;

  /**
   * Error message (if unsuccessful)
   */
  error?: string;
}

// Zod schemas for validation

/**
 * Zod schema for validating proposal status
 */
export const proposalStatusSchema = z.nativeEnum(ProposalStatus);

/**
 * Zod schema for validating proposal type
 */
export const proposalTypeSchema = z.nativeEnum(ProposalType);

/**
 * Zod schema for validating token references
 */
export const tokenReferenceSchema = z.object({
  address: z.string().refine(addr => {
    try {
      return ethers.isAddress(addr);
    } catch {
      return false;
    }
  }, { message: 'Invalid token address' }),
  symbol: z.string().optional(),
  decimals: z.number().min(0).max(18).optional(),
  logoURI: z.string().url().optional()
});

/**
 * Zod schema for validating create proposal params
 */
export const createProposalParamsSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(2000),
  type: proposalTypeSchema,
  amount: z.union([
    z.number().positive(),
    z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
      message: 'Amount must be a positive number'
    })
  ]),
  token: z.string().refine(addr => {
    try {
      return ethers.isAddress(addr);
    } catch {
      return false;
    }
  }, { message: 'Invalid token address' }),
  duration: z.number().min(3600).max(2592000) // Between 1 hour and 30 days
});

/**
 * Type guard to check if a value is a valid ProposalStatus
 */
export function isProposalStatus(value: string): value is ProposalStatus {
  return Object.values(ProposalStatus).includes(value as ProposalStatus);
}

/**
 * Type guard to check if a value is a valid ProposalType
 */
export function isProposalType(value: string): value is ProposalType {
  return Object.values(ProposalType).includes(value as ProposalType);
}

/**
 * Safely convert a string to a ProposalStatus enum value
 * @param status String representation of a proposal status
 * @returns The corresponding ProposalStatus enum value or ACTIVE as default
 */
export function toProposalStatus(status: string): ProposalStatus {
  if (isProposalStatus(status)) {
    return status;
  }

  // Legacy mapping
  const legacyMap: Record<string, ProposalStatus> = {
    'active': ProposalStatus.ACTIVE,
    'passed': ProposalStatus.PASSED,
    'failed': ProposalStatus.FAILED,
    'executed': ProposalStatus.EXECUTED,
    'canceled': ProposalStatus.CANCELED,
  };

  return legacyMap[status.toLowerCase()] || ProposalStatus.ACTIVE;
}

/**
 * Safely convert a string to a ProposalType enum value
 * @param type String representation of a proposal type
 * @returns The corresponding ProposalType enum value or OTHER as default
 */
export function toProposalType(type: string): ProposalType {
  if (isProposalType(type)) {
    return type;
  }

  // Legacy mapping
  const legacyMap: Record<string, ProposalType> = {
    'invest': ProposalType.INVEST,
    'divest': ProposalType.DIVEST,
    'governance': ProposalType.GOVERNANCE,
    'upgrade': ProposalType.UPGRADE,
    'treasury': ProposalType.TREASURY,
    'emergency': ProposalType.EMERGENCY,
    'other': ProposalType.OTHER,
  };

  return legacyMap[type.toLowerCase()] || ProposalType.OTHER;
}

/**
 * Format a proposal amount with the correct number of decimals
 * @param amount The amount to format
 * @param decimals The number of decimals for the token
 * @returns Formatted amount string
 */
export function formatProposalAmount(amount: string | number, decimals: number = 18): string {
  try {
    const amountNumber = typeof amount === 'string' ? parseFloat(amount) : amount;
    return amountNumber.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  } catch (error) {
    console.error('Error formatting proposal amount:', error);
    return String(amount);
  }
}