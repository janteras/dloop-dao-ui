# D-Loop Delegation Improvement Plan

This document outlines the structured plan to enhance DLOOP token delegation across documentation, architecture, UI/UX, and quality.

## 1. Documentation
1. Consolidate existing guides:
   - Merge `docs/DLOOP_TOKEN_DELEGATION.md` and `attached_assets/DEVELOPER_INTEGRATION_GUIDE.md` into a single `/docs/DELEGATION_GUIDE.md`.
2. Update code samples:
   - Use Ethers v6 (`JsonRpcProvider`, `BrowserProvider`, `parseUnits`).
   - Import context from `@/contexts/EthersContext`.
   - Add TypeScript typings.
3. Add querying/event hook examples:
   - `getDelegatedAmount`, `getTotalDelegatedAmount`, `TokensDelegated` subscription.
4. Cross-reference UI components and CLI:
   - Link to `Delegations`, `Leaderboard`, and `TokenDelegationModal` source paths.
   - List key npm/Hardhat commands.

## 2. Architecture & Data Layer
1. Single source of truth:
   - Use a unified `EthersContext` for provider and signer everywhere.
2. Batch & cache RPC calls:
   - Implement multicall for balances and delegated amounts.
   - Leverage React-Query for polling and subscriptions.
3. Strong typing:
   - Integrate TypeChain-generated contract typings.

## 3. UX/UI Enhancements

### A. /delegations View
- [x] Inline delegate/undelegate buttons in table rows (undelegate option only available if the user has delegated DLOOP)
- [x] Real-time refresh on delegation events.
- [x] Sorting and filtering (by date, amount, type).
- [x] Display available vs. delegated balances.

### B. /leaderboard View
- Highlight current user’s ranking.
- Drill-down popover with delegation breakdown and action buttons.
- Pagination or virtual scroll for large lists.

### C. /ai-nodes View
- Clear disable state with tooltips.
- Quick-select %, presets (25/50/100%).
- Transaction status indicator and post-delegation feedback.

## 4. Testing & Quality
1. Unit tests:
   - Hooks (`useDelegations`), error states, edge cases.
2. Integration/E2E:
   - Cypress or Playwright tests against a forked Sepolia node.
3. Accessibility:
   - Axe/Lighthouse audits for modals and interactive elements.

---
*Steps 1–4 to be implemented sequentially; Step 5 (Future Enhancements) is out of scope.*
