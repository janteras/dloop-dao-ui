import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, ArrowRight } from 'lucide-react';
import { getContract } from '@/lib/contracts';
import { Link } from 'wouter';

interface VoteRequirementsCheckProps {
  onRequirementsMet?: () => void;
}

/**
 * Component that checks if a user has delegated tokens required for voting
 * Shows helpful messages and actions if requirements are not met
 */
export function VoteRequirementsCheck({ onRequirementsMet }: VoteRequirementsCheckProps) {
  const { isConnected, address, signer } = useWallet();
  const [hasVotingEligibility, setHasVotingEligibility] = useState<boolean | null>(null);
  const [delegatedAmount, setDelegatedAmount] = useState<string>('0');
  const [walletAmount, setWalletAmount] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  // Check if the user has voting eligibility (either wallet holdings or delegated tokens)
  useEffect(() => {
    const checkVotingEligibility = async () => {
      if (!isConnected || !address || !signer) {
        setHasVotingEligibility(false);
        return;
      }

      try {
        setLoading(true);
        const dloopToken = getContract('DLoopToken', signer);
        
        // Check wallet balance
        const balance = await dloopToken.balanceOf(address);
        const formattedBalance = ethers.formatEther(balance);
        setWalletAmount(formattedBalance);
        
        // Check if tokens are delegated to the user
        const delegated = await dloopToken.getTotalDelegatedToAmount(address);
        const formattedDelegated = ethers.formatEther(delegated);
        setDelegatedAmount(formattedDelegated);
        
        // User can vote if they have either wallet holdings OR delegated tokens
        const walletTokens = parseFloat(formattedBalance);
        const delegatedTokens = parseFloat(formattedDelegated);
        const totalVotingPower = walletTokens + delegatedTokens;
        const hasEligibility = totalVotingPower > 0;
        
        console.log(`Voting eligibility check: Wallet=${walletTokens}, Delegated=${delegatedTokens}, Total=${totalVotingPower}`);
        
        setHasVotingEligibility(hasEligibility);
        
        if (hasEligibility && onRequirementsMet) {
          onRequirementsMet();
        }
      } catch (error) {
        console.error('Error checking voting eligibility:', error);
        setHasVotingEligibility(false);
      } finally {
        setLoading(false);
      }
    };

    checkVotingEligibility();
  }, [isConnected, address, signer, onRequirementsMet]);

  if (loading) {
    return (
      <Alert className="mb-4 border-blue-400 bg-blue-50">
        <AlertTitle className="flex items-center">
          <Info className="h-4 w-4 mr-2" />
          Checking voting eligibility...
        </AlertTitle>
      </Alert>
    );
  }

  // Only show the alert when requirements aren't met (no tokens available for voting)
  if (hasVotingEligibility === false) {
    return (
      <Alert className="mb-4 border-amber-400 bg-amber-50">
        <AlertTitle className="flex items-center">
          <Info className="h-4 w-4 mr-2" />
          Voting Requirement Not Met
        </AlertTitle>
        <AlertDescription>
          <p className="mb-3">
            Your wallet doesn't have sufficient DLOOP tokens for voting on proposals.
          </p>
          <Link href="/delegations">
            <Button variant="outline" className="flex items-center" size="sm">
              Go to Token Delegation
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }
  
  // No alert shown when requirements are met

  return null;
}

export default VoteRequirementsCheck;
