/**
 * Utility functions for mapping between smart contract proposal types and UI representation
 */

import { ProposalType } from "@/types";

/**
 * Enum representing the proposal types as defined in the smart contract
 */
export const ProposalTypeEnum = {
  Investment: 0,
  Divestment: 1,
  ParameterChange: 2,
  Other: 3
};

/**
 * Maps a contract enum value to the UI representation
 * @param contractType The numeric enum value from the contract
 * @returns The string representation for the UI
 */
export const mapContractTypeToUI = (contractType: number | bigint | undefined): ProposalType => {
  // Handle undefined, null, NaN values, or invalid numbers
  if (contractType === undefined || contractType === null || 
      Number.isNaN(Number(contractType))) {
    // Only log this warning in development to avoid console spam in production
    if (process.env.NODE_ENV !== 'production') {
      console.info(`Proposal type is undefined or invalid, defaulting to 'invest'`);
    }
    return 'invest';
  }
  
  // Convert BigInt to number for proper comparison
  const typeValue = typeof contractType === 'bigint' ? Number(contractType) : Number(contractType);
  
  // Additional check for NaN after conversion
  if (isNaN(typeValue)) {
    console.warn(`Invalid proposal type (NaN), defaulting to 'invest'`);
    return 'invest';
  }
  
  console.debug(`Processing proposal type: ${contractType} (${typeof contractType}), converted to: ${typeValue}`);
  
  // Handle the specific proposal types
  if (typeValue === 0) {
    return 'invest';
  } else if (typeValue === 1) {
    console.debug('✅ Successfully identified a divestment proposal');
    return 'divest';
  } else {
    console.warn(`Unmapped proposal type: ${contractType}, defaulting to 'invest'`);
    return 'invest'; // Default safely to 'invest'
  }
};

/**
 * Maps a UI proposal type to the contract enum value
 * @param uiType The UI string representation
 * @returns The numeric enum value for the contract
 */
export const mapUITypeToContract = (uiType: ProposalType): number => {
  switch (uiType) {
    case 'invest':
      return ProposalTypeEnum.Investment;
    case 'divest':
      return ProposalTypeEnum.Divestment;
    default:
      console.warn(`Unmapped UI type: ${uiType}, defaulting to Investment (0)`);
      return ProposalTypeEnum.Investment; // Default safely
  }
};
