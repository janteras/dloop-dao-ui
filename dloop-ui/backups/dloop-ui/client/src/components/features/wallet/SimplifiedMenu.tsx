import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useWallet } from './simplified-wallet-provider';
import { ChevronDown, LogOut, Send, ExternalLink } from 'lucide-react';
import RageQuitModal from '@/components/modals/RageQuitModal';

// Use the portfolio hook to get real data
import { useDAOPortfolio } from '@/hooks/useDAOPortfolio';

const SimplifiedMenu = () => {
  const { address } = useWallet();
  const { portfolio } = useDAOPortfolio();
  const [rageQuitOpen, setRageQuitOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            Quick Actions
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2"
            onClick={() => window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            View on Etherscan
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2"
            onClick={() => window.location.href = '/leaderboard'}
          >
            <Send className="h-4 w-4" />
            Manage Delegations
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex cursor-pointer items-center gap-2 text-destructive hover:text-destructive"
            onClick={() => setRageQuitOpen(true)}
          >
            <LogOut className="h-4 w-4" />
            RageQuit Protocol
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RageQuitModal
        isOpen={rageQuitOpen}
        onClose={() => setRageQuitOpen(false)}
        portfolioData={portfolio}
      />
    </>
  );
};

export default SimplifiedMenu;