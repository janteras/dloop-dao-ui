import { useState } from "react";
import WagmiAssetDAO from "@/components/assetdao/WagmiAssetDAO";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft } from "lucide-react";
import { Link } from "wouter";

/**
 * WagmiAssetDaoPage
 * 
 * This page demonstrates the migration from Ethers to Wagmi.
 * It allows switching between the original implementation and the new Wagmi implementation
 * for testing and verification purposes during the migration process.
 */
const WagmiAssetDaoPage = () => {
  // This flag allows toggling between the fully migrated version and the original
  // In a production app, this would be removed after migration is complete
  const [showFullyMigrated, setShowFullyMigrated] = useState(true);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Link href="/asset-dao">
              <Button variant="ghost" className="mr-2">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Original AssetDAO
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Wagmi Asset DAO - Migration Test</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="migration-mode" 
              checked={showFullyMigrated}
              onCheckedChange={setShowFullyMigrated}
            />
            <Label htmlFor="migration-mode">
              {showFullyMigrated ? "Fully Migrated" : "Hybrid Mode"}
            </Label>
          </div>
        </div>
        
        <div className="bg-dark-gray/30 p-4 rounded-md mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">Migration Mode: {showFullyMigrated ? "Fully Migrated" : "Hybrid"}</h2>
          <p className="text-gray-300 text-sm">
            {showFullyMigrated 
              ? "Viewing fully migrated version using Wagmi hooks for all operations. This version demonstrates the end goal of the migration."
              : "Viewing hybrid implementation that uses some Ethers.js components with Wagmi hooks. This represents an intermediate migration state."}
          </p>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-white">Migration Improvements:</h3>
            <ul className="text-sm text-gray-300 mt-2 list-disc list-inside space-y-1">
              <li>Better React state management with Wagmi's hooks</li>
              <li>Properly truncated Ethereum addresses with copy functionality</li>
              <li>Enhanced token symbol mapping and amount formatting</li>
              <li>Improved error handling and network validation</li>
              <li>Fixed proposal type mapping issues</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* The actual component - fully migrated version */}
      {showFullyMigrated ? (
        <WagmiAssetDAO />
      ) : (
        <div className="text-center p-8 border border-dark-gray rounded-lg">
          <h3 className="text-xl font-semibold text-white mb-2">Hybrid Mode</h3>
          <p className="text-gray mb-4">This would show a version that uses a mix of Ethers and Wagmi components</p>
          <Button 
            variant="default" 
            onClick={() => setShowFullyMigrated(true)}
          >
            Switch to Fully Migrated Version
          </Button>
        </div>
      )}
    </div>
  );
};

export default WagmiAssetDaoPage;
