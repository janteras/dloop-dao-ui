import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useWeb3ModalAccount, useWeb3ModalProvider } from '@web3modal/ethers/react';
import { ethers } from 'ethers';
import AssetDAODebugger from '@/services/assetDaoDebugger';
import { Loader2 } from 'lucide-react';

export function AssetDAODebugPanel() {
  const { address, isConnected } = useWeb3ModalAccount();
  const { walletProvider } = useWeb3ModalProvider();
  const [tokenAddress, setTokenAddress] = useState('0x1c7d4b196cb0c7b01d743fbc6116a902379c7238'); // Default USDC address
  const [amount, setAmount] = useState('1');
  const [diagnosisResult, setDiagnosisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runDiagnosis = async () => {
    if (!isConnected || !walletProvider) {
      setDiagnosisResult('Please connect your wallet first.');
      return;
    }

    setIsAnalyzing(true);
    setDiagnosisResult('Running contract diagnostics...');

    try {
      const provider = new ethers.BrowserProvider(walletProvider);
      const signer = await provider.getSigner();
      
      // Convert amount to the proper format (assuming 6 decimals for USDC)
      const parsedAmount = ethers.parseUnits(amount, 6);
      
      // Run the diagnostic
      const result = await AssetDAODebugger.diagnoseProposalIssue(
        signer,
        tokenAddress,
        parsedAmount
      );
      
      setDiagnosisResult(result);
    } catch (error) {
      console.error('Error running diagnosis:', error);
      setDiagnosisResult(`Error running diagnosis: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle>AssetDAO Contract Debugger</CardTitle>
        <CardDescription>
          This tool will help diagnose why proposal submissions are failing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="token">Token Address</Label>
            <Input
              id="token"
              placeholder="0x1c7d4b196cb0c7b01d743fbc6116a902379c7238"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              The token address you're trying to create a proposal for
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              placeholder="1"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              The token amount for the proposal
            </p>
          </div>
          <Button 
            onClick={runDiagnosis} 
            disabled={isAnalyzing || !isConnected}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Contract...
              </>
            ) : (
              'Run Diagnostics'
            )}
          </Button>
          {diagnosisResult && (
            <div className="mt-4">
              <Label htmlFor="result">Diagnosis Result</Label>
              <Textarea
                id="result"
                className="font-mono text-sm h-96 whitespace-pre"
                value={diagnosisResult}
                readOnly
              />
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <p className="text-sm text-muted-foreground">
          This tool performs a deep analysis of the AssetDAO contract to identify why your proposal submissions
          are failing. It checks for common issues like voting power requirements, contract compatibility, and permissions.
        </p>
      </CardFooter>
    </Card>
  );
}
