'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/common/ui/badge';
import { Button } from '@/components/common/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/common/ui/card';
import { PageHeader } from '@/components/common/page-header';
import { Skeleton } from '@/components/common/ui/skeleton';
import { useSoulboundNFTs } from '@/hooks/useSoulboundNFTs';
import { TokenDetails } from '@/services/soulboundNftService';
import { useWallet } from '@/hooks/useWallet';
import { Link } from 'wouter';
import { formatNumber, formatAddress } from '@/lib/utils';

export default function AINodeNFTExplorer() {
  const { isConnected } = useWallet();
  const { allNFTs, isLoadingAllNFTs, allNFTsError, refetchAllNFTs } = useSoulboundNFTs();
  const [sortBy, setSortBy] = useState<'id' | 'mintedAt'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortedNFTs = [...(allNFTs || [])].sort((a, b) => {
    if (sortBy === 'id') {
      return sortOrder === 'asc' ? a.id - b.id : b.id - a.id;
    } else {
      return sortOrder === 'asc' ? a.mintedAt - b.mintedAt : b.mintedAt - a.mintedAt;
    }
  });

  const handleSort = (key: 'id' | 'mintedAt') => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  // Function to format dates
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Nodes Soulbound NFTs"
        description="Explore the 10 minted AI Node Soulbound NFTs"
      />

      <div className="flex flex-wrap gap-4 mb-6 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={sortBy === 'id' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('id')}
          >
            Token ID {sortBy === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          <Button
            variant={sortBy === 'mintedAt' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSort('mintedAt')}
          >
            Minted Date {sortBy === 'mintedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchAllNFTs()}
            disabled={isLoadingAllNFTs}
          >
            {isLoadingAllNFTs ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {isLoadingAllNFTs ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent className="pb-3">
                <Skeleton className="h-32 w-full mb-4" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-32" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : allNFTsError ? (
        <Card className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Error Loading NFTs</h3>
          <p className="text-muted-foreground mb-4">
            There was an error loading the Soulbound NFTs. Please try again later.
          </p>
          <Button onClick={() => refetchAllNFTs()}>Retry</Button>
        </Card>
      ) : sortedNFTs.length === 0 ? (
        <Card className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">No NFTs Found</h3>
          <p className="text-muted-foreground mb-4">
            No Soulbound NFTs could be found. Please check your connection and try again.
          </p>
          <Button onClick={() => refetchAllNFTs()}>Refresh</Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {sortedNFTs.map((nft) => (
            <NFTCard key={nft.id} nft={nft} />
          ))}
        </div>
      )}
    </div>
  );
}

interface NFTCardProps {
  nft: TokenDetails;
}

function NFTCard({ nft }: NFTCardProps) {
  const name = nft.metadata?.name || `AI Node ${nft.id}`;
  const description = nft.metadata?.description || 'AI Node Soulbound NFT';
  const imageUrl = nft.metadata?.image || '/placeholder-nft.png';
  
  // Extract attributes from metadata if available
  const attributes = nft.metadata?.attributes || [];
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{name}</CardTitle>
            <CardDescription className="mt-1">
              Token ID: {nft.id}
            </CardDescription>
          </div>
          <Badge variant={nft.valid ? 'success' : 'destructive'}>
            {nft.valid ? 'Valid' : 'Revoked'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="mb-4 aspect-video overflow-hidden rounded-md">
          <img 
            src={imageUrl} 
            alt={name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Set fallback image if loading fails
              (e.target as HTMLImageElement).src = '/placeholder-nft.png';
            }}
          />
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground">Owner</p>
            <p className="font-medium">{formatAddress(nft.owner)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Minted On</p>
            <p className="font-medium">{new Date(nft.mintedAt * 1000).toLocaleDateString()}</p>
          </div>
          
          {attributes.map((attr, index) => (
            <div key={index}>
              <p className="text-xs text-muted-foreground">{attr.trait_type}</p>
              <p className="font-medium">{attr.value.toString()}</p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button variant="outline" size="sm" asChild>
          <a href={nft.uri} target="_blank" rel="noopener noreferrer">
            View Metadata
          </a>
        </Button>
        <Button 
          size="sm" 
          asChild
        >
          <Link href={`/ai-nodes/nft/${nft.id}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
