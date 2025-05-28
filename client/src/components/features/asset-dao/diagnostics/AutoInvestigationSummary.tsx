
/**
 * Auto Investigation Summary
 * 
 * Automatically runs when the page loads and provides a summary
 * of key findings about AssetDAO data flow and consistency
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useEthers } from '@/contexts/EthersContext';
import { runFullContractDiagnostics } from '@/utils/contract-method-diagnostics';
import { verifyProposalDataSources } from '@/utils/assetdao-data-verification';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface InvestigationSummary {
  contractAccessibility: 'accessible' | 'partial' | 'inaccessible';
  dataConsistency: 'consistent' | 'inconsistent' | 'unknown';
  localStorageUsage: 'clean' | 'contaminated' | 'unknown';
  apiConnectivity: 'connected' | 'partial' | 'disconnected';
  criticalIssues: string[];
  recommendations: string[];
}

export function AutoInvestigationSummary() {
  const { provider } = useEthers();
  const [summary, setSummary] = useState<InvestigationSummary | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAutoInvestigation = async () => {
    if (!provider) return;
    
    setIsAnalyzing(true);
    console.log('🔍 Starting automatic AssetDAO investigation...');
    
    try {
      const investigation: InvestigationSummary = {
        contractAccessibility: 'unknown' as any,
        dataConsistency: 'unknown',
        localStorageUsage: 'unknown',
        apiConnectivity: 'unknown' as any,
        criticalIssues: [],
        recommendations: []
      };

      // 1. Contract diagnostics
      const contractDiagnostics = await runFullContractDiagnostics(provider);
      
      if (contractDiagnostics.summary.criticalIssues.length === 0) {
        investigation.contractAccessibility = 'accessible';
      } else if (contractDiagnostics.summary.successfulMethods > 0) {
        investigation.contractAccessibility = 'partial';
      } else {
        investigation.contractAccessibility = 'inaccessible';
      }
      
      investigation.criticalIssues.push(...contractDiagnostics.summary.criticalIssues);

      // 2. Data source verification
      try {
        const dataVerification = await verifyProposalDataSources(provider);
        
        if (dataVerification.discrepancies.length === 0) {
          investigation.dataConsistency = 'consistent';
        } else {
          investigation.dataConsistency = 'inconsistent';
          investigation.criticalIssues.push('Data inconsistencies detected between sources');
        }
        
        if (dataVerification.mockDataDetected) {
          investigation.criticalIssues.push('Mock data detected in production environment');
        }
        
      } catch (err) {
        investigation.criticalIssues.push('Failed to verify data sources');
      }

      // 3. API connectivity check
      try {
        const apiResponse = await fetch('/api/protocol-proposals');
        if (apiResponse.ok) {
          investigation.apiConnectivity = 'connected';
        } else {
          investigation.apiConnectivity = 'partial';
          investigation.criticalIssues.push(`API returned status ${apiResponse.status}`);
        }
      } catch (err) {
        investigation.apiConnectivity = 'disconnected';
        investigation.criticalIssues.push('API endpoints not accessible');
      }

      // 4. Local storage analysis
      const localStorageKeys = Object.keys(localStorage);
      const assetDaoKeys = localStorageKeys.filter(key => 
        key.toLowerCase().includes('asset') || 
        key.toLowerCase().includes('proposal') ||
        key.toLowerCase().includes('vote')
      );
      
      if (assetDaoKeys.length === 0) {
        investigation.localStorageUsage = 'clean';
      } else {
        investigation.localStorageUsage = 'contaminated';
        investigation.criticalIssues.push(`Found ${assetDaoKeys.length} AssetDAO-related local storage entries`);
      }

      // 5. Generate recommendations
      if (investigation.contractAccessibility === 'inaccessible') {
        investigation.recommendations.push('Verify network connection and contract deployment');
      }
      
      if (investigation.dataConsistency === 'inconsistent') {
        investigation.recommendations.push('Review data transformation logic between contract and UI');
      }
      
      if (investigation.localStorageUsage === 'contaminated') {
        investigation.recommendations.push('Consider implementing local storage cleanup or migration');
      }
      
      if (investigation.apiConnectivity !== 'connected') {
        investigation.recommendations.push('Check API endpoint configuration and server status');
      }

      console.log('✅ Auto investigation completed:', investigation);
      setSummary(investigation);
      
    } catch (error: any) {
      console.error('❌ Auto investigation failed:', error);
      setSummary({
        contractAccessibility: 'inaccessible',
        dataConsistency: 'unknown',
        localStorageUsage: 'unknown',
        apiConnectivity: 'disconnected',
        criticalIssues: [`Investigation failed: ${error.message}`],
        recommendations: ['Check browser console for detailed error information']
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (provider) {
      // Run investigation after a short delay to let other components load
      const timer = setTimeout(runAutoInvestigation, 1000);
      return () => clearTimeout(timer);
    }
  }, [provider]);

  if (!summary && !isAnalyzing) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          AssetDAO Investigation Summary
          {isAnalyzing && <span className="text-sm font-normal">(Analyzing...)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isAnalyzing ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Running comprehensive analysis...</p>
          </div>
        ) : summary ? (
          <div className="space-y-4">
            {/* Status Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm font-medium mb-1">Contract Access</div>
                <Badge 
                  variant={summary.contractAccessibility === 'accessible' ? 'default' : 'destructive'}
                >
                  {summary.contractAccessibility}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium mb-1">Data Consistency</div>
                <Badge 
                  variant={summary.dataConsistency === 'consistent' ? 'default' : 'destructive'}
                >
                  {summary.dataConsistency}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium mb-1">Local Storage</div>
                <Badge 
                  variant={summary.localStorageUsage === 'clean' ? 'default' : 'destructive'}
                >
                  {summary.localStorageUsage}
                </Badge>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium mb-1">API Connectivity</div>
                <Badge 
                  variant={summary.apiConnectivity === 'connected' ? 'default' : 'destructive'}
                >
                  {summary.apiConnectivity}
                </Badge>
              </div>
            </div>

            {/* Critical Issues */}
            {summary.criticalIssues.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Critical Issues Found:</div>
                  <ul className="text-sm space-y-1">
                    {summary.criticalIssues.map((issue, idx) => (
                      <li key={idx}>• {issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Recommendations */}
            {summary.recommendations.length > 0 && (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  <div className="font-medium mb-1">Recommendations:</div>
                  <ul className="text-sm space-y-1">
                    {summary.recommendations.map((rec, idx) => (
                      <li key={idx}>• {rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {summary.criticalIssues.length === 0 && (
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  AssetDAO system appears to be functioning correctly with no critical issues detected.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default AutoInvestigationSummary;
