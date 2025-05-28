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
 * Maps a contract enum value or string to the UI representation
 * @param contractType The proposal type value from any source (contract, API, UI)
 * @param proposal Optional proposal object for title/description analysis
 * @returns The standardized string representation for the UI
 */
export function mapContractTypeToUI(
  contractType: string | number | undefined | null,
  proposal?: { title?: string; description?: string }
): ProposalType {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 Mapping proposal type:`, {
      contractType,
      typeOf: typeof contractType,
      title: proposal?.title,
      description: proposal?.description?.substring(0, 50)
    });
  }

  // Handle null, undefined, or empty values - use content analysis as primary source
  if (contractType === null || contractType === undefined || contractType === '') {
    if (proposal) {
      const inferredType = inferTypeFromContent(proposal);
      if (process.env.NODE_ENV === 'development') {
        console.debug(`🔄 Null/undefined type, inferred from content: ${inferredType}`);
      }
      return inferredType;
    }
    if (process.env.NODE_ENV === 'development') {
      console.debug(`❌ Null/undefined proposal type, defaulting to 'invest'`);
    }
    return 'invest';
  }

  // Convert any input to number for consistent processing
  let typeValue: number;

  if (typeof contractType === 'string') {
    // Check if it's a string representation of a number
    if (!isNaN(Number(contractType))) {
      typeValue = Number(contractType);
    } else {
      // Handle direct string values for UI representations
      const normalizedType = contractType.toLowerCase().trim();

      if (normalizedType === 'invest' || normalizedType === 'investment') {
        return 'invest';
      }
      if (normalizedType === 'divest' || normalizedType === 'divestment') {
        return 'divest';
      }

      // If it's an unrecognized string, fall back to content analysis
      if (proposal) {
        const inferredType = inferTypeFromContent(proposal);
        if (process.env.NODE_ENV === 'development') {
          console.debug(`🔄 Unrecognized string "${contractType}", inferred from content: ${inferredType}`);
        }
        return inferredType;
      }

      if (process.env.NODE_ENV === 'development') {
        console.debug(`❌ Unrecognized string proposal type: "${contractType}", defaulting to 'invest'`);
      }
      return 'invest';
    }
  } else if (typeof contractType === 'bigint') {
    typeValue = Number(contractType);
  } else {
    typeValue = Number(contractType);
  }

  // Check for NaN after conversion
  if (isNaN(typeValue)) {
    if (proposal) {
      const inferredType = inferTypeFromContent(proposal);
      if (process.env.NODE_ENV === 'development') {
        console.debug(`🔄 Invalid type (NaN): ${contractType}, inferred from content: ${inferredType}`);
      }
      return inferredType;
    }

    if (process.env.NODE_ENV === 'development') {
      console.debug(`❌ Invalid proposal type (NaN): ${contractType}, defaulting to 'invest'`);
    }
    return 'invest';
  }

  // Map based on AssetDAO contract enum: Investment = 0, Divestment = 1
  let mappedType: ProposalType;

  switch (typeValue) {
    case 0: // ProposalTypeEnum.Investment
      mappedType = 'invest';
      break;
    case 1: // ProposalTypeEnum.Divestment
      mappedType = 'divest';
      break;
    case 2: // ProposalTypeEnum.ParameterChange
      mappedType = 'invest'; // Map parameter changes to invest for now
      break;
    default:
      // For unknown numeric values, use content analysis if available
      if (proposal) {
        mappedType = inferTypeFromContent(proposal);
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Unknown numeric type: ${contractType} (${typeValue}), using content analysis: ${mappedType}`);
        }
      } else {
        mappedType = 'invest';
        if (process.env.NODE_ENV === 'development') {
          console.warn(`❌ Unknown numeric proposal type: ${contractType} (${typeValue}), defaulting to 'invest'`);
        }
      }
      break;
  }

  // Cross-validate with content analysis to catch any remaining mismatches
  if (proposal) {
    const contentType = inferTypeFromContent(proposal);
    if (contentType !== mappedType) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ Type mismatch detected! Contract says '${mappedType}' but content suggests '${contentType}'. Using content analysis.`);
      }
      // Trust content analysis over contract type in case of mismatch
      return contentType;
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug(`✅ Proposal type mapped: ${contractType} -> '${mappedType}'`);
  }

  return mappedType;
}

/**
 * Infers proposal type from title and description content
 */
function inferTypeFromContent(proposal: { title?: string; description?: string }): ProposalType {
  const title = (proposal.title || '').toLowerCase();
  const description = (proposal.description || '').toLowerCase();
  const combinedText = `${title} ${description}`;

  // Strong divest indicators (more specific patterns first)
  const divestPatterns = [
    /remove\s+\d+\s+(usdc|wbtc|eth|tokens?)/i,
    /withdraw\s+\d+\s+(usdc|wbtc|eth|tokens?)/i,
    /divest\s+from/i,
    /exit\s+position/i,
    /sell\s+\d+\s+(usdc|wbtc|eth|tokens?)/i,
    /liquidate/i,
    /reduce\s+position/i,
    /take\s+profits?/i,
    /remove.*to\s+the\s+dao/i,
    /withdraw.*from.*dao/i
  ];

  // Strong invest indicators
  const investPatterns = [
    /invest\s+in\s+(usdc|wbtc|eth|tokens?)/i,
    /add\s+\d+\s+(usdc|wbtc|eth|tokens?)/i,
    /buy\s+\d+\s+(usdc|wbtc|eth|tokens?)/i,
    /allocation\s+to/i,
    /invest\s+\d+\s+(usdc|wbtc|eth|tokens?)/i,
    /let'?s\s+invest/i,
    /into\s+the\s+dao\s+treasury/i,
    /strengthen.*reserves/i,
    /increase.*position/i
  ];

  // Check for divest patterns first (they tend to be more specific)
  for (const pattern of divestPatterns) {
    if (pattern.test(combinedText)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 Divest pattern matched: ${pattern.source}`);
      }
      return 'divest';
    }
  }

  // Check for invest patterns
  for (const pattern of investPatterns) {
    if (pattern.test(combinedText)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 Invest pattern matched: ${pattern.source}`);
      }
      return 'invest';
    }
  }

  // Fallback: check for simple keywords
  if (title.includes('remove') || title.includes('withdraw') || title.startsWith('remove ')) {
    return 'divest';
  }

  if (title.includes('invest') || title.includes('add') || title.includes('buy')) {
    return 'invest';
  }

  // Default to invest if no clear pattern is found
  if (process.env.NODE_ENV === 'development') {
    console.log(`❓ No clear pattern found, defaulting to 'invest'`);
  }
  return 'invest';
}

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