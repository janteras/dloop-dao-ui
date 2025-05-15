'use client';

import * as React from 'react';
import { Button } from '@/components/common/ui/button';
// Import dropdown components directly since we're having issues with the path
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

// Quick implementation of dropdown components
const DropdownMenu = DropdownMenuPrimitive.Root;
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
import { ChevronDown, Coins, DollarSign, LogOut, Star, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/components/features/wallet/wallet-provider';

export const QuicklinksMenu = () => {
  const { toast } = useToast();
  const { rageQuit, isRageQuitting } = useWallet();
  
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <span>Quicklinks</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            toast({
              title: "Claim Rewards",
              description: "Feature coming soon. This will allow you to claim your governance rewards.",
            });
          }}
        >
          <Coins className="h-4 w-4" />
          <span>Claim Rewards</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            toast({
              title: "Delegate Tokens",
              description: "Feature coming soon. This will allow you to delegate your tokens to AI nodes or other users.",
            });
          }}
        >
          <Users className="h-4 w-4" />
          <span>Delegate Tokens</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            toast({
              title: "Add Liquidity",
              description: "Feature coming soon. This will allow you to add liquidity to the D-Loop protocol.",
            });
          }}
        >
          <DollarSign className="h-4 w-4" />
          <span>Add Liquidity</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            toast({
              title: "My Favorites",
              description: "Feature coming soon. This will show your favorite AI nodes and proposals.",
            });
          }}
        >
          <Star className="h-4 w-4" />
          <span>My Favorites</span>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="flex items-center gap-2 cursor-pointer text-destructive"
          onClick={handleRageQuit}
          disabled={isRageQuitting}
        >
          <LogOut className="h-4 w-4" />
          <span>{isRageQuitting ? 'Processing...' : 'RageQuit Protocol'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};