import React from 'react';
import { useAssetDAOInfo } from '@/hooks/useAssetDAOInfo';
import { shortenAddress } from '@/lib/utils';

/**
 * Component that displays AssetDAO contract information from Sepolia testnet
 * This serves as a test to verify our contract integration is working properly
 */
export function AssetDAOStatus() {
  const { proposalCount, governanceTokenAddress, isLoading, error } = useAssetDAOInfo();

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg bg-background shadow-sm border">
        <h3 className="text-lg font-medium mb-2">AssetDAO Contract</h3>
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-t-2 border-primary rounded-full"></div>
          <span>Loading contract information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-background shadow-sm border border-destructive/20">
        <h3 className="text-lg font-medium mb-2">AssetDAO Contract</h3>
        <div className="text-destructive">
          <p>Error connecting to AssetDAO contract:</p>
          <p className="text-sm break-all">{error}</p>
          {error?.includes('invalid project id') && (
            <div className="mt-2 text-sm">
              <p className="font-medium">Invalid Infura API key detected.</p>
              <p className="mt-1">A valid Infura API key is required to connect to the AssetDAO contract.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-background shadow-sm border">
      <h3 className="text-lg font-medium mb-3">AssetDAO Contract</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total Proposals:</span>
          <span className="font-medium">{proposalCount !== null ? proposalCount : 'N/A'}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground">Governance Token:</span>
          <span className="font-medium text-xs break-all">
            {governanceTokenAddress ? governanceTokenAddress : 'N/A'}
          </span>
          {governanceTokenAddress && (
            <a 
              href={`https://sepolia.etherscan.io/address/${governanceTokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs mt-1"
            >
              View on Etherscan
            </a>
          )}
        </div>
      </div>
    </div>
  );
}