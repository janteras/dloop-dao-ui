import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useWallet } from '@/components/features/wallet/wallet-provider';
import { Delegation } from '@/types';

const undelegationSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    },
    {
      message: 'Amount must be a positive number',
    }
  ),
});

type UndelegationFormValues = z.infer<typeof undelegationSchema>;

interface UndelegateTokensModalProps {
  isOpen: boolean;
  onClose: () => void;
  delegation: Delegation;
}

const UndelegateTokensModal = ({
  isOpen,
  onClose,
  delegation,
}: UndelegateTokensModalProps) => {
  const { undelegateTokens, isDelegating } = useWallet();

  const form = useForm<UndelegationFormValues>({
    resolver: zodResolver(undelegationSchema),
    defaultValues: {
      amount: '',
    },
  });

  const onSubmit = async (data: UndelegationFormValues) => {
    try {
      await undelegateTokens(delegation.to, data.amount);
      onClose();
    } catch (error) {
      console.error('Undelegation error:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Undelegate DLOOP Tokens</DialogTitle>
          <DialogDescription>
            Undelegate your DLOOP tokens from {delegation.toName || delegation.to}.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="rounded-lg border border-border bg-muted p-4 mb-4">
              <h3 className="text-sm font-medium mb-2">Delegation Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Delegated To:</span>
                  <span className="font-medium">{delegation.toName || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Type:</span>
                  <span className="font-medium">{delegation.toType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Current Delegation:</span>
                  <span className="font-medium">{delegation.amount.toFixed(2)} DLOOP</span>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Undelegate</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="0.0"
                        type="number"
                        min="0.1"
                        step="0.1"
                        max={delegation.amount.toString()}
                      />
                      <span className="absolute right-3 top-2 text-sm text-muted-foreground">
                        DLOOP
                      </span>
                    </div>
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Delegated: {delegation.amount.toFixed(4)} DLOOP</span>
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => {
                        form.setValue('amount', delegation.amount.toString());
                      }}
                    >
                      Max
                    </button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={onClose} type="button" disabled={isDelegating}>
                Cancel
              </Button>
              <Button type="submit" disabled={isDelegating}>
                {isDelegating ? 'Processing...' : 'Undelegate Tokens'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UndelegateTokensModal;