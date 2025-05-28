
/**
 * Data Source Monitor Component
 * 
 * Real-time monitoring of AssetDAO data sources to identify
 * inconsistencies and mock data contamination.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEthers } from '@/contexts/EthersContext';
import { verifyProposalDataSources, verifyVoteData, VerificationReport } from '@/utils/assetdao-data-verification';
import { AlertTriangle, CheckCircle, RefreshCw, Eye } from 'lucide-react';

export function DataSourceMonitor() {
  const { provider } = useEthers();
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const runVerification = async () => {
    if (!provider) return;
    
    setIsVerifying(true);
    try {
      const newReport = await verifyProposalDataSources(provider);
      setReport(newReport);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (provider) {
      runVerification();
    }
  }, [provider]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(runVerification, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, provider]);

  const getStatusColor = (hasErrors: boolean, mockDetected: boolean) => {
    if (hasErrors || mockDetected) return 'destructive';
    return 'default';
  };

  const getStatusIcon = (hasErrors: boolean, mockDetected: boolean) => {
    if (hasErrors || mockDetected) return <AlertTriangle className="w-4 h-4" />;
    return <CheckCircle className="w-4 h-4" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            AssetDAO Data Source Monitor
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? 'Stop Auto-refresh' : 'Start Auto-refresh'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={runVerification}
              disabled={isVerifying}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isVerifying ? 'animate-spin' : ''}`} />
              Verify Now
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {report && (
          <>
            {/* Overall Status */}
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(report.discrepancies.length > 0, report.mockDataDetected)}>
                {getStatusIcon(report.discrepancies.length > 0, report.mockDataDetected)}
                {report.discrepancies.length === 0 && !report.mockDataDetected ? 'All Good' : 'Issues Detected'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Last checked: {new Date(report.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Data Sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.sources.map((source, index) => (
                <Card key={index} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold capitalize">{source.source}</h4>
                      <Badge variant={source.error ? 'destructive' : 'default'}>
                        {source.error ? 'Error' : 'OK'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div>Proposal Count: {source.proposalCount}</div>
                      {source.error && (
                        <div className="text-red-600">Error: {source.error}</div>
                      )}
                      {source.sampleProposal && (
                        <div className="text-muted-foreground">
                          Sample: ID {source.sampleProposal.id}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Mock Data Detection */}
            {report.mockDataDetected && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  Mock data detected in API responses. This should be removed in production.
                </AlertDescription>
              </Alert>
            )}

            {/* Discrepancies */}
            {report.discrepancies.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-600">Discrepancies Found:</h4>
                {report.discrepancies.map((discrepancy, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertDescription>{discrepancy}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-blue-600">Recommendations:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {report.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {!report && !isVerifying && (
          <div className="text-center text-muted-foreground">
            Connect your wallet to start monitoring data sources
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DataSourceMonitor;
