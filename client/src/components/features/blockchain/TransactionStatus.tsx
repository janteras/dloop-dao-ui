import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/ui/card';
import { Badge } from '@/components/common/ui/badge';
import { Button } from '@/components/common/ui/button';
import { Loader2, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '@/config/contracts';

interface TransactionStatusProps {
  txHash?: string;
  onCompleted?: () => void;
  onFailed?: (error: string) => void;
  autoClose?: boolean;
  waitForConfirmations?: number;
}

type TxStatus = 'pending' | 'confirmed' | 'failed';

export function TransactionStatus({
  txHash,
  onCompleted,
  onFailed,
  autoClose = true,
  waitForConfirmations = 1
}: TransactionStatusProps) {
  const [status, setStatus] = useState<TxStatus>('pending');
  const [confirmations, setConfirmations] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!txHash) return;

    const checkTransaction = async () => {
      try {
        // Get provider
        const provider = new ethers.JsonRpcProvider(
          `https://sepolia.infura.io/v3/ca485bd6567e4c5fb5693ee66a5885d8`
        );

        // Get transaction receipt
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!receipt) {
          // Still pending
          return;
        }

        // Check confirmations
        const currentConfirmations = Number(receipt.confirmations);
        if (currentConfirmations >= waitForConfirmations) {
          setConfirmations(currentConfirmations);
          
          // Check if transaction was successful
          if (receipt.status === 1) {
            setStatus('confirmed');
            
            // Notify success
            toast({
              title: 'Transaction Confirmed',
              description: 'Your transaction has been confirmed successfully.',
              variant: 'default',
            });
            
            if (onCompleted) onCompleted();
            
            // Auto close after 3 seconds if needed
            if (autoClose) {
              setTimeout(() => {
                // Close any modal or UI component
              }, 3000);
            }
          } else {
            setStatus('failed');
            const errorMsg = 'Transaction failed: The transaction was reverted by the blockchain';
            setError(errorMsg);
            
            // Notify error
            toast({
              title: 'Transaction Failed',
              description: errorMsg,
              variant: 'destructive',
            });
            
            if (onFailed) onFailed(errorMsg);
          }
        } else {
          // Not enough confirmations yet
          setConfirmations(currentConfirmations);
        }
      } catch (err) {
        console.error('Error checking transaction:', err);
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unknown error occurred');
        }
      }
    };

    // Initial check
    checkTransaction();

    // Set up polling interval (every 5 seconds)
    const interval = setInterval(checkTransaction, 5000);

    // Clean up
    return () => clearInterval(interval);
  }, [txHash, waitForConfirmations, onCompleted, onFailed, autoClose, toast]);

  // Get explorer URL for the transaction
  const getExplorerUrl = () => {
    if (!txHash) return '#';
    return `${NETWORK_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`;
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Transaction Status
          {status === 'pending' && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
              Pending
            </Badge>
          )}
          {status === 'confirmed' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              Confirmed
            </Badge>
          )}
          {status === 'failed' && (
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
              Failed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Transaction Hash */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Transaction Hash:</span>
            <div className="flex items-center">
              <span className="text-sm font-mono truncate max-w-[150px]">
                {txHash || 'N/A'}
              </span>
              {txHash && (
                <a
                  href={getExplorerUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-500 hover:text-blue-700"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
          
          {/* Confirmations */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Confirmations:</span>
            <span className="text-sm">
              {confirmations} / {waitForConfirmations}
            </span>
          </div>
          
          {/* Status icon */}
          <div className="flex justify-center py-4">
            {status === 'pending' && (
              <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
            )}
            {status === 'confirmed' && (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
            {status === 'failed' && (
              <AlertTriangle className="h-16 w-16 text-red-500" />
            )}
          </div>
          
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          
          {/* View on Explorer button */}
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.open(getExplorerUrl(), '_blank')}
            disabled={!txHash}
          >
            View on Explorer
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}