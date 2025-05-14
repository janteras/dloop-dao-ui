import React from 'react';
import { useBlockchainInfo } from '@/hooks/useBlockchainInfo';

/**
 * Component that displays current blockchain information from Sepolia testnet
 * This serves as a test to verify our provider connection is working properly
 */
export function BlockchainStatus() {
  const { blockNumber, blockTimestamp, gasPrice, isLoading, error } = useBlockchainInfo();

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg bg-background shadow-sm border">
        <h3 className="text-lg font-medium mb-2">Blockchain Status</h3>
        <div className="flex items-center gap-2">
          <div className="animate-spin h-4 w-4 border-t-2 border-primary rounded-full"></div>
          <span>Loading network information...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-background shadow-sm border border-destructive/20">
        <h3 className="text-lg font-medium mb-2">Blockchain Status</h3>
        <div className="text-destructive">
          <p>Error connecting to Sepolia testnet:</p>
          <p className="text-sm break-all">{error}</p>
          {error?.includes('invalid project id') && (
            <div className="mt-2 text-sm">
              <p className="font-medium">Invalid Infura API key detected.</p>
              <p className="mt-1">A valid Infura API key is required to connect to Ethereum networks.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-background shadow-sm border">
      <h3 className="text-lg font-medium mb-3">Sepolia Network Status</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Current Block:</span>
          <span className="font-medium">{blockNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Latest Block Time:</span>
          <span className="font-medium">{blockTimestamp}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Gas Price:</span>
          <span className="font-medium">{gasPrice}</span>
        </div>
      </div>
    </div>
  );
}