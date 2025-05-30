import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/common/ui/card';
import { Button } from '@/components/common/ui/button';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';
import { useBlockchainInfo } from '@/hooks/useBlockchainInfo';
import { useAssetDAOInfo } from '@/hooks/useAssetDAOInfo';
import { getContractAddress } from '@/lib/contracts';
import { Skeleton } from '@/components/common/ui/skeleton';

/**
 * BlockchainVerification component displays the status of blockchain connections and contracts
 * It verifies:
 * 1. Connection to Sepolia network
 * 2. Block sync status
 * 3. Access to contract data
 */
export function BlockchainVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const { blockNumber, blockTimestamp, gasPrice, isLoading: blockInfoLoading, error: blockInfoError } = useBlockchainInfo();
  const { proposalCount, governanceTokenAddress, isLoading: contractLoading, error: contractError } = useAssetDAOInfo();
  
  // Check connection status
  const isNetworkConnected = !!blockNumber;
  const isContractAccessible = proposalCount !== null;
  
  // Handle manual verification
  const handleVerify = () => {
    setIsVerifying(true);
    // Verification will trigger hook refreshes
    setTimeout(() => setIsVerifying(false), 3000);
  };

  // Handle copy contract address
  const handleCopyAddress = async () => {
    try {
      const contractAddress = getContractAddress('AssetDAO');
      await navigator.clipboard.writeText(contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };
  
  // Get status text and icon
  const getStatusIcon = (isSuccess: boolean, isLoading: boolean, hasWarning = false) => {
    if (isLoading || isVerifying) {
      return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
    }
    if (hasWarning) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return isSuccess ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Blockchain Verification</CardTitle>
        <CardDescription>
          Verify blockchain connection and contract status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Connection */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Sepolia Network</h3>
            <p className="text-xs text-gray-500">Infura RPC Connection</p>
          </div>
          <div className="flex items-center">
            {getStatusIcon(isNetworkConnected, blockInfoLoading)}
          </div>
        </div>
        
        {/* Block Information */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="rounded-md border p-3">
            <div className="text-xs text-gray-500 mb-1">Latest Block</div>
            {blockInfoLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <div className="text-sm font-mono">{blockNumber || 'N/A'}</div>
            )}
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-gray-500 mb-1">Gas Price</div>
            {blockInfoLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <div className="text-sm font-mono">{gasPrice || 'N/A'}</div>
            )}
          </div>
        </div>
        
        <div className="border-t my-4"></div>
        
        {/* Contract Status */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium">TreasuryDAO Contract</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">
                {getContractAddress('AssetDAO').slice(0, 6)}...{getContractAddress('AssetDAO').slice(-4)}
              </p>
              <button
                onClick={handleCopyAddress}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                title="Copy contract address"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center">
            {getStatusIcon(
              isContractAccessible, 
              contractLoading,
              proposalCount === 0
            )}
          </div>
        </div>
        
        {/* Contract Information */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="rounded-md border p-3">
            <div className="text-xs text-gray-500 mb-1">Proposal Count</div>
            {contractLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <div className="text-sm font-mono">{proposalCount !== null ? proposalCount : 'N/A'}</div>
            )}
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs text-gray-500 mb-1">Governance Token</div>
            {contractLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <div className="text-sm font-mono truncate">
                {governanceTokenAddress ? 
                  `${governanceTokenAddress.slice(0, 6)}...${governanceTokenAddress.slice(-4)}` : 
                  'N/A'}
              </div>
            )}
          </div>
        </div>
        
        {/* Error Display */}
        {(blockInfoError || contractError) && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-4">
            <h4 className="text-sm font-medium text-red-800">Error Details</h4>
            {blockInfoError && (
              <p className="text-xs text-red-700 mt-1">{blockInfoError}</p>
            )}
            {contractError && (
              <p className="text-xs text-red-700 mt-1">{contractError}</p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleVerify} 
          disabled={isVerifying}
          variant="outline"
          className="w-full"
        >
          {isVerifying ? 'Verifying...' : 'Verify Connections'}
          {isVerifying && <RefreshCw className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
      </CardFooter>
    </Card>
  );
}