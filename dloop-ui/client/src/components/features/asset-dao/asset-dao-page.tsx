import { AssetDAODashboard } from './asset-dao-dashboard';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { useAssetDAOInfo } from '@/hooks/useAssetDAOInfo';

/**
 * Complete AssetDAO page that incorporates all the necessary components
 * for interacting with the AssetDAO smart contract
 */
export function AssetDAOPage() {
  const { isConnected, address, connect } = useWallet();
  const { isLoading } = useAssetDAOInfo();

  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
      <div className="flex flex-col gap-4 sm:gap-6">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center p-6 sm:p-8 bg-card text-card-foreground dark:bg-card/95 rounded-lg shadow-sm border border-border/50 hover:border-border/80 transition-colors">
            <h2 className="text-xl sm:text-2xl font-bold mb-2 text-foreground">Connect Wallet</h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-4 text-center max-w-md">
              Connect your wallet to interact with the AssetDAO governance features.
            </p>
            <Button 
              onClick={connect} 
              size="lg"
              className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground transition-colors"
            >
              Connect Wallet
            </Button>
          </div>
        ) : (
          <AssetDAODashboard />
        )}
      </div>
    </div>
  );
}
