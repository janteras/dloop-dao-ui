'use client';

import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { useWallet } from '@/hooks/useWallet';
import { useSoulboundNFTs } from '@/hooks/useSoulboundNFTs';
import { TokenDetails } from '@/services/soulboundNftService';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/common/ui/card';
import { Badge } from '@/components/common/ui/badge';
import { Button } from '@/components/common/ui/button';
import { Skeleton } from '@/components/common/ui/skeleton';
import { Separator } from '@/components/common/ui/separator';
import { formatNumber, shortenAddress } from '@/lib/utils';
import { ethers } from 'ethers';
import { soulboundNftService } from '@/services/soulboundNftService';

export default function AINodeNFTDetail() {
  // Get the token ID from URL
  const [, params] = useRoute<{ id: string }>('/ai-nodes/nft/:id');
  const tokenId = params?.id ? parseInt(params.id) : null;
  
  const { provider } = useWallet();
  const [nft, setNft] = useState<TokenDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadNftDetails() {
      if (!tokenId || !provider) return;
      
      try {
        setLoading(true);
        const tokenDetails = await soulboundNftService.getTokenById(tokenId, provider);
        setNft(tokenDetails);
        setLoading(false);
      } catch (err) {
        console.error('Error loading NFT details:', err);
        setError('Failed to load NFT details. Please try again later.');
        setLoading(false);
      }
    }
    
    loadNftDetails();
  }, [tokenId, provider]);
  
  if (!tokenId) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Invalid Token ID" 
          description="No token ID was specified"
        />
        <Card>
          <CardContent className="pt-6">
            <p>Please specify a valid token ID to view the details.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Loading NFT Details" 
          description={`Retrieving information for Token #${tokenId}`}
        />
        <Card>
          <CardHeader>
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-5 w-1/2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="aspect-video rounded-md overflow-hidden">
              <Skeleton className="h-full w-full" />
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !nft) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Error Loading NFT" 
          description="There was a problem retrieving the NFT details"
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive mb-4">{error || 'NFT not found'}</p>
            <Button onClick={() => window.history.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format dates
  const mintedDate = new Date(nft.mintedAt * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  // Extract metadata
  const name = nft.metadata?.name || `AI Node ${nft.id}`;
  const description = nft.metadata?.description || 'AI Node Soulbound NFT';
  const imageUrl = nft.metadata?.image || '/placeholder-nft.png';
  const attributes = nft.metadata?.attributes || [];
  
  return (
    <div className="space-y-6">
      <PageHeader 
        title={name} 
        description={`Soulbound NFT Token #${nft.id}`}
      />
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* NFT Image Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="aspect-square overflow-hidden rounded-md mb-4">
              <img 
                src={imageUrl} 
                alt={name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-nft.png';
                }}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant={nft.valid ? 'success' : 'destructive'}>
                {nft.valid ? 'Valid' : 'Revoked'}
              </Badge>
              <Badge variant="outline">Token #{nft.id}</Badge>
            </div>
            
            <div className="mt-4">
              <a 
                href={nft.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View Metadata Source
              </a>
            </div>
          </CardContent>
        </Card>
        
        {/* NFT Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{name}</CardTitle>
            <CardDescription>
              Soulbound NFT - Non-transferable identity token
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-muted-foreground">{description}</p>
            </div>
            
            <Separator />
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Owner</h3>
                <p className="flex items-center">
                  {shortenAddress(nft.owner)}
                  <a 
                    href={`https://sepolia.etherscan.io/address/${nft.owner}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-xs text-primary hover:underline"
                  >
                    View on Etherscan
                  </a>
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Minted On</h3>
                <p>{mintedDate}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Token ID</h3>
                <p>{nft.id}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Status</h3>
                <p className={nft.valid ? "text-green-500" : "text-red-500"}>
                  {nft.valid ? "Active" : "Revoked"}
                </p>
              </div>
            </div>
            
            {attributes.length > 0 && (
              <>
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-3">Attributes</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {attributes.map((attr, index) => (
                      <div key={index} className="bg-card border rounded-md p-3">
                        <p className="text-xs text-muted-foreground mb-1">
                          {attr.trait_type}
                        </p>
                        <p className="font-medium">
                          {attr.value.toString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
            >
              Back to All NFTs
            </Button>
            
            <a 
              href={`https://sepolia.etherscan.io/token/${nft.owner}?a=${nft.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button>View on Etherscan</Button>
            </a>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
