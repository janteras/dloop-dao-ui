import { ethers } from 'ethers';
import { AINode } from '@/types';
import { mockAiNodeService } from './mockAiNodeService';
import { soulboundNftService, TokenDetails } from './soulboundNftService';
import { soulboundNftManifestService, StructuredToken } from './soulboundNftManifestService';

/**
 * Service for integrating AI Nodes with blockchain data
 */
class AINodeIntegrationService {
  /**
   * Fetch all AI nodes with their associated NFT data
   * @param provider The ethers provider
   * @returns Promise resolving to array of AI nodes with NFT data
   */
  async getAllAINodes(provider: ethers.BrowserProvider | null): Promise<AINode[]> {
    try {
      // Start with mock data, which we'll enrich with real NFT data
      const aiNodes = await mockAiNodeService.getAllAINodes();

      // If no provider, return mock data
      if (!provider) {
        console.warn('No provider available, using mock AI Node data only');
        return aiNodes;
      }

      try {
        // First try the manifest-based approach (more reliable with CORS handling)
        try {
          // Get the SoulboundNFT manifest data
          await soulboundNftManifestService.fetchManifest();
          const nftTokens = await soulboundNftManifestService.getAllTokens(provider);
          
          // Map NFTs to AI nodes by ID
          const enrichedNodes = aiNodes.map(node => {
            // Find matching NFT for this node based on Node ID attribute
            const matchingNft = nftTokens.find(nft => 
              nft.metadata && 
              nft.metadata.attributes && 
              nft.metadata.attributes.some((attr: any) => 
                attr.trait_type === 'Node ID' && 
                attr.value === node.id
              )
            );

            if (matchingNft) {
              return {
                ...node,
                soulboundTokenId: matchingNft.id,
                tokenData: matchingNft
              };
            }

            return node;
          });

          console.log(`Successfully enriched AI nodes with NFT data: ${enrichedNodes.filter(n => n.soulboundTokenId).length} nodes have NFTs`);
          return enrichedNodes;
        } catch (manifestError) {
          console.warn('Error using manifest approach, falling back to direct contract calls:', manifestError);
          
          // Fall back to direct contract calls
          const nfts = await soulboundNftService.getAllAINodeNFTs(provider);
          
          // Map NFTs to AI nodes by address
          const enrichedNodes = aiNodes.map(node => {
            // Find matching NFT for this node
            const matchingNft = nfts.find(nft => 
              nft.metadata && 
              nft.metadata.attributes && 
              nft.metadata.attributes.some((attr: any) => 
                attr.trait_type === 'Node ID' && 
                attr.value === node.id
              )
            );

            if (matchingNft) {
              return {
                ...node,
                soulboundTokenId: matchingNft.id,
                tokenData: matchingNft
              };
            }

            return node;
          });

          return enrichedNodes;
        }
      } catch (error) {
        console.error('Error fetching NFT data for AI Nodes:', error);
        // Return the mock data if NFT fetching fails
        return aiNodes;
      }
    } catch (error) {
      console.error('Error in getAllAINodes:', error);
      return [];
    }
  }

  /**
   * Get a specific AI node by ID with its associated NFT data
   * @param nodeId The ID of the AI node to fetch
   * @param provider The ethers provider
   * @returns Promise resolving to the AI node with NFT data, or null if not found
   */
  async getAINodeById(nodeId: string, provider: ethers.BrowserProvider | null): Promise<AINode | null> {
    try {
      // Try to get the node from the mock service first
      const node = await mockAiNodeService.getAINodeById(nodeId);

      if (!node) {
        return null;
      }

      // If no provider, return mock data
      if (!provider) {
        return node;
      }

      try {
        // Try to get NFT data for this node
        await soulboundNftManifestService.fetchManifest();
        const nftTokens = await soulboundNftManifestService.getAllTokens(provider);
        
        // Find matching NFT for this node
        const matchingNft = nftTokens.find(nft => 
          nft.metadata && 
          nft.metadata.attributes && 
          nft.metadata.attributes.some((attr: any) => 
            attr.trait_type === 'Node ID' && 
            attr.value === nodeId
          )
        );

        if (matchingNft) {
          return {
            ...node,
            soulboundTokenId: matchingNft.id,
            tokenData: matchingNft
          };
        }

        return node;
      } catch (error) {
        console.error(`Error fetching NFT data for node ${nodeId}:`, error);
        return node;
      }
    } catch (error) {
      console.error(`Error getting AI node ${nodeId}:`, error);
      return null;
    }
  }
}

// Export singleton instance
export const aiNodeIntegrationService = new AINodeIntegrationService();
