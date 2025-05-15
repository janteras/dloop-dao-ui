# D-Loop Token Delegation & Integration Guide

This document merges the Token Delegation Guide with the Developer Integration Guide into a single reference for delegation workflows and environment setup.

---

## Part 1: Token Delegation Guide

### Overview
This guide explains how to delegate and undelegate D-Loop tokens for governance and AI nodes on the Sepolia testnet.

- **D-Loop Token contract**: `0x05B366778566e93abfB8e4A9B794e4ad006446b4`
- **AINodeGovernance contract**: `0x28fe6eA0D91D5Ca8C080E727cdEb02B2B740f458`
- **Network**: Sepolia Testnet
- **Prerequisites**: set `SEPOLIA_RPC_URL` and `PRIVATE_KEY` in `.env`

---

### 1. Delegating the D-Loop Token

#### 1.1 Method: `delegateTokens`
```solidity
function delegateTokens(address delegatee, uint256 amount) external;
```
- **Guards**:
  - `delegatee != address(0)`
  - `delegatee != msg.sender`
  - `amount > 0`
  - `balanceOf(msg.sender) >= amount + totalDelegatedByAddress`
- **Event**: `TokensDelegated(address indexed from, address indexed to, uint256 amount)`

#### 1.2 Example (TypeScript & Ethers v6)
```ts
import { JsonRpcProvider, Wallet, Contract, parseUnits } from "ethers";
import dloopTokenAbi from "../abis/DLoopToken.json";
import type { DLoopToken } from "../typechain";

const provider = new JsonRpcProvider(process.env.SEPOLIA_RPC_URL!);
const signer = new Wallet(process.env.PRIVATE_KEY!, provider);
const token = new Contract(
  "0x05B366778566e93abfB8e4A9B794e4ad006446b4",
  dloopTokenAbi,
  signer
) as DLoopToken;

export async function delegateDloop(delegatee: string, amount: string): Promise<void> {
  const amountWei = parseUnits(amount, 18);
  const tx = await token.delegateTokens(delegatee, amountWei);
  await tx.wait();
  console.log(`Delegated ${amount} DLOOP to ${delegatee}`);
}
```

---

### 2. Undelegating the D-Loop Token

#### 2.1 Method: `withdrawDelegation`
```solidity
function withdrawDelegation(address delegatee, uint256 amount) external;
```
- **Guards**:
  - `delegatee != address(0)`
  - Delegation exists and `amount <= delegatedAmount`
- **Event**: `DelegationWithdrawn(address indexed from, address indexed to, uint256 amount)`

#### 2.2 Example (TypeScript & Ethers v6)
```ts
export async function undelegateDloop(delegatee: string, amount: string): Promise<void> {
  const amountWei = parseUnits(amount, 18);
  const tx = await token.withdrawDelegation(delegatee, amountWei);
  await tx.wait();
  console.log(`Withdrew ${amount} DLOOP from delegation to ${delegatee}`);
}
```

---

### 3. Delegating to AI Governance Nodes

#### 3.1 Contract Methods
Located in `contracts/governance/AINodeGovernance.sol`:
```solidity
function delegateToNode(address _node, uint256 _amount) external nonReentrant;
function withdrawDelegation(address _node, uint256 _amount) external nonReentrant;
```
- **Events**: `DelegationCreated`, `DelegationIncreased`, `DelegationDecreased`, `DelegationWithdrawn`

#### 3.2 Example (TypeScript & Ethers v6)
```ts
import { Contract, parseUnits } from "ethers";
import aiGovernanceAbi from "../abis/AINodeGovernance.json";
import type { AINodeGovernance } from "../typechain";

const aiGov = new Contract(
  "0x28fe6eA0D91D5Ca8C080E727cdEb02B2B740f458",
  aiGovernanceAbi,
  signer
) as AINodeGovernance;

export async function delegateToNode(node: string, amount: string): Promise<void> {
  const amountWei = parseUnits(amount, 18);
  const tx = await aiGov.delegateToNode(node, amountWei);
  await tx.wait();
  console.log(`Delegated ${amount} DLOOP to node ${node}`);
}

export async function withdrawFromNode(node: string, amount: string): Promise<void> {
  const amountWei = parseUnits(amount, 18);
  const tx = await aiGov.withdrawDelegation(node, amountWei);
  await tx.wait();
  console.log(`Withdrew ${amount} DLOOP from node ${node}`);
}
```

#### 3.3 Querying Delegations
```ts
// Total delegated by user
const totalDelegated: bigint = await token.getTotalDelegatedAmount(userAddress);

// Total received by user
const totalReceived: bigint = await token.getTotalDelegatedToAmount(userAddress);

// List of delegatees
const delegatees: string[] = await token.getDelegatees(userAddress);

// List of delegators for a node
const delegators: string[] = await aiGov.getNodeDelegators(nodeAddress);
```

---

## Part 2: Developer Integration Guide

# D-Loop Protocol Developer Integration Guide

This guide provides essential information for developers integrating with the D-Loop Protocol deployed on the Sepolia testnet.

## Environment Variables
Create a `.env` file in the project root and set:
```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/...
PRIVATE_KEY=YOUR_PRIVATE_KEY          # prefix with 0x
DEPLOYER_PRIVATE_KEY=YOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=...

# Chainlink feed configuration
CHAINLINK_AGGREGATOR_ADDRESS=0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E
CHAINLINK_MAX_STALENESS=86400          # seconds before price is stale
CHAINLINK_HEARTBEAT=3600               # expected update interval
CHAINLINK_RELIABILITY_SCORE=90         # 0-100 scale
```

## ABI Compatibility & Public Getters
- All contract addresses, roles, and key variables referenced in integration scripts or tests must be declared as `public` variables or have explicit public getter functions in the Solidity contracts.
- After modifying contract interfaces, recompile contracts and update ABIs.

## Contract Addresses (Phase 4 Sepolia)
| Contract               | Address                                      |
|------------------------|----------------------------------------------|
| DLoopToken             | `0x05B366778566e93abfB8e4A9B794e4ad006446b4` |
| AINodeGovernance       | `0x28fe6eA0D91D5Ca8C080E727cdEb02B2B740f458` |
| SoulboundNFT           | `0x6391C14631b2Be5374297fA3110687b80233104c` |
| ProtocolDAO            | `0x012e4042ab5F55A556a8B453aBeC852D9466aFb0` |
| Treasury               | `0x476aAF510540F4c755cCe7E0FAaC7560b5D711F4` |
| AINodeRegistry         | `0x0045c7D99489f1d8A5900243956B0206344417DD` |
| PriceOracle            | `0x3D3aEA9D8ad748398a55bf0f7f9832498758f92a` |
| GovernanceRewards      | `0x295e6f4644AcC2b0bB762bBE1bba86F08D8b85f2` |
| AssetDAO               | `0xa87e662061237a121Ca2E83E77dA8251bc4B3529` |
| FeeCalculator          | `0x0EB08c64dB39286680B89B548e7A545708F48adf` |
| FeeProcessor           | `0x96664603DDFB16DfaF3Ea329216Dd461AcfEffaA` |

## Integration Commands
- Start dev server: `npm run dev`
- Deploy to Sepolia: `npx hardhat run scripts/deployment/deploy-sepolia-v6.js --network sepolia`
- Verify contracts: `npm run postdeploy`

---

*End of consolidated delegation guide.*
