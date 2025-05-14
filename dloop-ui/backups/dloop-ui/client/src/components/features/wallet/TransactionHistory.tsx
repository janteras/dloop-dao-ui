import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from './wallet-provider';
import { ExternalLink, Send, ReceiptText, Upload, Download } from 'lucide-react';
import { shortenAddress } from '@/lib/utils';

interface Transaction {
  hash: string;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  type: 'send' | 'receive' | 'contract' | 'delegate' | 'undelegate';
  asset: string;
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

// Mock transaction data - in a real app, this would come from the Ethereum blockchain API
const mockTransactions: Transaction[] = [
  {
    hash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    timestamp: Math.floor(Date.now() / 1000) - 15 * 60, // 15 minutes ago
    from: '0x1234567890abcdef1234567890abcdef12345678',
    to: '0x9876543210fedcba9876543210fedcba98765432',
    value: '10.5',
    type: 'delegate',
    asset: 'DLOOP',
  },
  {
    hash: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    timestamp: Math.floor(Date.now() / 1000) - 3 * 60 * 60, // 3 hours ago
    from: '0x9876543210fedcba9876543210fedcba98765432',
    to: '0x1234567890abcdef1234567890abcdef12345678',
    value: '0.25',
    type: 'receive',
    asset: 'ETH',
  },
  {
    hash: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
    timestamp: Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60, // 2 days ago
    from: '0x1234567890abcdef1234567890abcdef12345678',
    to: '0xa87e662061237a121Ca2E83E77dA8251bc4B3529', // AssetDAO contract
    value: '0',
    type: 'contract',
    asset: 'DLOOP',
  },
  {
    hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    timestamp: Math.floor(Date.now() / 1000) - 5 * 24 * 60 * 60, // 5 days ago
    from: '0x1234567890abcdef1234567890abcdef12345678',
    to: '0x5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b',
    value: '25',
    type: 'send',
    asset: 'DAI',
  },
];

const TransactionHistory = () => {
  const { address, isConnected } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // In a real app, we would fetch transactions from the blockchain using address
  useEffect(() => {
    if (isConnected && address) {
      // Function to fetch transaction history would be here
      // For now, use mock data
      const userMockTransactions = mockTransactions.map(tx => {
        if (tx.from.toLowerCase() === address.toLowerCase()) {
          return { ...tx, from: address };
        }
        if (tx.to.toLowerCase() === address.toLowerCase()) {
          return { ...tx, to: address };
        }
        return tx;
      });
      
      setTransactions(userMockTransactions);
    } else {
      setTransactions([]);
    }
  }, [address, isConnected]);

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'send':
        return <Upload className="h-4 w-4 text-red-500" />;
      case 'receive':
        return <Download className="h-4 w-4 text-green-500" />;
      case 'contract':
        return <ReceiptText className="h-4 w-4 text-blue-500" />;
      case 'delegate':
        return <Send className="h-4 w-4 text-purple-500" />;
      case 'undelegate':
        return <Send className="h-4 w-4 text-orange-500" />;
      default:
        return <ReceiptText className="h-4 w-4" />;
    }
  };

  const getTransactionLabel = (tx: Transaction) => {
    if (tx.from.toLowerCase() === address.toLowerCase()) {
      switch (tx.type) {
        case 'send':
          return `Sent ${tx.value} ${tx.asset} to ${shortenAddress(tx.to)}`;
        case 'delegate':
          return `Delegated ${tx.value} ${tx.asset} to ${shortenAddress(tx.to)}`;
        case 'undelegate':
          return `Undelegated ${tx.value} ${tx.asset} from ${shortenAddress(tx.to)}`;
        case 'contract':
          return `Interacted with contract ${shortenAddress(tx.to)}`;
        default:
          return `Sent ${tx.value} ${tx.asset} to ${shortenAddress(tx.to)}`;
      }
    } else {
      return `Received ${tx.value} ${tx.asset} from ${shortenAddress(tx.from)}`;
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest blockchain activity</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No transactions found
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx) => (
              <div
                key={tx.hash}
                className="flex items-start justify-between border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">{getTransactionIcon(tx.type)}</div>
                  <div>
                    <div className="font-medium">{getTransactionLabel(tx)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(tx.timestamp)}
                    </div>
                  </div>
                </div>
                <a
                  href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;