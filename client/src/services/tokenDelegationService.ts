import { ethers, BigNumberish } from 'ethers';
import { getContract } from '@/lib/contracts';

export const TokenDelegationService = {
  /**
   * Delegate DLOOP tokens to another address
   * @param signer The connected wallet signer
   * @param delegatee The address to delegate to
   * @param amount The amount to delegate in DLOOP
   * @returns Transaction receipt
   * @throws Error if validation fails or contract execution fails
   */
  async delegateTokens(
    signer: ethers.JsonRpcSigner,
    delegatee: string,
    amount: string
  ) {
    try {
      // Get the connected wallet address
      const walletAddress = await signer.getAddress();
      
      // Validate the delegatee address
      if (!delegatee || delegatee === '0x0000000000000000000000000000000000000000') {
        throw new Error('Cannot delegate to null address');
      }
      
      // Validate delegatee isn't the sender (contract guard condition)
      if (delegatee.toLowerCase() === walletAddress.toLowerCase()) {
        throw new Error('Cannot delegate to yourself. Please select a different AI node.');
      }
      
      // Check if we're in development mode
      const isDevelopmentMode = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
      
      // Log connection info
      console.log('Connection info:', {
        isDevelopmentMode,
        walletAddress,
        delegatee
      });
      
      // Get DLoopToken contract instance with proper ABI that includes delegateTokens
      const dloopTokenABI = [
        'function delegateTokens(address delegatee, uint256 amount) external',
        'function balanceOf(address account) external view returns (uint256)'
        // 'totalDelegatedBy' function is intentionally omitted since it might not be available yet
      ];
      
      const dloopToken = new ethers.Contract(
        '0x05B366778566e93abfB8e4A9B794e4ad006446b4', // Contract address from docs
        dloopTokenABI,
        signer
      );
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(amount);
      
      try {
        // Verify user has enough balance
        const balance = await dloopToken.balanceOf(walletAddress);
        const balanceBigInt = BigInt(balance.toString());
        const amountInWeiBigInt = BigInt(amountInWei.toString());
        
        // In development mode, assume enough balance for delegation
        if (isDevelopmentMode) {
          console.log('Development mode - Simulating balance check (assuming enough balance)');
        } else {
          // In production mode, check if user has enough balance
          if (balanceBigInt < amountInWeiBigInt) {
            throw new Error(`Insufficient balance for delegation. You have ${ethers.formatEther(balance)} DLOOP but tried to delegate ${amount} DLOOP`);
          }
        }
      } catch (balanceError) {
        console.error('Error checking balance:', balanceError);
        
        // In development mode, continue despite balance check errors
        if (!isDevelopmentMode) {
          throw balanceError;
        } else {
          console.log('Development mode - Proceeding despite balance check error');
        }
      }
      
      console.log('Delegation parameters:', {
        delegator: walletAddress,
        delegatee,
        amountInWei: amountInWei.toString()
      });
      
      // Development mode simulation check
      if (isDevelopmentMode) {
        console.log('Development mode - Simulating delegation transaction');
        
        // Simulate a transaction receipt for development
        const simulatedReceipt = {
          to: '0x05B366778566e93abfB8e4A9B794e4ad006446b4',
          from: walletAddress,
          contractAddress: null,
          transactionIndex: 0,
          gasUsed: BigInt(200000),
          logsBloom: '0x',
          blockHash: '0x' + '1'.repeat(64),
          transactionHash: '0x' + '2'.repeat(64),
          logs: [],
          blockNumber: 1,
          confirmations: 1,
          cumulativeGasUsed: BigInt(300000),
          effectiveGasPrice: BigInt(2000000000),
          type: 2,
          status: 1
        };
        
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Development mode - Delegation simulated successfully');
        return simulatedReceipt;
      }
      
      // For production mode, proceed with the actual transaction
      // Try with gas estimation first
      try {
        const estimatedGas = await dloopToken.delegateTokens.estimateGas(delegatee, amountInWei);
        console.log('Estimated gas:', estimatedGas.toString());
        
        // Add 20% buffer to gas estimate
        const gasLimit = BigInt(Math.floor(Number(estimatedGas) * 1.2));
        
        // Call the delegateTokens function with gas limit
        const tx = await dloopToken.delegateTokens(delegatee, amountInWei, {
          gasLimit
        });
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('Delegation successful:', receipt);
        
        return receipt;
      } catch (estimateError) {
        console.error('Gas estimation failed, trying with manual gas limit:', estimateError);
        
        // If in development mode, show a simplified error but still proceed
        if (isDevelopmentMode) {
          console.log('Development mode - Proceeding despite transaction error');
          
          // Create a simulated receipt
          const simulatedReceipt = {
            to: '0x05B366778566e93abfB8e4A9B794e4ad006446b4',
            from: walletAddress,
            contractAddress: null,
            transactionIndex: 0,
            gasUsed: BigInt(200000),
            logsBloom: '0x',
            blockHash: '0x' + '1'.repeat(64),
            transactionHash: '0x' + '2'.repeat(64),
            logs: [],
            blockNumber: 1,
            confirmations: 1,
            cumulativeGasUsed: BigInt(300000),
            effectiveGasPrice: BigInt(2000000000),
            type: 2,
            status: 1
          };
          
          return simulatedReceipt;
        }
        
        // For production, try with manual gas limit
        const tx = await dloopToken.delegateTokens(delegatee, amountInWei, {
          gasLimit: 300000 // Conservative gas limit
        });
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('Delegation successful with manual gas:', receipt);
        
        return receipt;
      }
    } catch (error) {
      console.error('Error delegating tokens:', error);
      throw error;
    }
  },
  
  /**
   * Undelegate DLOOP tokens
   * @param signer The connected wallet signer
   * @param delegatee The address to undelegate from
   * @param amount The amount to undelegate in DLOOP
   * @returns Transaction receipt
   * @throws Error if validation fails or contract execution fails
   */
  async undelegateTokens(
    signer: ethers.JsonRpcSigner,
    delegatee: string,
    amount: string
  ) {
    try {
      // Get the connected wallet address
      const walletAddress = await signer.getAddress();
      
      // Validate the delegatee address
      if (!delegatee || delegatee === '0x0000000000000000000000000000000000000000') {
        throw new Error('Cannot undelegate from null address');
      }
      
      // Check if we're in development mode
      const isDevelopmentMode = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost';
      
      // Log connection info
      console.log('Undelegation info:', {
        isDevelopmentMode,
        walletAddress,
        delegatee,
        amount
      });
      
      // Get DLoopToken contract instance with proper ABI
      const dloopTokenABI = [
        'function withdrawDelegation(address delegatee, uint256 amount) external',
        'function getDelegationTo(address delegator, address delegatee) external view returns (uint256)'
      ];
      
      const dloopToken = new ethers.Contract(
        '0x05B366778566e93abfB8e4A9B794e4ad006446b4', // Contract address from docs
        dloopTokenABI,
        signer
      );
      
      // Convert amount to wei
      const amountInWei = ethers.parseEther(amount);
      
      try {
        // Verify user has enough delegated tokens to withdraw
        if (!isDevelopmentMode) {
          const delegatedAmount = await dloopToken.getDelegationTo(walletAddress, delegatee);
          const delegatedAmountBigInt = BigInt(delegatedAmount.toString());
          const amountInWeiBigInt = BigInt(amountInWei.toString());
          
          if (delegatedAmountBigInt < amountInWeiBigInt) {
            throw new Error(`Insufficient delegated balance. You have ${ethers.formatEther(delegatedAmount)} DLOOP delegated to this address but tried to undelegate ${amount} DLOOP`);
          }
        } else {
          console.log('Development mode - Simulating delegation balance check');
        }
      } catch (balanceError: any) {
        console.error('Error checking delegated balance:', balanceError);
        
        // In development mode, continue despite balance check errors
        if (!isDevelopmentMode) {
          throw balanceError;
        } else {
          console.log('Development mode - Proceeding despite balance check error');
        }
      }
      
      // Development mode simulation check
      if (isDevelopmentMode) {
        console.log('Development mode - Simulating undelegation transaction');
        
        // Simulate a transaction receipt for development
        const simulatedReceipt = {
          to: '0x05B366778566e93abfB8e4A9B794e4ad006446b4',
          from: walletAddress,
          contractAddress: null,
          transactionIndex: 0,
          gasUsed: BigInt(200000),
          logsBloom: '0x',
          blockHash: '0x' + '1'.repeat(64),
          transactionHash: '0x' + '2'.repeat(64),
          logs: [],
          blockNumber: 1,
          confirmations: 1,
          cumulativeGasUsed: BigInt(300000),
          effectiveGasPrice: BigInt(2000000000),
          type: 2,
          status: 1
        };
        
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('Development mode - Undelegation simulated successfully');
        return simulatedReceipt;
      }
      
      // For production mode, proceed with the actual transaction
      try {
        // Try with gas estimation first
        const estimatedGas = await dloopToken.withdrawDelegation.estimateGas(delegatee, amountInWei);
        console.log('Estimated gas for undelegation:', estimatedGas.toString());
        
        // Add 20% buffer to gas estimate
        const gasLimit = BigInt(Math.floor(Number(estimatedGas) * 1.2));
        
        // Call the withdrawDelegation function with gas limit
        const tx = await dloopToken.withdrawDelegation(delegatee, amountInWei, {
          gasLimit
        });
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('Undelegation successful:', receipt);
        
        return receipt;
      } catch (txError) {
        console.error('Error during undelegation transaction:', txError);
        
        // Try with manual gas limit as fallback
        const tx = await dloopToken.withdrawDelegation(delegatee, amountInWei, {
          gasLimit: 300000 // Conservative gas limit
        });
        
        // Wait for confirmation
        const receipt = await tx.wait();
        console.log('Undelegation successful with manual gas:', receipt);
        
        return receipt;
      }
    } catch (error) {
      console.error('Error undelegating tokens:', error);
      throw error;
    }
  },
  
  /**
   * Get delegations from a specific user
   * @param provider Ethereum provider
   * @param address The user address
   * @returns Array of delegations with details
   */
  async getUserDelegations(provider: ethers.JsonRpcProvider | ethers.JsonRpcSigner, address: string) {
    try {
      const dloopToken = getContract('DLoopToken', provider);
      
      // Query for TokensDelegated events where delegator is the specified address
      const filter = dloopToken.filters.TokensDelegated(address);
      const events = await dloopToken.queryFilter(filter);
      
      return events.map(event => {
        // Handle the event properly with type casting
        const eventLog = event as unknown as { args: any[] };
        
        if (eventLog.args && eventLog.args.length >= 3) {
          return {
            delegator: eventLog.args[0],
            delegatee: eventLog.args[1],
            amount: eventLog.args[2].toString()
          };
        } else {
          console.warn('Event with unexpected format:', event);
          return {
            delegator: '',
            delegatee: '',
            amount: '0'
          };
        }
      });
    } catch (error) {
      console.error('Error fetching user delegations:', error);
      throw error;
    }
  }
};
