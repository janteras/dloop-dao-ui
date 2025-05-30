'use client';

import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  BarChart4, 
  Brain, 
  Award, 
  Handshake,
  HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useContextualHelp } from '@/hooks/useContextualHelp';
import React from 'react';
import { useLocation as useLocationReactRouter, Link as LinkReactRouter } from 'react-router-dom';

// Navigation items with icons and tooltip content
const navItems = [
  { 
    id: 'dashboard',
    name: 'Dashboard', 
    href: '/', 
    icon: LayoutDashboard,
    label: 'Home',
  },
  { 
    id: 'asset-dao',
    name: 'Treasury DAO', 
    href: '/assetdao', 
    icon: Handshake,
    label: 'Treasury',
  },
  { 
    id: 'leaderboard',
    name: 'Leaderboard', 
    href: '/leaderboard', 
    icon: Award,
    label: 'Leaders',
  },
  { 
    id: 'ai-nodes',
    name: 'AI Nodes', 
    href: '/ai-nodes', 
    icon: Brain,
    label: 'AI Nodes',
  },
  { 
    id: 'protocol-dao',
    name: 'Protocol DAO', 
    href: '/protocol-dao', 
    icon: BarChart4,
    label: 'Protocol',
  },
];

export function MobileBottomNav() {
  const [location] = useLocation();
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const { showHelpPanel } = useContextualHelp();

  // Keep track of the active item based on location
  useEffect(() => {
    const currentItem = navItems.find(item => item.href === location);
    if (currentItem) {
      setActiveItem(currentItem.id);
    }
  }, [location]);

  // Help button to show contextual help
  const showHelpForCurrentSection = () => {
    showHelpPanel();
  };

  return (
    <>
      <div className={cn(
  "fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border p-2 flex justify-around items-center sm:hidden transition-all duration-300 ease-in-out",
  "touch-none select-none safe-bottom",

)}>
        <nav className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                to={item.href}
                className="relative flex flex-col items-center justify-center"
              >
                <div className={cn(
                  "flex flex-col items-center justify-center space-y-1 p-1 transition-colors",
                )}>
                  <div className="relative">
                    <Icon className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )} />
                    {isActive && (
                      <motion.div
                        layoutId="navIndicator"
                        className="absolute -bottom-1 left-0 right-0 h-1 bg-primary rounded-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                  <span className={cn(
                    "text-xs transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Help button - floats above the navigation */}
        <button 
          onClick={showHelpForCurrentSection}
          className="absolute -top-12 right-4 bg-primary text-primary-foreground p-2 rounded-full shadow-lg"
          aria-label="Show help for this section"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}
// Analysis: The provided change snippet attempts to replace the entire `navItems` array, but uses React component syntax (e.g., `<Home size={20} />`) which is incompatible with the existing `navItems` structure that uses `lucide-react` icons assigned directly to the `icon` property. The intention of the change is to ensure the mobile navigation uses the "Treasury DAO" terminology, but the change snippet will break the code. Since the original mobile navigation already uses Treasury DAO terminology, I am not making any changes to the file.