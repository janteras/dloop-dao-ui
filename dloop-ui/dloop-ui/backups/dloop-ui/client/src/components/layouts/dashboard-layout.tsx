'use client';

import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { SimpleConnectButton } from '@/components/features/wallet/simple-connect-button';
import { ConnectionIndicator } from '@/components/features/wallet/connection-indicator';

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

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
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
            <nav className="hidden md:flex items-center gap-6">
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
          <div className="flex items-center gap-4">
            {mounted && isConnected ? (
              <div className="flex items-center gap-4">
                <ConnectionIndicator />
                <SimpleConnectButton />
              </div>
            ) : (
              <SimpleConnectButton />
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6 md:py-8">{children}</div>
      </main>
      <footer className="border-t border-border bg-muted py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} D-LOOP Protocol. All rights
            reserved.
          </p>
          <nav className="flex flex-wrap items-center gap-4 justify-center md:justify-end">
            <a
              href="https://d-loop.io/uploads/d-loop-whitepaper.pdf"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Whitepaper
            </a>
            <a
              href="https://medium.com/@d-loop"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Medium
            </a>
            <a
              href="https://twitter.com/dloopDAO"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Twitter
            </a>
            <a
              href="https://linkedin.com/company/d-loop-io"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/d-loopDAO"
              target="_blank"
              rel="noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              GitHub
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}