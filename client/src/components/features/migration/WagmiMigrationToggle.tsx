import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAppConfig } from '@/config/app-config';
import { useToast } from '@/hooks/use-toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { InfoIcon } from 'lucide-react';

/**
 * Migration toggle component that allows switching between Ethers and Wagmi implementations
 * Also displays migration progress
 */
export function WagmiMigrationToggle() {
  const { useWagmi, setUseWagmi, migratedComponents } = useAppConfig();
  const { toast } = useToast();

  // Core components that need migration
  const CORE_COMPONENTS = [
    'WalletConnection',
    'TokenHandling',
    'ContractInteractions',
    'ProposalSystem',
    'VotingSystem'
  ];

  // Calculate migration progress
  const migrationProgress = Math.round(
    (migratedComponents.length / CORE_COMPONENTS.length) * 100
  );

  const handleToggle = (checked: boolean) => {
    setUseWagmi(checked);
    
    toast({
      title: checked ? "Wagmi Implementation Activated" : "Ethers Implementation Activated",
      description: checked 
        ? "Now using Wagmi for blockchain interactions" 
        : "Reverted to Ethers implementation",
      duration: 3000,
    });
  };

  return (
    <div className="flex flex-col space-y-2 bg-dark-bg/70 border border-dark-gray rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <Switch
              id="wagmi-toggle"
              checked={useWagmi}
              onCheckedChange={handleToggle}
            />
            <Label htmlFor="wagmi-toggle" className="ml-2 text-sm text-gray-300">
              {useWagmi ? 'Using Wagmi' : 'Using Ethers v6'}
            </Label>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-gray-400 hover:text-white">
                <InfoIcon size={14} />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-dark-bg border-dark-gray text-white">
              <div className="space-y-2">
                <h3 className="font-medium">Migration Progress</h3>
                <p className="text-sm text-gray-400">
                  Gradually migrating from Ethers v6 to Wagmi for improved React integration
                  and caching capabilities.
                </p>
                
                <div className="space-y-1">
                  <h4 className="text-xs text-gray-400">Component Status</h4>
                  <div className="space-y-1">
                    {CORE_COMPONENTS.map(component => (
                      <div key={component} className="flex justify-between items-center">
                        <span className="text-xs">{component}</span>
                        <Badge
                          className={migratedComponents.includes(component)
                            ? "bg-green-900/20 text-green-500 border-green-800/30"
                            : "bg-gray-800/20 text-gray-400 border-gray-700/30"}
                        >
                          {migratedComponents.includes(component) ? 'Migrated' : 'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <Badge 
          className={
            migrationProgress >= 80 ? "bg-green-900/20 text-green-500" :
            migrationProgress >= 40 ? "bg-amber-900/20 text-amber-500" :
            "bg-blue-900/20 text-blue-500"
          }
        >
          {migrationProgress}% Complete
        </Badge>
      </div>
    </div>
  );
}
