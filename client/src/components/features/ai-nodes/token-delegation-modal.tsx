import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { useEthers } from '@/contexts/EthersContext';
import { getContract, getReadOnlyContract } from '@/lib/contracts';
import { contracts } from '@/config/contracts';
import { useTokenInfo } from '@/hooks/useTokenInfo';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  CoinsIcon,
  Lock,
  RefreshCw,
  ArrowRightIcon,
  InfoIcon,
  TrendingUp,
  Activity,
  CheckCircle,
  Brain,
  ArrowUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TokenDelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  node: {
    id: string;
    name: string;
    address: string;
    votingPower?: number;
    responseTime?: string;
  };
  onDelegationSuccess: (nodeId: string) => void;
}

export function TokenDelegationModal({ 
  isOpen, 
  onClose, 
  node, 
  onDelegationSuccess
}: TokenDelegationModalProps) {
  const { isConnected, address, balance } = useWallet();
  const { provider, signer } = useEthers();
  const { toast } = useToast();
  const { availableBalance, isLoading: tokenInfoLoading } = useTokenInfo();
  const [amount, setAmount] = useState<string>('100');
  const [percentage, setPercentage] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [delegatedAmount, setDelegatedAmount] = useState<string | null>(null);
  const [dloopBalance, setDloopBalance] = useState<string>('0');
  
  // Update DLOOP balance when availableBalance changes
  useEffect(() => {
    if (availableBalance && !tokenInfoLoading) {
      setDloopBalance(availableBalance);
    }
  }, [availableBalance, tokenInfoLoading]);

  // Handle percentage change from slider
  const handlePercentageChange = (newPercentage: number[]) => {
    const pct = newPercentage[0];
    setPercentage(pct);
    const dloopBalanceNumber = parseFloat(dloopBalance);
    if (dloopBalanceNumber > 0) {
      const calculatedAmount = ((pct / 100) * dloopBalanceNumber).toFixed(2);
      setAmount(calculatedAmount);
    }
  };
  
  // Handle manual amount input
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numeric input with decimal point
    if (/^(\d+\.?\d*|\.\d+)$/.test(value) || value === '') {
      setAmount(value);
      const dloopBalanceNumber = parseFloat(dloopBalance);
      if (dloopBalanceNumber > 0 && value !== '') {
        const pct = Math.min(100, (parseFloat(value) * 100) / dloopBalanceNumber);
        setPercentage(pct);
      }
    }
  };
  
  // Function to check currently delegated amount
  const checkDelegatedAmount = async () => {
    if (!provider || !address) return;
    
    try {
      setLoading(true);
      
      // Create contract instance
      const dloopContract = getReadOnlyContract('DLoopToken', provider);
      
      // Get delegated amount
      const rawAmount = await dloopContract.getDelegatedAmount(address, node.address);
      const formattedAmount = ethers.formatEther(rawAmount);
      setDelegatedAmount(formattedAmount);
      
    } catch (error: any) {
      console.error("Error checking delegated amount:", error);
      toast({
        title: "Error",
        description: "Could not retrieve delegated amount. " + (error.message || ""),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Delegate DLOOP tokens
  const handleDelegateTokens = async () => {
    if (!isConnected || !provider || !signer) {
      toast({
        title: "Wallet Error",
        description: "Please connect your wallet to delegate tokens.",
        variant: "destructive"
      });
      return;
    }
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount to delegate.",
        variant: "destructive"
      });
      return;
    }

    // Prevent self-delegation
    if (address && node.address.toLowerCase() === address.toLowerCase()) {
      toast({
        title: "Invalid Delegation",
        description: "You cannot delegate tokens to yourself. Please select a different AI node.",
        variant: "destructive"
      });
      return;
    }

    // Validate DLOOP balance
    const dloopBalanceNumber = parseFloat(dloopBalance);
    if (amountValue > dloopBalanceNumber) {
      toast({
        title: "Insufficient Balance",
        description: `You only have ${dloopBalanceNumber.toFixed(2)} DLOOP tokens available. Please enter a lower amount.`,
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // For development/testing environment, detect if we're in a local environment
      const isLocalDevelopment = window.location.hostname === 'localhost' || 
                                window.location.hostname === '127.0.0.1';
      
      if (isLocalDevelopment) {
        console.log(`[DEV MODE] Simulating delegation of ${amount} DLOOP to ${node.name} (${node.address})`);
        
        // Simulate contract interaction delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Set locally for UI
        setDelegatedAmount(amount);
        
        toast({
          title: "Development Mode - Delegation Simulated",
          description: `Simulated delegation of ${amount} DLOOP to ${node.name}.`,
        });
        
        // Update UI and close modal
        onDelegationSuccess(node.id);
        onClose();
        return;
      }
      
      // Convert to wei for the transaction
      const amountInWei = ethers.parseEther(amount);
      
      try {
        // Create an interface instance with the correct function selector for delegateTokens
        // This follows the same pattern that worked in the ProtocolDAO implementation
        const dloopTokenAbi = [
          "function delegateTokens(address delegatee, uint256 amount) external",
          "function balanceOf(address account) external view returns (uint256)",
          "function totalDelegatedBy(address delegator) external view returns (uint256)"
        ];
        
        // Get contract instance with the correct D-Loop Token contract address from docs
        const dloopToken = new ethers.Contract(
          "0x05B366778566e93abfB8e4A9B794e4ad006446b4", 
          dloopTokenAbi,
          signer
        );
        
        // Calculate the function selector
        const delegateTokensSelector = ethers.id("delegateTokens(address,uint256)").slice(0, 10);
        console.log("Function selector for delegateTokens:", delegateTokensSelector);
        
        // Log detailed debug information
        console.log("Delegation parameters:", {
          delegatee: node.address,
          amount: amount,
          amountWei: amountInWei.toString(),
          senderAddress: await signer.getAddress(),
          contractAddress: dloopToken.target
        });
        
        // Transaction variable declared outside try/catch for proper scope
        let tx;

        try {
          // First estimate gas to check if the transaction would fail
          const estimatedGas = await dloopToken.delegateTokens.estimateGas(node.address, amountInWei);
          console.log("Estimated gas for delegation:", estimatedGas.toString());
          
          // Calculate gas limit with 20% buffer for safety (using proper BigInt operations)
          const gasLimit = BigInt(Math.floor(Number(estimatedGas) * 1.2));
          console.log("Using gas limit with buffer:", gasLimit.toString());
          
          // Call delegateTokens function with the calculated gas limit
          tx = await dloopToken.delegateTokens(node.address, amountInWei, {
            gasLimit: gasLimit
          });
          
          console.log("Delegation transaction submitted:", tx.hash);
        } catch (estimateError) {
          console.error("Gas estimation failed, trying manual gas limit:", estimateError);
          
          // If gas estimation fails, try with a manual gas limit
          tx = await dloopToken.delegateTokens(node.address, amountInWei, {
            gasLimit: 300000 // Manual reasonable gas limit for delegation
          });
          
          console.log("Delegation transaction submitted with manual gas limit:", tx.hash);
        }
        
        // Wait for transaction confirmation
        if (tx) {
          const receipt = await tx.wait();
          console.log("Transaction confirmed:", receipt);
          
          // Show success message with transaction hash
          toast({
            title: "Transaction Confirmed",
            description: `Delegation confirmed! Transaction: ${tx.hash.slice(0, 10)}...`,
          });
        } else {
          throw new Error("Transaction failed to be created");
        }
        
        // Set locally for UI
        setDelegatedAmount(amount);
        
        toast({
          title: "Delegation Successful",
          description: `You've successfully delegated ${amount} DLOOP to ${node.name}.`,
        });
        
        // Update UI and close modal
        onDelegationSuccess(node.id);
        onClose();
      } catch (contractError: any) {
        console.error("Contract error during delegation:", contractError);
        
        // Handle specific contract error scenarios
        if (contractError.message.includes('execution reverted')) {
          // Check for specific error codes
          if (contractError.data === '0xef99396c') {
            throw new Error('Delegation failed: You cannot delegate to yourself or this operation is not allowed.');
          }
          
          // Format a better error message for execution revert
          let errorDetail = 'The contract rejected the transaction.';
          
          if (contractError.message.includes('insufficient allowance')) {
            errorDetail = 'Insufficient allowance. You need to approve tokens before delegating.';
          } else if (contractError.message.includes('insufficient balance')) {
            errorDetail = 'Insufficient balance to complete this delegation.';
          } else if (contractError.message.includes('gas required exceeds allowance')) {
            errorDetail = 'Transaction requires more gas than the network allows.';
          } else if (contractError.receipt && contractError.receipt.status === 0) {
            errorDetail = 'Transaction was rejected by the blockchain. This may be due to invalid delegation parameters.';
          }
          
          throw new Error(`Delegation failed: ${errorDetail}`);
        }
        
        throw contractError;
      }
    } catch (error: any) {
      console.error("Error delegating tokens:", error);
      toast({
        title: "Delegation Failed",
        description: error.message || "There was an error delegating your tokens.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Animation variants
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

  // Calculate voting power boost (for visual feedback)
  const delegationAmount = parseFloat(amount) || 0;
  const votingPowerBoost = Math.floor(delegationAmount * 0.08);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <DialogHeader>
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <DialogTitle className="flex items-center justify-center gap-2">
                <motion.div 
                  whileHover={{ rotate: [0, -10, 10, -5, 5, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Brain className="h-6 w-6 text-purple-500" />
                </motion.div>
                <span>Delegate DLOOP Tokens</span>
              </DialogTitle>
            </motion.div>
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <DialogDescription className="text-center">
                Delegate your DLOOP tokens to {node.name} to increase its voting power and influence in the DAO.
              </DialogDescription>
            </motion.div>
          </DialogHeader>
          
          <motion.div 
            className="py-4 space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div 
              className="bg-gradient-to-r from-purple-100/50 to-blue-100/50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-900"
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-purple-100 text-purple-500 dark:bg-purple-900/50 dark:text-purple-300 rounded-full flex items-center justify-center mr-2">
                    <Brain className="h-4 w-4" />
                  </div>
                  <span className="font-medium">{node.name}</span>
                </div>
                <motion.div 
                  className="px-2 py-1 bg-blue-100/50 dark:bg-blue-900/20 rounded-full text-xs font-medium text-blue-700 dark:text-blue-300"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(59, 130, 246, 0.2)" }}
                >
                  AI Governance Node
                </motion.div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" /> Voting Power:
                  </span>
                  <span className="text-sm font-medium">{node.votingPower?.toLocaleString() || "0"} DLOOP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3.5 w-3.5 text-amber-500" /> Response Time:
                  </span>
                  <span className="text-sm font-medium">{node.responseTime || "4.2"} hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Address:</span>
                  <motion.span 
                    className="text-sm font-mono truncate max-w-[180px] cursor-pointer" 
                    whileHover={{ scale: 1.02 }}
                    title={node.address}
                  >
                    {node.address}
                  </motion.span>
                </div>
              </div>
            </motion.div>
            
            {delegatedAmount && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <Alert className="bg-primary/5 border-primary/20">
                  <InfoIcon className="h-4 w-4 text-primary" />
                  <AlertTitle>Current Delegation</AlertTitle>
                  <AlertDescription className="mt-1">
                    You've already delegated <span className="font-medium">{parseFloat(delegatedAmount).toLocaleString()} DLOOP</span> to this node.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
            
            {!delegatedAmount && !loading && (
              <motion.div
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="w-full flex items-center justify-center gap-2" 
                  onClick={checkDelegatedAmount}
                >
                  <Activity className="h-4 w-4" />
                  Check Current Delegation
                </Button>
              </motion.div>
            )}
            
            <motion.div 
              className="space-y-2"
              variants={itemVariants}
            >
              <Label htmlFor="amount" className="flex items-center gap-1">
                <CoinsIcon className="h-4 w-4 text-amber-500" />
                Delegation Amount (DLOOP)
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="amount"
                  value={amount}
                  onChange={handleAmountChange}
                  className="flex-1 transition-all duration-200 focus:ring-2 focus:ring-offset-1 focus:ring-primary"
                  placeholder="Enter amount"
                />
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => {
                      const dloopBalanceNumber = parseFloat(dloopBalance);
                      if (dloopBalanceNumber > 0) {
                        setAmount(dloopBalance);
                        setPercentage(100);
                      }
                    }}
                    className="whitespace-nowrap flex items-center gap-1"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                    Max
                  </Button>
                </motion.div>
              </div>
            </motion.div>
            
            <motion.div 
              className="space-y-2"
              variants={itemVariants}
            >
              <div className="flex justify-between items-center">
                <Label className="flex items-center gap-1">
                  <Activity className="h-4 w-4 text-purple-500" />
                  Percentage of Balance
                </Label>
                <motion.span 
                  className="text-sm font-medium px-2 py-0.5 rounded-full bg-purple-100/50 dark:bg-purple-900/20"
                  animate={{ 
                    scale: percentage > 80 ? [1, 1.05, 1] : 1,
                    backgroundColor: percentage > 80 ? "rgba(147, 51, 234, 0.2)" : "rgba(147, 51, 234, 0.1)"
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {percentage.toFixed(0)}%
                </motion.span>
              </div>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="px-1"
              >
                <Slider
                  defaultValue={[10]}
                  value={[percentage]}
                  max={100}
                  step={1}
                  onValueChange={handlePercentageChange}
                  className="mt-1"
                />
              </motion.div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
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
                      <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                    </motion.div>
                    <span className="text-sm">Voting power boost</span>
                  </div>
                  <div className="font-medium text-green-600">+{votingPowerBoost.toLocaleString()}</div>
                </div>
              </motion.div>
            )}
            
            <motion.div variants={itemVariants}>
              <Alert className="bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <AlertTitle className="text-blue-700 dark:text-blue-300">Important</AlertTitle>
                <AlertDescription className="text-blue-600 dark:text-blue-400">
                  Delegated tokens remain in your wallet but their voting power will be directed to this node.
                  You can undelegate at any time.
                </AlertDescription>
              </Alert>
            </motion.div>
          </motion.div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <motion.div
              whileHover={{ scale: 0.98 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="outline" onClick={onClose} className="border-gray-300">
                Cancel
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Button
                onClick={handleDelegateTokens}
                disabled={!isConnected || !signer || loading || !amount || parseFloat(amount) <= 0}
                className="relative overflow-hidden group"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
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
                      <RefreshCw className="h-4 w-4" />
                    </motion.div>
                    <span>Delegating...</span>
                  </div>
                ) : (
                  <>
                    <span className="relative z-10 flex items-center gap-1">
                      <Lock className="h-4 w-4" />
                      Delegate Tokens
                    </span>
                    <span className="absolute inset-0 bg-primary/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                  </>
                )}
              </Button>
            </motion.div>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}