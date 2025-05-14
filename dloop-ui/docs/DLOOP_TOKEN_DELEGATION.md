# D-Loop Token Delegation Guide

## Overview
This guide explains how to delegate and undelegate D-Loop tokens for governance and AI nodes on the Sepolia testnet.

- **D-Loop Token contract**: `0x05B366778566e93abfB8e4A9B794e4ad006446b4`
- **AINodeGovernance contract**: `0x28fe6eA0D91D5Ca8C080E727cdEb02B2B740f458`
- **Network**: Sepolia Testnet
- **Prerequisites**: set `SEPOLIA_RPC_URL` and `PRIVATE_KEY` in `.env`

---

## 1. Delegating the D-Loop Token

### 1.1 Method: `delegateTokens`
```solidity
function delegateTokens(address delegatee, uint256 amount) external;
```
- **Guards**:
  - `delegatee != address(0)`
  - `delegatee != msg.sender`
  - `amount > 0`
  - `balanceOf(msg.sender) >= amount + totalDelegatedByAddress`
- **Event**: `TokensDelegated(address indexed from, address indexed to, uint256 amount)`

### 1.2 Example (ethers.js)
```js
import { ethers } from "ethers";
import dloopTokenAbi from "../abis/DLoopToken.json";

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const signer   = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const token    = new ethers.Contract(
  "0x05B366778566e93abfB8e4A9B794e4ad006446b4",
  dloopTokenAbi,
  signer
);

async function delegate(delegatee, amount) {
  const tx = await token.delegateTokens(
    delegatee,
    ethers.parseUnits(amount.toString(), 18)
  );
  await tx.wait();
  console.log(`Delegated ${amount} DLOOP to ${delegatee}`);
}
```

---

## 2. Undelegating the D-Loop Token

### 2.1 Method: `withdrawDelegation`
```solidity
function withdrawDelegation(address delegatee, uint256 amount) external;
```
- **Guards**:
  - `delegatee != address(0)`
  - Delegation exists and `amount <= delegatedAmount`
- **Event**: `DelegationWithdrawn(address indexed from, address indexed to, uint256 amount)`

### 2.2 Example (ethers.js)
```js
async function undelegate(delegatee, amount) {
  const tx = await token.withdrawDelegation(
    delegatee,
    ethers.parseUnits(amount.toString(), 18)
  );
  await tx.wait();
  console.log(`Withdrew ${amount} DLOOP from delegation to ${delegatee}`);
}
```

---

## 3. Delegating to AI Governance Nodes

### 3.1 Contract Methods
Located in `contracts/governance/AINodeGovernance.sol`:
```solidity
function delegateToNode(address _node, uint256 _amount) external nonReentrant;
function withdrawDelegation(address _node, uint256 _amount) external nonReentrant;
```
- **Events**: `DelegationCreated`, `DelegationIncreased`, `DelegationDecreased`, `DelegationWithdrawn`

### 3.2 Example (ethers.js)
```js
import aiGovernanceAbi from "../abis/AINodeGovernance.json";

const aiGov = new ethers.Contract(
  "0x28fe6eA0D91D5Ca8C080E727cdEb02B2B740f458",
  aiGovernanceAbi,
  signer
);

async function delegateToNode(node, amount) {
  const tx = await aiGov.delegateToNode(
    node,
    ethers.parseUnits(amount.toString(), 18)
  );
  await tx.wait();
  console.log(`Delegated ${amount} DLOOP to node ${node}`);
}

async function withdrawFromNode(node, amount) {
  const tx = await aiGov.withdrawDelegation(
    node,
    ethers.parseUnits(amount.toString(), 18)
  );
  await tx.wait();
  console.log(`Withdrew ${amount} DLOOP from node ${node}`);
}
```

### 3.3 Querying Delegations
```js
// Total delegated by user
const totalDelegated = await token.getTotalDelegatedAmount(userAddress);

// Total received by user
const totalReceived  = await token.getTotalDelegatedToAmount(userAddress);

// List of delegatees
const delegatees = await token.getDelegatees(userAddress);

// List of delegators for a node
const delegators = await aiGov.getNodeDelegators(nodeAddress);
```

---

## 4. Reference
See the [Developer Integration Guide](../DEVELOPER_INTEGRATION_GUIDE.md) for full contract addresses, ABIs, and environment setup.
