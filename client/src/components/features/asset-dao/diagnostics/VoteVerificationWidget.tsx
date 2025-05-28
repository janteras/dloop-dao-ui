
/**
 * Vote Verification Widget
 * 
 * Compares displayed vote counts with on-chain data
 * to ensure accuracy and detect local storage issues.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEthers } from '@/contexts/EthersContext';
import { verifyVoteData } from '@/utils/assetdao-data-verification';
import { CheckCircle, AlertTriangle, Search } from 'lucide-react';

interface VoteVerificationResult {
  proposalId: number;
  consistent: boolean;
  onChainFor: string;
  onChainAgainst: string;
  discrepancy?: string;
}

export function VoteVerificationWidget() {
  const { provider } = useEthers();
  const [proposalId, setProposalId] = useState<string>('');
  const [displayedForVotes, setDisplayedForVotes] = useState<string>('');
  const [displayedAgainstVotes, setDisplayedAgainstVotes] = useState<string>('');
  const [result, setResult] = useState<VoteVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!provider || !proposalId || !displayedForVotes || !displayedAgainstVotes) {
      return;
    }

    setIsVerifying(true);
    try {
      const verification = await verifyVoteData(
        provider,
        parseInt(proposalId),
        parseFloat(displayedForVotes),
        parseFloat(displayedAgainstVotes)
      );

      setResult({
        proposalId: parseInt(proposalId),
        ...verification
      });
    } catch (error) {
      console.error('Vote verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Vote Data Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="proposalId">Proposal ID</Label>
            <Input
              id="proposalId"
              type="number"
              value={proposalId}
              onChange={(e) => setProposalId(e.target.value)}
              placeholder="Enter proposal ID"
            />
          </div>
          <div>
            <Label htmlFor="forVotes">Displayed For Votes</Label>
            <Input
              id="forVotes"
              type="number"
              step="0.000001"
              value={displayedForVotes}
              onChange={(e) => setDisplayedForVotes(e.target.value)}
              placeholder="For votes count"
            />
          </div>
          <div>
            <Label htmlFor="againstVotes">Displayed Against Votes</Label>
            <Input
              id="againstVotes"
              type="number"
              step="0.000001"
              value={displayedAgainstVotes}
              onChange={(e) => setDisplayedAgainstVotes(e.target.value)}
              placeholder="Against votes count"
            />
          </div>
        </div>

        <Button
          onClick={handleVerify}
          disabled={isVerifying || !provider || !proposalId || !displayedForVotes || !displayedAgainstVotes}
          className="w-full"
        >
          {isVerifying ? 'Verifying...' : 'Verify Vote Data'}
        </Button>

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={result.consistent ? 'default' : 'destructive'}>
                {result.consistent ? (
                  <CheckCircle className="w-4 h-4 mr-1" />
                ) : (
                  <AlertTriangle className="w-4 h-4 mr-1" />
                )}
                {result.consistent ? 'Data Consistent' : 'Discrepancy Found'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">On-Chain Data</h4>
                  <div className="space-y-1 text-sm">
                    <div>For: {result.onChainFor} DLOOP</div>
                    <div>Against: {result.onChainAgainst} DLOOP</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Displayed Data</h4>
                  <div className="space-y-1 text-sm">
                    <div>For: {displayedForVotes} DLOOP</div>
                    <div>Against: {displayedAgainstVotes} DLOOP</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {result.discrepancy && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{result.discrepancy}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p>Use this tool to verify that vote counts displayed in the UI match the on-chain data.</p>
          <p>Discrepancies may indicate local storage caching issues or data transformation problems.</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default VoteVerificationWidget;
