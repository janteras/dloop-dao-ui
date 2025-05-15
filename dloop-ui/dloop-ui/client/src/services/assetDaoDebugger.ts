import { ethers } from 'ethers';
import { getContract } from '@/lib/contracts';

/**
 * Helper service to debug AssetDAO contract issues
 */
const AssetDAODebugger = {
  /**
   * Attempt to diagnose why proposal creation is failing
   * @param signer - The connected wallet signer
   * @param tokenAddress - The investment token address
   * @param amount - Amount to invest
   */
  async diagnoseProposalIssue(
    signer: ethers.JsonRpcSigner,
    tokenAddress: string,
    amount: ethers.BigNumberish
  ): Promise<string> {
    try {
      const assetDAO = getContract('AssetDAO', signer);
      const signerAddress = await signer.getAddress();
      let diagnosticReport = `AssetDAO Contract Diagnostics\n`;
      diagnosticReport += `Connected Address: ${signerAddress}\n`;
      diagnosticReport += `Contract Address: ${assetDAO.target}\n\n`;

      // Check contract code
      const provider = signer.provider;
      const contractCode = await provider.getCode(assetDAO.target.toString());
      const isContractDeployed = contractCode !== '0x';
      diagnosticReport += `Contract deployed: ${isContractDeployed}\n`;
      
      if (!isContractDeployed) {
        return diagnosticReport + 'ERROR: No contract deployed at this address!';
      }

      // Check available methods
      diagnosticReport += `\nContract Function Detection:\n`;
      
      // Try various method detection approaches
      try {
        const functionsList = [
          'propose', 'getProposal', 'getProposalDescription', 
          'isMember', 'proposalThreshold', 'governanceToken',
          'token', 'hasVoted', 'getVoterSupport'
        ];
        
        for (const funcName of functionsList) {
          try {
            // Check if function exists by calling its selector - this is a low-level check
            const isAvailable = !!assetDAO[funcName];
            diagnosticReport += `- ${funcName}: ${isAvailable ? 'Available' : 'Unavailable'}\n`;
          } catch (err) {
            diagnosticReport += `- ${funcName}: Detection failed\n`;
          }
        }
      } catch (e) {
        diagnosticReport += `Function detection failed: ${e}\n`;
      }

      // Try to get governance details
      try {
        diagnosticReport += `\nGovernance Settings:\n`;
        
        // Try to get token
        let governanceToken = null;
        try {
          governanceToken = await assetDAO.governanceToken().catch(async () => {
            try {
              return await assetDAO.token();
            } catch (e) {
              return null;
            }
          });
          
          diagnosticReport += `- Governance Token: ${governanceToken || 'Not found'}\n`;
          
          if (governanceToken) {
            // Check user's voting power
            const tokenAbi = [
              'function balanceOf(address) view returns (uint256)',
              'function decimals() view returns (uint8)',
              'function symbol() view returns (string)'
            ];
            
            const govToken = new ethers.Contract(governanceToken, tokenAbi, signer);
            try {
              const balance = await govToken.balanceOf(signerAddress);
              const symbol = await govToken.symbol();
              const decimals = await govToken.decimals();
              
              diagnosticReport += `- Token Symbol: ${symbol}\n`;
              diagnosticReport += `- User Balance: ${ethers.formatUnits(balance, decimals)} ${symbol}\n`;
            } catch (e) {
              diagnosticReport += `- Error reading token details: ${e}\n`;
            }
          }
        } catch (e) {
          diagnosticReport += `- Error getting governance token: ${e}\n`;
        }
        
        // Try to check if there are special proposal requirements
        try {
          const proposalThreshold = await assetDAO.proposalThreshold().catch(() => null);
          if (proposalThreshold) {
            diagnosticReport += `- Proposal Threshold: ${ethers.formatEther(proposalThreshold)}\n`;
          }
        } catch (e) {
          // Ignored
        }
        
        // Try to check proposal count
        try {
          const proposalCount = await assetDAO.proposalCount().catch(() => null);
          if (proposalCount) {
            diagnosticReport += `- Total Proposals: ${proposalCount.toString()}\n`;
          }
        } catch (e) {
          // Ignored
        }
      } catch (e) {
        diagnosticReport += `Error getting governance details: ${e}\n`;
      }

      // Try proposal direct function analysis
      diagnosticReport += `\nProposal Analysis:\n`;
      try {
        // Try to get function selector for propose
        const proposeInterface = new ethers.Interface(['function propose(uint8,address,uint256,string) returns (uint256)']);
        const proposeSelector = proposeInterface.getFunction('propose(uint8,address,uint256,string)').selector;
        diagnosticReport += `- Propose Function Selector: ${proposeSelector}\n`;
        
        // Try to analyze exact error with static call
        try {
          const testDesc = 'Test proposal description';
          diagnosticReport += `- Testing propose with static call...\n`;
          
          await assetDAO.propose.staticCall(0, tokenAddress, amount, testDesc)
            .then(() => {
              diagnosticReport += `  Result: WOULD SUCCEED! But fails when actually submitted?\n`;
            })
            .catch((error: any) => {
              diagnosticReport += `  Result: FAILS\n`;
              diagnosticReport += `  Error: ${error?.message || 'Unknown error'}\n`;
              
              // Try to extract revert reason
              if (error?.data) {
                diagnosticReport += `  Error Data: ${error.data}\n`;
              }
              
              // Common error analysis
              if (error?.message?.includes('threshold')) {
                diagnosticReport += `  DIAGNOSIS: Likely insufficient voting power to create proposals\n`;
              } else if (error?.message?.includes('cooldown') || error?.message?.includes('delay')) {
                diagnosticReport += `  DIAGNOSIS: Proposal cooldown period not elapsed\n`;
              } else if (error?.message?.includes('membership') || error?.message?.includes('member')) {
                diagnosticReport += `  DIAGNOSIS: Caller is not a DAO member\n`;
              } else {
                diagnosticReport += `  DIAGNOSIS: Unknown error, possibly incorrect contract or implementation\n`;
              }
            });
        } catch (e) {
          diagnosticReport += `- Static call failed: ${e}\n`;
        }
        
        // Try to analyze similar proposal parameters that might work
        diagnosticReport += `\nAlternative Parameters Analysis:\n`;
        
        // Try different proposal types
        for (let i = 0; i < 4; i++) {
          try {
            await assetDAO.propose.estimateGas(i, tokenAddress, amount, 'Test')
              .then(gas => {
                diagnosticReport += `- Proposal type ${i}: WOULD SUCCEED (gas: ${gas.toString()})\n`;
              })
              .catch(() => {
                diagnosticReport += `- Proposal type ${i}: WOULD FAIL\n`;
              });
          } catch (e) {
            // Ignored
          }
        }
      } catch (e) {
        diagnosticReport += `Error in proposal analysis: ${e}\n`;
      }
      
      // Contract exploration summary
      diagnosticReport += `\nPossible Solutions:\n`;
      diagnosticReport += `1. Check if you have enough governance tokens\n`;
      diagnosticReport += `2. Verify the contract address is correct\n`;
      diagnosticReport += `3. Check if proposal type should be something other than 0\n`;
      diagnosticReport += `4. Ensure the token address is supported by the DAO\n`;
      
      return diagnosticReport;
    } catch (error) {
      console.error('Diagnostic error:', error);
      return `Error running diagnostics: ${error}`;
    }
  }
};

export default AssetDAODebugger;
