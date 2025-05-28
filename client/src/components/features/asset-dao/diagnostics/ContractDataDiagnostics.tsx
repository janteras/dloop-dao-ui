
/**
 * Contract Data Diagnostics Component
 * 
 * Real-time monitoring and validation of AssetDAO contract data flow
 * Helps identify ABI mismatches, data consistency issues, and method failures
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEthers } from '@/contexts/EthersContext';
import { EnhancedAssetDAOService } from '@/services/enhanced-assetDaoService';
import { runContractDiagnostics } from '@/lib/contracts';
import { validateProposalData } from '@/utils/vote-helpers';
import { AlertTriangle, CheckCircle, RefreshCw, Database, Bug } from 'lucide-react';

interface DiagnosticResult {
  timestamp: number;
  contractAccessible: boolean;
  proposalCountWorking: boolean;
  getProposalWorking: boolean;
  sampleProposal?: any;
  validationErrors: string[];
  warnings: string[];
}

export function ContractDataDiagnostics() {
  const { provider } = useEthers();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const runDiagnostics = async () => {
    if (!provider) {
      console.warn('No provider available for diagnostics');
      return;
    }

    setIsRunning(true);
    
    try {
      console.log('🔍 Running comprehensive AssetDAO diagnostics...');
      
      // Test contract accessibility
      const contractDiagnostics = await EnhancedAssetDAOService.runContractDiagnostics(provider);
      
      // Test general contract methods
      const generalDiagnostics = await runContractDiagnostics(provider);
      
      let sampleProposal = null;
      const validationErrors: string[] = [];
      const warnings: string[] = [];
      
      // If contract is accessible, try to fetch a sample proposal
      if (contractDiagnostics.proposalCountWorking && contractDiagnostics.getProposalWorking) {
        try {
          sampleProposal = await EnhancedAssetDAOService.getProposalById(provider, 1);
          
          if (sampleProposal) {
            // Validate the proposal data structure
            const validation = validateProposalData(sampleProposal);
            validationErrors.push(...validation.errors);
            warnings.push(...validation.warnings);
          }
        } catch (error) {
          console.error('Error fetching sample proposal:', error);
          validationErrors.push(`Sample proposal fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      const result: DiagnosticResult = {
        timestamp: Date.now(),
        contractAccessible: contractDiagnostics.contractAccessible,
        proposalCountWorking: contractDiagnostics.proposalCountWorking,
        getProposalWorking: contractDiagnostics.getProposalWorking,
        sampleProposal,
        validationErrors: [...contractDiagnostics.errors, ...validationErrors],
        warnings
      };
      
      setResults(result);
      console.log('✅ Diagnostics completed:', result);
      
    } catch (error) {
      console.error('❌ Diagnostics failed:', error);
      setResults({
        timestamp: Date.now(),
        contractAccessible: false,
        proposalCountWorking: false,
        getProposalWorking: false,
        validationErrors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: []
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && provider) {
      const interval = setInterval(runDiagnostics, 30000); // Every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, provider]);

  // Run initial diagnostics
  useEffect(() => {
    if (provider) {
      runDiagnostics();
    }
  }, [provider]);

  const getStatusBadge = (condition: boolean, trueText: string, falseText: string) => (
    <Badge variant={condition ? 'default' : 'destructive'}>
      {condition ? (
        <><CheckCircle className="w-3 h-3 mr-1" /> {trueText}</>
      ) : (
        <><AlertTriangle className="w-3 h-3 mr-1" /> {falseText}</>
      )}
    </Badge>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            AssetDAO Contract Data Diagnostics
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
            >
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={runDiagnostics}
              disabled={isRunning || !provider}
            >
              {isRunning ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Running...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" /> Run Diagnostics</>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!provider && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No Web3 provider available. Please connect your wallet to run diagnostics.
            </AlertDescription>
          </Alert>
        )}

        {results && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Contract Accessibility</h4>
                {getStatusBadge(results.contractAccessible, 'Accessible', 'Not Accessible')}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">getProposalCount()</h4>
                {getStatusBadge(results.proposalCountWorking, 'Working', 'Failed')}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">getProposal()</h4>
                {getStatusBadge(results.getProposalWorking, 'Working', 'Failed')}
              </div>
            </div>

            {results.sampleProposal && (
              <div className="space-y-2">
                <h4 className="font-medium">Sample Proposal Data</h4>
                <div className="bg-gray-50 p-3 rounded-md text-sm">
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(results.sampleProposal, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {results.validationErrors.length > 0 && (
              <Alert variant="destructive">
                <Bug className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Critical Issues Found:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {results.validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {results.warnings.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Warnings:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {results.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-gray-500">
              Last run: {new Date(results.timestamp).toLocaleTimeString()}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ContractDataDiagnostics;
