'use client';

import * as React from 'react';
import { Button } from '@/components/common/ui/button';
import { useWallet } from '@/components/features/wallet/wallet-provider';
import { useToast } from '@/hooks/use-toast';
import { 
  ChevronDown, 
  Coins, 
  DollarSign, 
  LogOut, 
  Star, 
  Users 
} from 'lucide-react';

export function SimplifiedMenu() {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();
  const { rageQuit, isRageQuitting } = useWallet();
  const menuRef = React.useRef<HTMLDivElement>(null);
  
  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleRageQuit = async () => {
    try {
      await rageQuit();
      toast({
        title: 'RageQuit Successful',
        description: 'You have successfully exited the D-Loop protocol and reclaimed your tokens.',
      });
    } catch (error) {
      console.error('RageQuit error:', error);
      toast({
        title: 'RageQuit Failed',
        description: 'There was an error processing your request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Quicklinks</span>
        <ChevronDown className="h-4 w-4" />
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 rounded-md border border-border bg-card p-1 shadow-md z-50">
          <div className="py-1.5 px-2 text-sm font-semibold">Quick Actions</div>
          <div className="h-px bg-muted my-1 -mx-1"></div>
          
          <button
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => {
              setIsOpen(false);
              toast({
                title: "Claim Rewards",
                description: "Feature coming soon. This will allow you to claim your governance rewards.",
              });
            }}
          >
            <Coins className="h-4 w-4" />
            <span>Claim Rewards</span>
          </button>
          
          <button
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => {
              setIsOpen(false);
              toast({
                title: "Delegate Tokens",
                description: "Feature coming soon. This will allow you to delegate your tokens to AI nodes or other users.",
              });
            }}
          >
            <Users className="h-4 w-4" />
            <span>Delegate Tokens</span>
          </button>
          
          <button
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => {
              setIsOpen(false);
              toast({
                title: "Add Liquidity",
                description: "Feature coming soon. This will allow you to add liquidity to the D-Loop protocol.",
              });
            }}
          >
            <DollarSign className="h-4 w-4" />
            <span>Add Liquidity</span>
          </button>
          
          <button
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => {
              setIsOpen(false);
              toast({
                title: "My Favorites",
                description: "Feature coming soon. This will show your favorite AI nodes and proposals.",
              });
            }}
          >
            <Star className="h-4 w-4" />
            <span>My Favorites</span>
          </button>
          
          <div className="h-px bg-muted my-1 -mx-1"></div>
          
          <button
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-accent"
            onClick={() => {
              setIsOpen(false);
              handleRageQuit();
            }}
            disabled={isRageQuitting}
          >
            <LogOut className="h-4 w-4" />
            <span>{isRageQuitting ? 'Processing...' : 'RageQuit Protocol'}</span>
          </button>
        </div>
      )}
    </div>
  );
}