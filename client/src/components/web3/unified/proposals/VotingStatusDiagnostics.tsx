import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Proposal } from '@/types';
import { extractVoteCounts, calculateVotingStats } from '@/utils/vote-helpers';
import { formatEther } from 'viem';

interface VotingStatusDiagnosticsProps {
  proposal: Proposal;
  className?: string;
}

export const VotingStatusDiagnostics: React.FC<VotingStatusDiagnosticsProps> = ({
  proposal,
  className = ''
}) => {
  const { forVotes, againstVotes } = extractVoteCounts(proposal);
  const stats = calculateVotingStats(forVotes, againstVotes);

  // Additional debugging for different conversion methods
  const debugConversions = React.useMemo(() => {
    const forVotesRaw = proposal.forVotes;
    const againstVotesRaw = proposal.againstVotes;

    const attempts = {
      direct: {
        for: Number(forVotesRaw),
        against: Number(againstVotesRaw)
      },
      formatEther: {
        for: forVotesRaw ? Number(formatEther(forVotesRaw.toString())) : 0,
        against: againstVotesRaw ? Number(formatEther(againstVotesRaw.toString())) : 0
      },
      string: {
        for: parseFloat(String(forVotesRaw)) || 0,
        against: parseFloat(String(againstVotesRaw)) || 0
      }
    };

    return attempts;
  }, [proposal.forVotes, proposal.againstVotes]);

  return (
    <Card className={`${className} border-yellow-500/20 bg-yellow-50/10`}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          🔍 Voting Diagnostics - Proposal #{proposal.id}
          <Badge variant="outline" className="text-xs">
            Debug Mode
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <h4 className="font-medium text-muted-foreground mb-2">Raw Contract Data</h4>
            <div className="space-y-1 font-mono">
              <div>For: {JSON.stringify(proposal.forVotes)}</div>
              <div>Against: {JSON.stringify(proposal.againstVotes)}</div>
              <div>Types: {typeof proposal.forVotes} / {typeof proposal.againstVotes}</div>
              <div>IsArray: {Array.isArray(proposal.forVotes)} / {Array.isArray(proposal.againstVotes)}</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-muted-foreground mb-2">Processed Data</h4>
            <div className="space-y-1">
              <div>For: {forVotes.toFixed(6)} DLOOP</div>
              <div>Against: {againstVotes.toFixed(6)} DLOOP</div>
              <div>Total: {stats.totalVotes.toFixed(6)} DLOOP</div>
              <div>Has Votes: {stats.hasVotes ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="font-medium text-muted-foreground text-xs">Conversion Attempts</h4>
          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div>
              <div className="font-medium">Direct:</div>
              <div>F: {debugConversions.direct.for}</div>
              <div>A: {debugConversions.direct.against}</div>
            </div>
            <div>
              <div className="font-medium">formatEther:</div>
              <div>F: {debugConversions.formatEther.for}</div>
              <div>A: {debugConversions.formatEther.against}</div>
            </div>
            <div>
              <div className="font-medium">String:</div>
              <div>F: {debugConversions.string.for}</div>
              <div>A: {debugConversions.string.against}</div>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="font-medium text-muted-foreground text-xs">Voting Calculations</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>For %: {stats.forPercentage.toFixed(2)}%</div>
            <div>Against %: {stats.againstPercentage.toFixed(2)}%</div>
          </div>
          <div className="text-xs">
            Quorum Progress: {((stats.totalVotes / 100000) * 100).toFixed(2)}% 
            <span className="text-muted-foreground ml-2">
              ({stats.totalVotes.toLocaleString()} / 100,000 DLOOP)
            </span>
          </div>
        </div>

        <Separator />

        <div className="space-y-1 text-xs">
          <h4 className="font-medium text-muted-foreground">Contract State</h4>
          <div>Status: <Badge variant="outline" className="text-xs">{proposal.status}</Badge></div>
          <div>Executed: {proposal.executed ? 'Yes' : 'No'}</div>
          <div>Created: {proposal.createdAt ? new Date(proposal.createdAt).toLocaleString() : 'Unknown'}</div>
          <div>Deadline: {proposal.deadline ? new Date(proposal.deadline).toLocaleString() : 'Unknown'}</div>
          <div>Token: {proposal.token || 'Not specified'}</div>
          <div>Amount: {proposal.amount || 'Not specified'}</div>
          <div>Type: {proposal.type || 'Not specified'}</div>
          <div>Proposer: {proposal.proposer || 'Not specified'}</div>
        </div>

        <Separator />

        <div className="space-y-1 text-xs">
          <h4 className="font-medium text-muted-foreground">Contract Data Debug</h4>
          <div>Data Source: {proposal.__debug?.dataSource || 'Contract'}</div>
          <div>Last Updated: {proposal.__debug?.lastUpdated || 'Unknown'}</div>
          <div>API Endpoint: {proposal.__debug?.apiEndpoint || 'Direct Contract'}</div>
          <div>Data Size: {JSON.stringify(proposal).length} bytes</div>
          <div>Vote Quality: {stats.totalVotes > 0 ? '✓ Has Votes' : '○ No Votes Yet'}</div>
          <div>Wei Conversion: {typeof proposal.forVotes === 'bigint' ? '✓ BigInt' : typeof proposal.forVotes}</div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <>
            <Separator />
            <div className="text-xs">
              <h4 className="font-medium text-muted-foreground">Full Proposal Object</h4>
              <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(proposal, null, 2)}
              </pre>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};