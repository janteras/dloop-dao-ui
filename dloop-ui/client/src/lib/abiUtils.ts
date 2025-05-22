/**
 * Utility functions for ABI handling and formatting
 */

/**
 * Ensures an ABI is in the correct format for ethers.js
 * When fetching from Etherscan, the ABI is sometimes nested inside the "abi" property
 * of our standardized format, which causes "abi is not iterable" errors
 * 
 * @param abiData - The ABI data to normalize
 * @returns A properly formatted ABI array
 */
export function normalizeABI(abiData: any): any[] {
  // If it's already an array, return it
  if (Array.isArray(abiData)) {
    return abiData;
  }
  
  // If it's an object with an abi property that's an array, return that
  if (abiData && typeof abiData === 'object' && abiData.abi && Array.isArray(abiData.abi)) {
    return abiData.abi;
  }
  
  // If it's a string, try to parse it as JSON
  if (typeof abiData === 'string') {
    try {
      const parsed = JSON.parse(abiData);
      return normalizeABI(parsed); // Recursively check the parsed result
    } catch (e) {
      console.error('Failed to parse ABI string:', e);
    }
  }
  
  // If we get here, we couldn't normalize the ABI
  console.error('Could not normalize ABI:', abiData);
  throw new Error('Invalid ABI format: must be an array of function/event definitions');
}

/**
 * Validates that an ABI is usable with ethers.js
 * 
 * @param abi - The ABI to validate
 * @returns true if valid, false otherwise
 */
export function isValidABI(abi: any): boolean {
  try {
    // An ABI must be an array
    if (!Array.isArray(abi)) {
      return false;
    }
    
    // Each item should be an object with at least a type property
    return abi.every(item => 
      typeof item === 'object' && 
      item !== null && 
      (
        typeof item.type === 'string' ||
        typeof item.name === 'string' || 
        typeof item.stateMutability === 'string'
      )
    );
  } catch (e) {
    return false;
  }
}
