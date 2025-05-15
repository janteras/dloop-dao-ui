# D-LOOP UI

A cutting-edge blockchain interface for the D-Loop protocol on Sepolia Testnet, featuring a responsive and adaptive mobile-first user experience with comprehensive navigation solutions.

![D-LOOP Logo](https://d-loop.io/images/d-loop.png)

## Installation

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-organization/dloop-ui.git
   cd dloop-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```
   INFURA_API_KEY=your_infura_api_key
   WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## Usage

### Connecting to the Blockchain

1. **Connect your wallet**
   Click the "Connect Wallet" button in the top-right corner to connect your Ethereum wallet (MetaMask, WalletConnect, etc.)
   
   ```javascript
   // Example code for connecting wallet programmatically
   import { useWallet } from '@/hooks/useWallet';
   
   function ConnectButton() {
     const { connect } = useWallet();
     return <button onClick={connect}>Connect Wallet</button>;
   }
   ```

2. **Interacting with DAOs**
   Navigate to Asset DAO or Protocol DAO pages to view, create, and vote on proposals.
   
   ```javascript
   // Example code for creating a proposal
   import { useProposals } from '@/hooks/useProposals';
   
   function CreateProposalForm() {
     const { createProposal } = useProposals();
     
     const handleSubmit = (data) => {
       createProposal({
         title: data.title,
         description: data.description,
         // Other proposal parameters
       });
     };
     
     // Form implementation
   }
   ```

## Features

### Asset DAO Governance
- Create and vote on asset allocation proposals
- Delegate voting power to other users or AI nodes
- Track proposal status and execution

### Protocol DAO Governance
- Vote on protocol-level changes affecting fees, parameters
- Manage protocol roles and permissions
- Execute critical protocol updates through decentralized governance

### AI-Powered Governance
- View recommendations from AI governance nodes
- Delegate voting power to AI nodes with proven track records
- Track performance and accuracy of AI nodes over time

### Mobile-First Experience
- Responsive design optimized for all device sizes
- Intuitive mobile navigation with contextual help
- Touch-optimized controls and forms

### Leaderboard and Analytics
- View top participants ranked by voting power and contribution
- Track governance metrics and protocol health
- Monitor delegation relationships and voting patterns

## Tech Stack

- **Frontend**: Next.js with TypeScript
- **Styling**: TailwindCSS with Radix UI components
- **State Management**: TanStack React Query
- **Blockchain Integration**: ethers.js v6
- **Wallet Connection**: Web3Modal

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.