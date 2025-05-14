import React, { useState } from 'react';
import { useInfrastructureStatus } from '@/hooks/useInfrastructureStatus';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Settings, 
  ArrowRight,
  Info,
  ShieldCheck
} from 'lucide-react';
import { 
  Alert,
  AlertDescription,
  AlertTitle 
} from '@/components/common/ui/alert';
import { Button } from '@/components/common/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/common/ui/card";

/**
 * Component that displays the status of critical infrastructure services
 * and provides guidance when they are not properly configured
 */
export function InfrastructureStatus() {
  const { isInfuraConnected, isWalletConnectConfigured, isLoading, error } = useInfrastructureStatus();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    // Force page refresh to retry connections
    window.location.reload();
  };

  if (isLoading) {
    return (
      <Card className="w-full border-border bg-background/50 backdrop-blur-sm">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <div className="animate-spin h-4 w-4 border-t-2 border-primary rounded-full"></div>
            <span>Checking Infrastructure</span>
          </CardTitle>
          <CardDescription>
            Verifying connection to Ethereum network and wallet services...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-pulse h-2 w-2 rounded-full bg-primary"></div>
              <span>Testing Infura API connection</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-pulse h-2 w-2 rounded-full bg-primary"></div>
              <span>Verifying WalletConnect configuration</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If both services are up, show a success message that can be dismissed
  if (isInfuraConnected && isWalletConnectConfigured) {
    return (
      <Alert className="bg-success/10 border-success text-success">
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>All Systems Operational</AlertTitle>
        <AlertDescription className="mt-2">
          Successfully connected to Ethereum Sepolia testnet.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full border-border bg-background/95 backdrop-blur-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-medium flex items-center gap-2 text-amber-500">
          <AlertTriangle className="h-5 w-5" />
          <span>Connection Issues Detected</span>
        </CardTitle>
        <CardDescription>
          We found problems with your blockchain connection settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isInfuraConnected && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h3 className="font-medium">Infura API Connection Issue</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  We can't connect to the Ethereum Sepolia testnet. This prevents interactions with the blockchain.
                </p>
                
                <div className="mt-3 bg-muted/50 p-3 rounded-lg border border-border">
                  <h4 className="text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Info className="h-3 w-3" />
                    <span>Troubleshooting Information</span>
                  </h4>
                  <ul className="mt-2 text-xs space-y-1.5 text-muted-foreground">
                    <li className="flex gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>Check that your Infura API key is valid and has access to Sepolia testnet</span>
                    </li>
                    <li className="flex gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>Verify your Infura project settings have CORS configured properly</span>
                    </li>
                    <li className="flex gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>Ensure your Infura API key hasn't reached its request limits</span>
                    </li>
                  </ul>
                </div>

                {error && (
                  <div className="mt-3 p-2 bg-destructive/10 border border-destructive/20 rounded text-xs font-mono text-destructive/90 overflow-auto max-h-20">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!isWalletConnectConfigured && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-medium">WalletConnect Integration Issue</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  WalletConnect v2 is not properly configured. Some wallet connection methods may not work correctly.
                </p>
                
                <div className="mt-3 bg-muted/50 p-3 rounded-lg border border-border">
                  <h4 className="text-xs uppercase tracking-wider font-semibold flex items-center gap-1.5">
                    <Info className="h-3 w-3" />
                    <span>Resolution Steps</span>
                  </h4>
                  <ul className="mt-2 text-xs space-y-1.5 text-muted-foreground">
                    <li className="flex gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>Obtain a WalletConnect Project ID from <a href="https://cloud.walletconnect.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">WalletConnect Cloud</a></span>
                    </li>
                    <li className="flex gap-1.5">
                      <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>Ensure the Project ID is correctly configured in your environment</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1"
          onClick={handleRetry}
          disabled={isRetrying}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          {isRetrying ? 'Retrying...' : 'Retry Connection'}
        </Button>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>API keys are stored securely</span>
        </div>
      </CardFooter>
    </Card>
  );
}