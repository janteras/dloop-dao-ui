'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useWallet } from '@/components/features/wallet/simplified-wallet-provider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ethers } from 'ethers';
import { shortenAddress } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, User, Brain, Activity } from 'lucide-react';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { TokenDelegationService } from '@/services/tokenDelegationService';
import { useTokenInfo } from '@/hooks/useTokenInfo';

const formSchema = z.object({
  amount: z.coerce
    .number()
    .min(0.000001, 'Amount must be at least 0.000001')
    .refine((val) => val > 0, {
      message: 'Amount must be greater than 0',
    }),
});

type FormValues = z.infer<typeof formSchema>;

interface AINode {
  id: string;
  name: string;
  address: string;
  strategy?: string;
  accuracy?: number;
  performance?: number;
  delegatedAmount?: number;
  soulboundTokenId?: number;
  tokenData?: any;
}

interface DelegateTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Allow either direct properties or a node object
  recipientAddress?: string;
  recipientName?: string;
  recipientType?: 'Human' | 'AI Node';
  availableBalance?: number;
  node?: AINode;
  onSuccess?: () => void;
}

export function DelegateTokensModal({
  isOpen,
  onClose,
  recipientAddress,
  recipientName,
  recipientType = 'AI Node',
  availableBalance,
  node,
  onSuccess,
}: DelegateTokensModalProps): JSX.Element {
  // Extract values from node if provided
  const actualAddress = node?.address || recipientAddress;
  const actualName = node?.name || recipientName;
  const actualType = recipientType || 'AI Node';
  const { isConnected, signer } = useWallet();
  const { toast } = useToast();
  const { refetch: refetchLeaderboard } = useLeaderboard();
  const { refetch: refetchTokenInfo } = useTokenInfo();
  const { availableBalance: fetchedBalance } = useTokenInfo();
  const actualBalance = availableBalance || parseFloat(fetchedBalance);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const displayName = actualName || shortenAddress(actualAddress || '');

  // Define this function before it's used
  const resetAndClose = () => {
    form.reset();
    onClose();
  };

  // Helper function to validate and format Ethereum addresses
  const validateAddress = (address: string): { isValid: boolean; formattedAddress?: string; error?: string } => {
    try {
      // Check if the address is valid
      if (!ethers.isAddress(address)) {
        return { 
          isValid: false, 
          error: 'The address format is invalid. Please check the address and try again.'
        };
      }
      
      // If valid, return properly checksummed address
      return {
        isValid: true,
        formattedAddress: ethers.getAddress(address) // Convert to checksummed format
      };
    } catch (error) {
      console.warn('Error validating Ethereum address:', address, error);
      return { 
        isValid: false,
        error: 'Unable to validate the address. Please verify it is correct.'
      };
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!isConnected || !signer) {
      toast({
        title: 'Not Connected',
        description: 'Please connect your wallet first.',
        variant: 'destructive',
      });
      return;
    }

    if (data.amount > actualBalance) {
      toast({
        title: 'Insufficient Balance',
        description: `You have only ${actualBalance} DLOOP available to delegate.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate the recipient address
      const addressValidation = validateAddress(actualAddress || '');
      
      if (!addressValidation.isValid) {
        toast({
          title: 'Invalid Address',
          description: addressValidation.error || 'The recipient address is invalid.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }
      
      // Validate signer exists
      if (!signer) {
        throw new Error('No signer available, please reconnect your wallet');
      }
      
      // Delegate using our service
      await TokenDelegationService.delegateTokens(
        signer,
        addressValidation.formattedAddress || '',
        data.amount.toString()
      );
      
      // Refresh data
      refetchLeaderboard();
      refetchTokenInfo();

      toast({
        title: 'Delegation Successful',
        description: `You have successfully delegated ${data.amount} DLOOP to ${displayName}.`,
      });

      if (onSuccess) {
        onSuccess();
      }

      resetAndClose();
    } catch (error: any) {
      console.error('Error delegating tokens:', error);
      toast({
        title: 'Delegation Failed',
        description: error.message || 'There was an error delegating your tokens. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const maxAmount = () => {
    form.setValue('amount', actualBalance);
  };

  // Animation variant for staggered animation
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const amount = form.watch('amount');
  const delegationAmount = parseFloat(amount.toString()) || 0;
  const votingPowerBoost = Math.floor(delegationAmount * 0.08);

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <DialogHeader>
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <DialogTitle className="text-center flex items-center justify-center gap-2">
                <span>Delegate DLOOP Tokens</span>
                {recipientType === 'AI Node' ? 
                  <Brain className="h-5 w-5 text-purple-500" /> : 
                  <User className="h-5 w-5 text-blue-500" />
                }
              </DialogTitle>
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <DialogDescription className="text-center">
                Delegate your DLOOP tokens to {displayName} ({recipientType}). 
                <br />Delegated tokens will increase their voting power while still remaining in your wallet.
              </DialogDescription>
            </motion.div>
          </DialogHeader>

          <motion.div 
            className="grid gap-4 py-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div 
              className="flex justify-between items-center p-2 rounded-lg bg-muted/50"
              variants={itemVariants}
            >
              <div className="flex items-center">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-2 ${
                  actualType === 'AI Node' ? 'bg-purple-100 text-purple-500' : 'bg-blue-100 text-blue-500'
                }`}>
                  {actualType === 'AI Node' ? <Brain className="h-4 w-4" /> : <User className="h-4 w-4" />}
                </div>
                <Label>Recipient</Label>
              </div>
              <span className="text-sm font-medium">{displayName}</span>
            </motion.div>

            <motion.div 
              className="flex justify-between items-center p-2 rounded-lg bg-muted/50"
              variants={itemVariants}
            >
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-100 text-green-500 rounded-full flex items-center justify-center mr-2">
                  <Activity className="h-4 w-4" />
                </div>
                <Label>Available Balance</Label>
              </div>
              <span className="text-sm font-medium">{actualBalance ? actualBalance.toLocaleString() : '0'} DLOOP</span>
            </motion.div>

            <motion.div 
              className="grid gap-3" /* Increased gap for better spacing on mobile */
              variants={itemVariants}
            >
              <div className="flex justify-between items-center">
                <Label htmlFor="amount" className="text-base">Amount to Delegate</Label>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 px-4 text-sm rounded-full" /* Increased button size for mobile */
                    onClick={maxAmount}
                  >
                    Max
                  </Button>
                </motion.div>
              </div>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  placeholder="0.0"
                  className="transition-all duration-200 focus:ring-2 focus:ring-offset-1 focus:ring-primary h-12 text-lg px-4 rounded-md" /* Taller input with larger text for mobile */
                  {...form.register('amount')}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <span className="text-base font-medium">DLOOP</span>
                </div>
              </div>
              {form.formState.errors.amount && (
                <motion.p 
                  className="text-sm text-destructive"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {form.formState.errors.amount.message}
                </motion.p>
              )}
            </motion.div>

            {delegationAmount > 0 && (
              <motion.div
                className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <motion.div 
                      animate={{ rotate: [0, 10, 0] }}
                      transition={{ 
                        duration: 0.5, 
                        repeat: Infinity, 
                        repeatType: "reverse",
                        repeatDelay: 2
                      }}
                    >
                      <ArrowRight className="h-4 w-4 text-green-500 mr-2" />
                    </motion.div>
                    <span className="text-sm">Voting power boost</span>
                  </div>
                  <div className="font-medium text-green-600">+{votingPowerBoost.toLocaleString()}</div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Modified footer for better mobile experience */}
          <DialogFooter className="flex-col sm:flex-row gap-3 mt-2">
            <motion.div
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto"
            >
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetAndClose}
                className="w-full h-12 text-base" /* Full width on mobile, taller button */
              >
                Cancel
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full sm:w-auto" /* Full width on mobile */
            >
              <Button 
                type="submit" 
                disabled={isSubmitting || delegationAmount <= 0}
                className="relative group overflow-hidden w-full h-12 text-base font-medium" /* Taller button with larger text */
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <motion.div
                      animate={{ 
                        rotate: 360,
                      }} 
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      <Activity className="h-5 w-5" /> {/* Larger icon */}
                    </motion.div>
                    <span>Delegating...</span>
                  </div>
                ) : (
                  <>
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Delegate Tokens
                      <CheckCircle className="h-5 w-5" /> {/* Larger icon */}
                    </span>
                    <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </>
                )}
              </Button>
            </motion.div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}