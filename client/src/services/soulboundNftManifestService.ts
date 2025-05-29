import { ethers } from 'ethers';

/**
 * Represents the SoulboundNFT manifest data structure
 */
export interface SoulboundNFTManifest {
  address: string;
  args: [string, string, string, number[]]; // [name, symbol, baseUri, tokenIds]
}

/**
 * Represents a structured token with metadata
 */
export interface StructuredToken {
  id: number;
  uri: string;
  owner?: string;
  metadata?: any;
}

/**
 * Service to handle SoulboundNFT manifest fetching and processing
 */
export class SoulboundNftManifestService {
  private manifest: SoulboundNFTManifest | null = null;
  private tokens: StructuredToken[] = [];
  private contractAbi = [
    "function ownerOf(uint256 tokenId) external view returns (address)",
    "function tokenURI(uint256 tokenId) external view returns (string)",
    "function isTokenValid(uint256 tokenId) external view returns (bool)"
  ];
  
  // Development mode detection
  private isDevelopmentMode = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';

  /**
   * Fetch the SoulboundNFT manifest
   * @returns Promise resolving to the manifest data
   */
  async fetchManifest(): Promise<SoulboundNFTManifest> {
    // If we have cached manifest, return it
    if (this.manifest) {
      return this.manifest;
    }
    
    try {
      // In development mode, use silent fetch or fallback
      if (this.isDevelopmentMode) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second timeout
          
          const response = await fetch('https://d-loop.io/identity/identity.json', {
            signal: controller.signal,
            mode: 'cors',
            cache: 'no-store'
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch manifest: ${response.status}`);
          }
          
          const data = await response.json();
          // Use type assertion to ensure correct typing
          const manifest = data.SoulboundNFT as SoulboundNFTManifest;
          this.manifest = manifest;
          return manifest;
        } catch (corsError) {
          // In development mode, silently use fallback data without console errors
          console.log('Development mode - Using fallback SoulboundNFT manifest');
        
        // In development, we can still show a user-friendly message
        if (process.env.NODE_ENV === 'development') {
          console.warn('NFT metadata unavailable due to CORS. Using mock data for development.');
        }
          return this.getFallbackManifest();
        }
      } else {
        // In production, attempt normal fetch
        const response = await fetch('https://d-loop.io/identity/identity.json', {
          cache: 'no-store',
          mode: 'cors'
        });

        if (response.ok) {
          const data = await response.json();
          // Use type assertion to ensure correct typing
          const manifest = data.SoulboundNFT as SoulboundNFTManifest;
          this.manifest = manifest;
          return manifest;
        } else {
          throw new Error(`Failed to fetch manifest: ${response.status}`);
        }
      }
    } catch (error) {
      // Only log the error in production mode
      if (!this.isDevelopmentMode) {
        console.error('Error fetching SoulboundNFT manifest:', error);
      }
      
      return this.getFallbackManifest();
    }
  }
  
  /**
   * Get a fallback manifest for development or error recovery
   * @returns A fallback SoulboundNFT manifest
   */
  private getFallbackManifest(): SoulboundNFTManifest {
    const fallbackManifest: SoulboundNFTManifest = {
      address: '0x6391C14631b2Be5374297fA3110687b80233104c',
      args: [
        'DLoop Identity Token',
        'DLOOP-ID',
        'https://d-loop.io/identity/',
        Array.from({ length: 10 }, (_, i) => i + 1) // Token IDs 1-10
      ]
    };
    
    this.manifest = fallbackManifest;
    return fallbackManifest;
  }

  /**
   * Gets token data for all tokens in the manifest
   * @param provider Ethers provider for on-chain data
   */
  async getAllTokens(provider?: ethers.BrowserProvider): Promise<StructuredToken[]> {
    if (!this.manifest) {
      await this.fetchManifest();
    }

    // Non-null assertion operator to satisfy TypeScript - we know manifest exists here
    const [name, symbol, baseUri, ids] = this.manifest!.args;
    const contractAddress = this.manifest!.address;
    const tokens: StructuredToken[] = [];

    // Create read-only contract instance if provider available
    const contract = provider ? 
      new ethers.Contract(contractAddress, this.contractAbi, provider) :
      null;

    // Process each token ID
    for (const id of ids) {
      const tokenUri = `${baseUri}${id}.json`;
      const token: StructuredToken = { id, uri: tokenUri };

      // Try to get on-chain data if provider is available
      if (contract) {
        try {
          // Get token owner
          token.owner = await contract.ownerOf(id);
        } catch (error) {
          console.warn(`Could not fetch owner for token ${id}:`, error);
        }
      }

      // Try to fetch metadata
      try {
        // In development mode, use silent fetch with timeout
        if (this.isDevelopmentMode) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1000); // 1-second timeout
            
            const response = await fetch(tokenUri, { 
              signal: controller.signal,
              mode: 'cors' 
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
              token.metadata = await response.json();
            } else {
              throw new Error(`Error status: ${response.status}`);
            }
          } catch (corsError) {
            // Silently use fallback in development mode
            token.metadata = this.getFallbackMetadata(id);
          }
        } else {
          // In production, log errors
          const response = await fetch(tokenUri, { mode: 'cors' });
          if (response.ok) {
            token.metadata = await response.json();
          } else {
            throw new Error(`Error fetching metadata: ${response.status}`);
          }
        }
      } catch (error) {
        // Only log in production mode
        if (!this.isDevelopmentMode) {
          console.warn(`CORS or fetch error for token ${id}, using fallback metadata`);
        }
        token.metadata = this.getFallbackMetadata(id);
      }

      tokens.push(token);
    }

    this.tokens = tokens;
    return tokens;
  }

  /**
   * Gets a specific token by ID
   * @param id Token ID
   * @param provider Optional ethers provider
   */
  async getTokenById(id: number, provider?: ethers.BrowserProvider): Promise<StructuredToken | null> {
    if (!this.manifest) {
      await this.fetchManifest();
    }

    const [name, symbol, baseUri, ids] = this.manifest!.args;
    
    // Check if token ID is valid
    if (!ids.includes(id)) {
      return null;
    }

    const tokenUri = `${baseUri}${id}.json`;
    const token: StructuredToken = { id, uri: tokenUri };

    // Try to get on-chain data if provider is available
    if (provider) {
      try {
        const contract = new ethers.Contract(
          this.manifest!.address,
          this.contractAbi,
          provider
        );
        token.owner = await contract.ownerOf(id);
      } catch (error) {
        console.warn(`Could not fetch owner for token ${id}:`, error);
      }
    }

    // Try to fetch metadata
    try {
      const response = await fetch(tokenUri);
      if (response.ok) {
        token.metadata = await response.json();
      } else {
        throw new Error(`Failed to fetch metadata: ${response.status}`);
      }
    } catch (error) {
      // Use fallback metadata
      token.metadata = this.getFallbackMetadata(id);
    }

    return token;
  }

  /**
   * Generates fallback metadata for a token
   * @param id Token ID
   */
  private getFallbackMetadata(id: number): any {
    // Generate fallback name based on ID
    const nodeName = `AI.Gov#${id.toString().padStart(2, '0')}`;
    
    // Generate a deterministic address from the ID
    const addressPrefix = '0x';
    const addressSuffix = id.toString(16).padStart(4, '0');
    const addressMiddle = '1234567890123456789012345678901234'.slice(0, 40 - addressPrefix.length - addressSuffix.length);
    const address = addressPrefix + addressMiddle + addressSuffix;
    
    // Generate a description
    const descriptions = [
      'State-of-the-art AI governance node, trained on extensive financial and governance datasets.',
      'Specialized AI node focused on long-term value creation through balanced governance participation.',
      'Autonomous AI governance agent designed to represent community consensus in DeFi protocols.',
      'Advanced machine learning system aligned with decentralized governance principles.',
      'Transparent AI governance node with verifiable on-chain voting record and accountability.'
    ];
    
    const strategyTypes = [
      'Conservative Balanced',
      'Moderate Growth',
      'Aggressive Growth',
      'Value Protection',
      'Innovation Focus'
    ];
    
    // Use the ID to select from arrays (with wrapping)
    const description = descriptions[id % descriptions.length];
    const strategy = strategyTypes[id % strategyTypes.length];
    
    return {
      name: nodeName,
      description,
      image: `https://example.com/ai-node-${id}.png`,
      attributes: [
        { trait_type: 'Node ID', value: `node-${id}` },
        { trait_type: 'Type', value: 'Governance' },
        { trait_type: 'Strategy', value: strategy },
        { trait_type: 'Address', value: address }
      ]
    };
  }
}

// Export singleton instance
export const soulboundNftManifestService = new SoulboundNftManifestService();
