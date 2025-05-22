import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Beaker, ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import { useAppConfig, MigrationFeatureFlag } from "@/config/app-config";
import { useState, useEffect } from "react";
import { useMigrationAccess } from "@/hooks/useMigrationAccess";

/**
 * WagmiMigrationNav
 * 
 * A navigation component that provides easy access to both the original
 * Ethers-based implementations and the Wagmi-migrated alternatives during
 * the migration testing phase.
 * 
 * This component is only visible to admin users (0x3639D1F746A977775522221f53D0B1eA5749b8b9)
 * or if the feature flag for developer navigation is enabled.
 */
const WagmiMigrationNav = () => {
  const [location] = useLocation();
  const { address, isConnected } = useUnifiedWallet();
  const { featureFlags } = useAppConfig();
  const { hasDashboardAccess } = useMigrationAccess();
  const [shouldRender, setShouldRender] = useState(false);
  
  // Check if the current user should see the navigation
  useEffect(() => {
    // Only render for admins or if the dev navigation feature flag is enabled
    const showDevNav = featureFlags[MigrationFeatureFlag.WALLET_CONNECTION] || false;
    const isAdmin = hasDashboardAccess;
    
    setShouldRender(isAdmin || showDevNav);
  }, [address, isConnected, featureFlags, hasDashboardAccess]);
  
  // If user doesn't have access, don't render anything
  if (!shouldRender) return null;
  
  const isWagmiRoute = location.includes('wagmi');
  const isAssetDaoPage = location.includes('asset-dao') || location === '/wagmi-asset-dao';
  
  // Determine where each button should navigate
  const originalRoute = isAssetDaoPage ? '/asset-dao' : '/';
  const wagmiRoute = isAssetDaoPage ? '/wagmi-asset-dao' : '/wagmi-demo';
  const dashboardRoute = '/migration-dashboard';
  
  return (
    <div className="fixed bottom-6 right-6 z-50 flex space-x-2">
      {/* Migration Dashboard Link */}
      <Link href={dashboardRoute}>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center shadow-lg bg-gray-800/70 hover:bg-gray-800"
        >
          <Lock className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </Link>
      
      {/* Toggle between original and Wagmi versions */}
      {isWagmiRoute ? (
        <Link href={originalRoute}>
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex items-center shadow-lg"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Original Version
          </Button>
        </Link>
      ) : (
        <Link href={wagmiRoute}>
          <Button 
            variant="secondary" 
            size="sm" 
            className="flex items-center shadow-lg bg-purple-800 hover:bg-purple-700 border border-purple-600"
          >
            <Beaker className="mr-2 h-4 w-4" />
            Wagmi Version
            <Badge variant="outline" className="ml-2 text-xs px-1 py-0 border-purple-400">New</Badge>
          </Button>
        </Link>
      )}
    </div>
  );
};

export default WagmiMigrationNav;
