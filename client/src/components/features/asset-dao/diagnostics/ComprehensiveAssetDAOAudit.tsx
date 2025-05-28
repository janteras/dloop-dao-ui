
/**
 * Comprehensive AssetDAO Investigation Dashboard
 * 
 * End-to-end investigation of AssetDAO voting system from smart contracts to UI
 * Identifies data sources, local storage usage, and consistency issues
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEthers } from '@/contexts/EthersContext';
import { getContract } from '@/lib/contracts';
import { verifyProposalDataSources } from '@/utils/assetdao-data-verification';
import { auditLocalStorage } from '@/utils/local-storage-audit';
import { AlertTriangle, CheckCircle, Database, HardDrive, Network, Code } from 'lucide-react';

interface ContractInvestigation {
  address: string;
  abi: any[];
  methods: string[];
  events: string[];
  accessible: boolean;
  error?: string;
}

interface VotingFlowAnalysis {
  proposalCount: number;
  sampleProposalData: any;
  votingMethods: string[];
  dataConsistency: 'consistent' | 'inconsistent' | 'unknown';
  localStorageUsage: string[];
  apiEndpoints: string[];
}

export function ComprehensiveAssetDAOAudit() {
  const { provider, signer } = useEthers();
  const [contractInvestigation, setContractInvestigation] = useState<ContractInvestigation | null>(null);
  const [votingFlowAnalysis, setVotingFlowAnalysis] = useState<VotingFlowAnalysis | null>(null);
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [apiEndpointResults, setApiEndpointResults] = useState<any[]>([]);

  const investigateSmartContract = async () => {
    if (!provider) return;
    
    try {
      console.log('🔍 Starting AssetDAO smart contract investigation...');
      
      const assetDAO = getContract('AssetDAO', provider);
      const contractCode = await provider.getCode(assetDAO.target as string);
      
      // Test contract accessibility
      let accessible = false;
      let methods: string[] = [];
      let events: string[] = [];
      let error: string | undefined;
      
      try {
        // Try to call a simple method
        const proposalCount = await assetDAO.getProposalCount();
        accessible = true;
        console.log('📊 Contract accessible, proposal count:', proposalCount.toString());
        
        // Extract methods and events from ABI
        const abi = assetDAO.interface.fragments;
        methods = abi.filter(f => f.type === 'function').map(f => f.name);
        events = abi.filter(f => f.type === 'event').map(f => f.name);
        
      } catch (err: any) {
        error = err.message;
        console.error('❌ Contract access error:', err);
      }
      
      setContractInvestigation({
        address: assetDAO.target as string,
        abi: assetDAO.interface.fragments,
        methods,
        events,
        accessible,
        error
      });
      
    } catch (err: any) {
      console.error('❌ Contract investigation failed:', err);
      setContractInvestigation({
        address: 'unknown',
        abi: [],
        methods: [],
        events: [],
        accessible: false,
        error: err.message
      });
    }
  };

  const investigateVotingFlow = async () => {
    if (!provider) return;
    
    try {
      console.log('🗳️ Investigating voting flow end-to-end...');
      
      // 1. Check local storage for AssetDAO data
      const localStorageAudit = auditLocalStorage();
      const assetDaoKeys = localStorageAudit.filter(item => 
        item.key.toLowerCase().includes('asset') || 
        item.key.toLowerCase().includes('proposal') ||
        item.key.toLowerCase().includes('vote')
      );
      
      // 2. Test API endpoints
      const apiEndpoints = [
        '/api/protocol-proposals',
        '/api/protocol-metrics',
        '/api/config'
      ];
      
      const apiResults = [];
      for (const endpoint of apiEndpoints) {
        try {
          const response = await fetch(endpoint);
          const data = await response.json();
          apiResults.push({
            endpoint,
            status: response.status,
            data: data,
            timestamp: new Date().toISOString()
          });
          console.log(`📡 API ${endpoint}:`, response.status, data);
        } catch (err) {
          apiResults.push({
            endpoint,
            status: 'error',
            error: err.message,
            timestamp: new Date().toISOString()
          });
        }
      }
      
      setApiEndpointResults(apiResults);
      
      // 3. Contract data analysis
      let proposalCount = 0;
      let sampleProposalData = null;
      let votingMethods: string[] = [];
      
      try {
        const assetDAO = getContract('AssetDAO', provider);
        proposalCount = Number(await assetDAO.getProposalCount());
        
        if (proposalCount > 0) {
          sampleProposalData = await assetDAO.getProposal(0);
          console.log('📋 Sample proposal data:', sampleProposalData);
        }
        
        // Extract voting-related methods
        const abi = assetDAO.interface.fragments;
        votingMethods = abi
          .filter(f => f.type === 'function' && 
            (f.name.includes('vote') || f.name.includes('Vote') || 
             f.name.includes('proposal') || f.name.includes('Proposal')))
          .map(f => f.name);
          
      } catch (err) {
        console.error('❌ Contract data analysis failed:', err);
      }
      
      // 4. Data consistency check
      const verificationReport = await verifyProposalDataSources(provider);
      let dataConsistency: 'consistent' | 'inconsistent' | 'unknown' = 'unknown';
      
      if (verificationReport.discrepancies.length === 0) {
        dataConsistency = 'consistent';
      } else if (verificationReport.discrepancies.length > 0) {
        dataConsistency = 'inconsistent';
      }
      
      setVotingFlowAnalysis({
        proposalCount,
        sampleProposalData,
        votingMethods,
        dataConsistency,
        localStorageUsage: assetDaoKeys.map(k => k.key),
        apiEndpoints: apiEndpoints
      });
      
    } catch (err: any) {
      console.error('❌ Voting flow investigation failed:', err);
    }
  };

  const runCompleteInvestigation = async () => {
    setIsInvestigating(true);
    try {
      await Promise.all([
        investigateSmartContract(),
        investigateVotingFlow()
      ]);
    } finally {
      setIsInvestigating(false);
    }
  };

  useEffect(() => {
    if (provider) {
      runCompleteInvestigation();
    }
  }, [provider]);

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Comprehensive AssetDAO Investigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Button 
              onClick={runCompleteInvestigation}
              disabled={isInvestigating || !provider}
            >
              {isInvestigating ? 'Investigating...' : 'Run Investigation'}
            </Button>
            
            {provider && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Network className="w-3 h-3" />
                Provider Connected
              </Badge>
            )}
          </div>
          
          <Tabs defaultValue="contracts" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="contracts">Smart Contracts</TabsTrigger>
              <TabsTrigger value="voting">Voting Flow</TabsTrigger>
              <TabsTrigger value="storage">Local Storage</TabsTrigger>
              <TabsTrigger value="apis">API Endpoints</TabsTrigger>
            </TabsList>
            
            <TabsContent value="contracts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    AssetDAO Contract Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {contractInvestigation ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        {contractInvestigation.accessible ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-medium">
                          Contract {contractInvestigation.accessible ? 'Accessible' : 'Not Accessible'}
                        </span>
                      </div>
                      
                      <div className="text-sm space-y-2">
                        <div><strong>Address:</strong> {contractInvestigation.address}</div>
                        <div><strong>Methods Found:</strong> {contractInvestigation.methods.length}</div>
                        <div><strong>Events Found:</strong> {contractInvestigation.events.length}</div>
                      </div>
                      
                      {contractInvestigation.error && (
                        <Alert variant="destructive">
                          <AlertTriangle className="w-4 h-4" />
                          <AlertDescription>{contractInvestigation.error}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Available Methods</h4>
                          <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                            {contractInvestigation.methods.map((method, idx) => (
                              <div key={idx} className="bg-muted p-1 rounded">{method}</div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Available Events</h4>
                          <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                            {contractInvestigation.events.map((event, idx) => (
                              <div key={idx} className="bg-muted p-1 rounded">{event}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>No contract investigation data available</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="voting" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>End-to-End Voting Flow</CardTitle>
                </CardHeader>
                <CardContent>
                  {votingFlowAnalysis ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium">Proposal Count</div>
                          <div className="text-2xl font-bold">{votingFlowAnalysis.proposalCount}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Data Consistency</div>
                          <Badge 
                            variant={votingFlowAnalysis.dataConsistency === 'consistent' ? 'default' : 'destructive'}
                          >
                            {votingFlowAnalysis.dataConsistency}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Voting Methods</h4>
                        <div className="text-xs space-y-1">
                          {votingFlowAnalysis.votingMethods.map((method, idx) => (
                            <div key={idx} className="bg-muted p-1 rounded">{method}</div>
                          ))}
                        </div>
                      </div>
                      
                      {votingFlowAnalysis.sampleProposalData && (
                        <div>
                          <h4 className="font-medium mb-2">Sample Proposal Data</h4>
                          <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                            {JSON.stringify(votingFlowAnalysis.sampleProposalData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>No voting flow analysis available</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="storage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4" />
                    Local Storage Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {votingFlowAnalysis?.localStorageUsage ? (
                    <div className="space-y-2">
                      {votingFlowAnalysis.localStorageUsage.length > 0 ? (
                        <>
                          <Alert>
                            <AlertTriangle className="w-4 h-4" />
                            <AlertDescription>
                              Found {votingFlowAnalysis.localStorageUsage.length} AssetDAO-related local storage entries
                            </AlertDescription>
                          </Alert>
                          <div className="text-xs space-y-1">
                            {votingFlowAnalysis.localStorageUsage.map((key, idx) => (
                              <div key={idx} className="bg-muted p-1 rounded">{key}</div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          No AssetDAO-related local storage detected
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>No local storage analysis available</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="apis" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>API Endpoint Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {apiEndpointResults.map((result, idx) => (
                      <div key={idx} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{result.endpoint}</span>
                          <Badge 
                            variant={result.status === 200 ? 'default' : 'destructive'}
                          >
                            {result.status}
                          </Badge>
                        </div>
                        
                        {result.data && (
                          <details className="text-xs">
                            <summary className="cursor-pointer mb-1">View Response Data</summary>
                            <pre className="bg-muted p-2 rounded overflow-x-auto">
                              {JSON.stringify(result.data, null, 2)}
                            </pre>
                          </details>
                        )}
                        
                        {result.error && (
                          <div className="text-red-600 text-xs">{result.error}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default ComprehensiveAssetDAOAudit;
