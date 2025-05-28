'use client';

import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { SimpleConnectButton } from '@/components/features/wallet/simple-connect-button';
import { ConnectionIndicator } from '@/components/features/wallet/connection-indicator';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { EnhancedFooter } from '@/components/layout/EnhancedFooter';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ContextualHelpTooltip } from '@/components/common/ContextualHelpTooltip';
import WagmiMigrationNav from '@/components/features/wagmi/WagmiMigrationNav';
import { Web3Button } from '@/components/web3/unified/Web3Button';
import { useFeatureFlag } from '@/config/feature-flags';
import { useAppConfig } from '@/config/app-config';

// Navigation items ordered according to UX feature hierarchy priority
const navItems = [
  { name: 'Dashboard', href: '/' },
  { name: 'Asset DAO', href: '/asset-dao', priority: 1 },
  { name: 'Delegations', href: '/delegations', priority: 2 },
  { name: 'Leaderboard', href: '/leaderboard', priority: 3 },
  { name: 'AI Nodes', href: '/ai-nodes', priority: 4 },
  { name: 'Protocol DAO', href: '/protocol-dao', priority: 5 },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { toast } = useToast();
  const { isConnected } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [location] = useLocation();
  // Move feature flag hooks to the top level to avoid React hooks rule violations
  const useUnifiedWeb3Button = useFeatureFlag('useUnifiedWeb3Button');
  const { useWagmi } = useAppConfig();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-8 w-auto">
                <img 
                  src="https://d-loop.io/images/d-loop.png" 
                  alt="D-Loop Logo" 
                  className="h-full w-auto"
                />
              </div>
              <span className="hidden sm:inline-block font-bold text-xl">D-LOOP</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    location === item.href
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <ThemeToggle variant="animated" />
            {mounted && (
              useUnifiedWeb3Button ? (
                <Web3Button 
                  showBalance={true} 
                  showNetwork={true}
                  size="md"
                  customActions={[
                    {
                      label: "View on Etherscan",
                      onClick: () => {
                        // This would be handled by the Web3Button component
                      }
                    }
                  ]}
                />
              ) : (
                isConnected ? (
                  <div className="flex items-center gap-3 sm:gap-4">
                    <ConnectionIndicator />
                    <SimpleConnectButton />
                  </div>
                ) : (
                  <SimpleConnectButton />
                )
              )
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-6 md:py-8">{children}</div>
      </main>
      {/* Add bottom padding on mobile to account for the bottom navigation */}
      <div className="pb-16 md:pb-0">
        {/* Import the new enhanced footer */}
        <EnhancedFooter />
      </div>
      {/* Add the mobile bottom navigation */}
      <MobileBottomNav />
      
      {/* Add the contextual help tooltip for mobile */}
      <ContextualHelpTooltip />
      
      {/* Add the Wagmi migration navigation button */}
      <WagmiMigrationNav />
    </div>
  );
}