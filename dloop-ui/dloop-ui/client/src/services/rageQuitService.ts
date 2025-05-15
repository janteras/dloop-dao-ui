import { ethers } from 'ethers';
import { getContract } from '@/lib/contracts';
import { handleAssetDAOError } from '@/lib/contractErrorHandler';

/**
 * Execute the RageQuit functionality from the ProtocolDAO contract
 * RageQuit allows users to exit their positions and reclaim locked DLOOP tokens
 * 
 * @param signer The ethers signer
 * @param userAddress The address of the user executing RageQuit
 * @returns Transaction result with amount reclaimed
 */
export async function rageQuit(signer: ethers.JsonRpcSigner, userAddress: string) {
  if (!signer) throw new Error('Wallet not connected');
  
  try {
    const protocolDAO = getContract('ProtocolDAO', signer);
    const tx = await protocolDAO.rageQuit(userAddress);
    const receipt = await tx.wait();
    
    // Find RageQuitExecuted event in logs
    const eventInterface = new ethers.Interface([
      "event RageQuitExecuted(address user, uint256 amount)"
    ]);
    
    const rageQuitLog = receipt.logs
      .map((log: any) => { try { return eventInterface.parseLog(log); } catch (e) { return null; }})
      .filter((log: any) => log && log.name === 'RageQuitExecuted')[0];
    
    if (rageQuitLog) {
      const amount = ethers.formatEther(rageQuitLog.args.amount);
      return { success: true, amount };
    }
    
    return { success: true };
  } catch (error) {
    console.error('RageQuit error:', error);
    throw handleAssetDAOError(error);
  }
}
