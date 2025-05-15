import { useEffect } from 'react';
import { useQuery, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useEthers } from '@/contexts/EthersContext';
import { getContract } from '@/lib/contracts';
import { ethers } from 'ethers';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';

// Enriched delegation record with timestamp
export interface DelegationRecord {
  id: string;
  to: string;
  toName?: string;
  toType: 'Human' | 'AI Node';
  amount: number;
  date: number; // ms since epoch
}

/** Structure of a delegation event */
export interface DelegationEvent {
  delegator: string;
  delegatee: string;
  amount: string;
}

/**
 * Hook to fetch and subscribe to DLoopToken delegation events for the current user.
 */
export function useDelegations(): UseQueryResult<DelegationRecord[], Error> {
  const { provider } = useEthers();
  const { address } = useWallet();
  const queryClient = useQueryClient();

  // subscribe to on-chain TokensDelegated events for the current user
  useEffect(() => {
    if (!provider || !address) return;
    
    const token = getContract('DLoopToken', provider);
    // Filter events where the user is the delegator
    const filter = token.filters.TokensDelegated(address);
    
    const onEvent = () => queryClient.invalidateQueries({ queryKey: ['delegations', address] });
    token.on(filter, onEvent);
    
    return () => token.off(filter, onEvent);
  }, [provider, queryClient, address]);

  return useQuery<DelegationRecord[], Error>({
    queryKey: ['delegations', address],
    queryFn: async () => {
      if (!provider || !address) return [];
      
      const token = getContract('DLoopToken', provider);
      // Filter only events where the current user is the delegator
      const filter = token.filters.TokensDelegated(address);
      const events = await token.queryFilter(filter, 0, 'latest');
      
      console.log(`Found ${events.length} delegation events for address ${address}`);
      
      const delegations = await Promise.all(events.map(async (ev: any) => {
        const block = await provider.getBlock(ev.blockNumber);
        return {
          id: `${ev.transactionHash}-${ev.logIndex}`,
          to: ev.args.delegatee,
          toType: 'Human', // override based on aiNodes in the component
          amount: parseFloat(ethers.formatEther(ev.args.amount)),
          date: block.timestamp * 1000,
        };
      }));
      
      // Sort by date, newest first
      return delegations.sort((a, b) => b.date - a.date);
    },
    enabled: !!provider && !!address,
    staleTime: 30_000, // Shorter stale time to refresh more frequently
  });
}
