/**
 * Wagmi Configuration for D-Loop UI
 * 
 * This file sets up the wagmi client and configuration for the application.
 * It configures chains, providers, and connectors for Web3 interactions.
 */

import { createConfig, http } from 'wagmi'
import { sepolia } from 'viem/chains'
import { injected, metaMask } from 'wagmi/connectors'

// Get Infura API key from environment - using a module-level variable to avoid repeated warnings
let warnedAboutInfura = false;
const getInfuraApiKey = (): string => {
  let infuraApiKey = import.meta.env.VITE_INFURA_API_KEY;
  
  if (!infuraApiKey) {
    infuraApiKey = 'ca485bd6567e4c5fb5693ee66a5885d8'; // Fallback key
    
    // Only warn once to keep console clean
    if (!warnedAboutInfura) {
      console.warn('Using fallback Infura API key. For production, set VITE_INFURA_API_KEY in your environment.');
      warnedAboutInfura = true;
    }
  }
  
  return infuraApiKey;
};

// Create wagmi config with typesafe configuration
export const config = createConfig({
  chains: [sepolia],
  connectors: [
    metaMask(),
    injected(),
  ],
  transports: {
    [sepolia.id]: http(`https://sepolia.infura.io/v3/${getInfuraApiKey()}`),
  },
});

// Export sepolia chain for use elsewhere in the app
export const SEPOLIA_CHAIN = sepolia;
export const supportedChains = [sepolia];

// Export chain type for convenience
export type { Chain } from 'viem';
