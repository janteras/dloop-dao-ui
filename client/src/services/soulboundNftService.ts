import { ethers } from 'ethers';
import { getContract, getReadOnlyContract } from '@/lib/contracts';
import { ADDRESSES } from '@/config/contracts';

export interface TokenDetails {
  id: number;
  owner: string;
  uri: string;
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
    [key: string]: any;
  };
  mintedAt: number;
  revoked: boolean;
  valid: boolean;
}

class SoulboundNFTService {
  /**
   * Fetches a specific token by ID
   * @param tokenId The ID of the token to fetch
   * @param provider The ethers provider
   */
  async getTokenById(
    tokenId: number,
    provider: ethers.JsonRpcProvider | ethers.BrowserProvider | null
  ): Promise<TokenDetails | null> {
    try {
      if (!provider) {
        throw new Error('Provider is required');
      }

      const contract = getReadOnlyContract('SoulboundNFT', provider);
      const details = await contract.getTokenDetails(tokenId);
      const isValid = await contract.isTokenValid(tokenId);

      // Basic token details
      const token: TokenDetails = {
        id: tokenId,
        owner: details.tokenOwner,
        uri: details.uri,
        mintedAt: Number(details.mintedAt),
        revoked: details.revoked,
        valid: isValid
      };

      // Fetch and parse the metadata
      try {
        // Use a proxy approach or direct fetch with no-cors mode
        try {
          const response = await fetch(details.uri, { mode: 'cors' });
          if (response.ok) {
            token.metadata = await response.json();
          } else {
            throw new Error(`Failed to fetch metadata: ${response.status}`);
          }
        } catch (fetchError) {
          console.warn(`CORS error fetching metadata, using fallback for token ${tokenId}`);
          // Provide fallback metadata when external fetch fails due to CORS
          token.metadata = this.getFallbackMetadata(tokenId);
        }
      } catch (error) {
        console.error(`Error processing metadata for token ${tokenId}:`, error);
        // Still provide fallback metadata on any error
        token.metadata = this.getFallbackMetadata(tokenId);
      }

      return token;
    } catch (error) {
      console.error(`Error fetching token ${tokenId}:`, error);
      return null;
    }
  }

  /**
   * Creates fallback metadata when external fetch fails
   * @param tokenId The token ID to create fallback metadata for
   * @returns Fallback metadata object
   */
  private getFallbackMetadata(tokenId: number): any {
    return {
      name: `AI Node NFT #${tokenId}`,
      description: "This AI Node NFT represents ownership of an AI governance node in the DLoop ecosystem.",
      image: `/nft-fallback-${(tokenId % 5) + 1}.png`, // Use local fallback images
      attributes: [
        {
          trait_type: "Generation",
          value: "Genesis"
        },
        {
          trait_type: "Type",
          value: "Governance"
        },
        {
          trait_type: "Node ID",
          value: `node-${tokenId}`
        },
        {
          trait_type: "Rarity",
          value: tokenId <= 3 ? "Legendary" : tokenId <= 7 ? "Rare" : "Common"
        }
      ]
    };
  }

  /**
   * Fetches tokens owned by a specific address
   * @param ownerAddress The address of the tokens' owner
   * @param provider The ethers provider
   */
  async getTokensByOwner(
    ownerAddress: string,
    provider: ethers.JsonRpcProvider | ethers.BrowserProvider | null
  ): Promise<TokenDetails[]> {
    try {
      if (!provider) {
        throw new Error('Provider is required');
      }

      const contract = getReadOnlyContract('SoulboundNFT', provider);
      const tokenIds = await contract.getTokensByOwner(ownerAddress);
      
      // Fetch details for each token
      const tokens: TokenDetails[] = [];
      for (const id of tokenIds) {
        const token = await this.getTokenById(Number(id), provider);
        if (token) {
          tokens.push(token);
        }
      }

      return tokens;
    } catch (error) {
      console.error(`Error fetching tokens for owner ${ownerAddress}:`, error);
      return [];
    }
  }

  /**
   * Retrieves all the 10 minted AI Node NFTs
   * @param provider The ethers provider
   */
  async getAllAINodeNFTs(
    provider: ethers.JsonRpcProvider | ethers.BrowserProvider | null
  ): Promise<TokenDetails[]> {
    try {
      if (!provider) {
        throw new Error('Provider is required');
      }
      
      // The known owner of all 10 NFTs
      const ownerAddress = '0x3639D1F746A977775522221f53D0B1eA5749b8b9';
      
      // Alternatively, we could loop through tokens 1-10 directly
      const tokens: TokenDetails[] = [];
      for (let i = 1; i <= 10; i++) {
        const token = await this.getTokenById(i, provider);
        if (token) {
          tokens.push(token);
        }
      }
      
      return tokens;
    } catch (error) {
      console.error('Error fetching all AI Node NFTs:', error);
      return [];
    }
  }

  /**
   * Checks if a specific address has a valid Soulbound NFT
   * @param address The address to check
   * @param provider The ethers provider
   */
  async hasValidToken(
    address: string,
    provider: ethers.JsonRpcProvider | ethers.BrowserProvider | null
  ): Promise<boolean> {
    try {
      if (!provider) {
        throw new Error('Provider is required');
      }

      const contract = getReadOnlyContract('SoulboundNFT', provider);
      return await contract.hasValidToken(address);
    } catch (error) {
      console.error(`Error checking valid token for ${address}:`, error);
      return false;
    }
  }
}

export const soulboundNftService = new SoulboundNFTService();
