import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWallet } from './wallet-provider';
import { useDAOPortfolio } from '@/hooks/useDAOPortfolio';
import { shortenAddress } from '@/lib/utils';
import { ExternalLink, Wallet, Send } from 'lucide-react';
import DelegateTokensModal from '@/components/modals/DelegateTokensModal';
import UndelegateTokensModal from '@/components/modals/UndelegateTokensModal';
import { AINode, Delegation } from '@/types';

// Mock AI node for delegation - in production, this would come from API/blockchain
const mockAINode: AINode = {
  id: 'node-1',
  name: 'Alpha Predictor',
  address: '0x9876543210fedcba9876543210fedcba98765432',
  strategy: 'Momentum Trading',
  delegatedAmount: 42.5,
  accuracy: 0.87,
  performance: 0.093,
  performance90d: 0.085,
  proposalsCreated: 12,
  proposalsPassed: 9,
  tradingThesis: {
    description: 'This AI node focuses on momentum trading strategies with a short time horizon.',
    points: [
      'Uses technical indicators to identify short-term trends',
      'Employs volume analysis for confirmation',
      'Focuses on high-volatility assets for maximum returns'
    ],
    conclusion: 'Best suited for bullish markets with clear directional momentum.'
  },
  recentActivity: [
    { title: 'Created Proposal: Increase ETH allocation', date: '3 days ago', status: 'Passed' },
    { title: 'Voted: Decrease USDC allocation', date: '1 week ago', status: 'For' },
    { title: 'Created Proposal: Add AAVE to portfolio', date: '2 weeks ago', status: 'Passed' }
  ]
};

// Mock delegation for undelegation - in production, this would come from API/blockchain
const mockDelegation: Delegation = {
  id: 'delegation-1',
  from: '0x1234567890abcdef1234567890abcdef12345678',
  to: '0x9876543210fedcba9876543210fedcba98765432',
  toName: 'Alpha Predictor',
  toType: 'AI Node',
  amount: 42.5,
  date: Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days ago
};

const WalletWidget = () => {
  const { isConnected, address, connect } = useWallet();
  const { portfolio } = useDAOPortfolio();
  const [delegateModalOpen, setDelegateModalOpen] = useState(false);
  const [undelegateModalOpen, setUndelegateModalOpen] = useState(false);

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
          <CardDescription>Connect your wallet to interact with D-Loop</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={connect} className="w-full">
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Wallet</span>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2"
              onClick={() => window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank')}
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              View on Etherscan
            </Button>
          </CardTitle>
          <CardDescription>{shortenAddress(address)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">DLOOP Balance:</span>
              <span className="font-medium">{portfolio.dloopBalance.toFixed(4)} DLOOP</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">DAI Balance:</span>
              <span className="font-medium">{portfolio.daiBalance.toFixed(4)} DAI</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delegated DLOOP:</span>
              <span className="font-medium">{portfolio.delegatedDloop.toFixed(4)} DLOOP</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pending Rewards:</span>
              <span className="font-medium text-green-500">
                +{portfolio.pendingRewards.toFixed(4)} DLOOP
              </span>
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setDelegateModalOpen(true)}
            >
              <Send className="mr-2 h-4 w-4" />
              Delegate
            </Button>
            <Button 
              variant="default" 
              className="flex-1"
              onClick={() => setUndelegateModalOpen(true)}
              disabled={portfolio.delegatedDloop <= 0}
            >
              Undelegate
            </Button>
          </div>
        </CardContent>
      </Card>

      <DelegateTokensModal
        isOpen={delegateModalOpen}
        onClose={() => setDelegateModalOpen(false)}
        node={mockAINode}
        availableBalance={portfolio.dloopBalance}
      />

      <UndelegateTokensModal
        isOpen={undelegateModalOpen}
        onClose={() => setUndelegateModalOpen(false)}
        delegation={mockDelegation}
      />
    </>
  );
};

export default WalletWidget;