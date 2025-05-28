/**
 * Wagmi Demo Navigation Component
 * 
 * This component adds a navigation link to the Wagmi demo page
 * and showcases both Ethers and Wagmi implementations side by side
 * for testing and comparison purposes.
 */

import React, { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useAppConfig } from '@/config/app-config';
import { Web3Button } from '@/components/web3/unified/Web3Button';
import { useFeatureFlag } from '@/config/feature-flags';

export default function WagmiDemoNav() {
  const [expanded, setExpanded] = useState(false);
  const { useWagmi, setUseWagmi } = useAppConfig();
  
  // Get feature flags
  const useUnifiedWeb3Button = useFeatureFlag('useUnifiedWeb3Button');
  const useUnifiedProposalCards = useFeatureFlag('useWagmiProposalCards');
  
  // Handle toggling the feature flags
  // For simplicity in this demo component, we'll use a workaround
  // with localStorage since we don't have access to the internal toggleFeatureFlag function
  const handleToggleFeature = (feature: string) => {
    // We know that feature flags are stored in localStorage under the key 'dloop-feature-flags'
    try {
      // Get current flags from localStorage
      const storedFlags = localStorage.getItem('dloop-feature-flags');
      if (storedFlags) {
        const flagsData = JSON.parse(storedFlags);
        // Toggle the feature flag value
        if (flagsData.state && feature in flagsData.state) {
          flagsData.state[feature] = !flagsData.state[feature];
          // Save back to localStorage
          localStorage.setItem('dloop-feature-flags', JSON.stringify(flagsData));
          // Force a reload to apply the changes
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error toggling feature flag:', error);
    }
  };
  
  // If not expanded, just show the button
  if (!expanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setExpanded(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          Wagmi Demo
        </Button>
      </div>
    );
  }
  
  // Expanded view with migration controls
  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="w-full border border-blue-800/30 bg-slate-900/90 backdrop-blur-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg text-white">Migration Controls</CardTitle>
            <Badge 
              variant="outline" 
              className={`${useWagmi ? 'bg-green-900/20 text-green-500' : 'bg-orange-900/20 text-orange-500'}`}
            >
              {useWagmi ? 'Using Wagmi' : 'Using Ethers'}
            </Badge>
          </div>
          <CardDescription className="text-gray-400">
            Toggle between Ethers and Wagmi implementations
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 py-0">
          {/* Global Implementation Toggle */}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-white">Global Migration</p>
              <p className="text-xs text-gray-400">Switches all components at once</p>
            </div>
            <Switch 
              checked={useWagmi} 
              onCheckedChange={setUseWagmi}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
          
          <div className="h-px bg-slate-800 my-2" />
          
          {/* Feature Flag Toggles */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-white">Component Migration</p>
            
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-400">Unified Web3 Button</p>
              <Switch 
                checked={useUnifiedWeb3Button} 
                onCheckedChange={() => handleToggleFeature('useUnifiedWeb3Button')}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-400">Unified Proposal Cards</p>
              <Switch 
                checked={useUnifiedProposalCards} 
                onCheckedChange={() => handleToggleFeature('useWagmiProposalCards')}
                className="data-[state=checked]:bg-green-600"
              />
            </div>
          </div>
          
          <div className="h-px bg-slate-800 my-2" />
          
          {/* Component Preview */}
          <div>
            <p className="text-sm font-medium text-white mb-2">Preview Button Component</p>
            <div className="bg-slate-800 p-3 rounded-md flex justify-center items-center">
              <Web3Button 
                showBalance={true}
                size="sm"
                useWagmi={useWagmi}
              />
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setExpanded(false)}
            className="text-xs"
          >
            Minimize
          </Button>
          
          <Link href="/wagmi-demo">
            <Button 
              size="sm" 
              className="text-xs bg-blue-600 hover:bg-blue-700"
            >
              Full Demo Page
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
