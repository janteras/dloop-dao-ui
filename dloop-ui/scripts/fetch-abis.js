/**
 * Script to fetch ABIs from Etherscan and update local ABI files
 * 
 * Usage: node fetch-abis.js
 */

import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use the provided API key
const API_KEY = 'HG7DAYXKN5B6AZE35WRDVQRSNN5IDC3ZG6';

// Etherscan API URLs for different networks
const ETHERSCAN_URLS = {
  mainnet: 'https://api.etherscan.io/api',
  sepolia: 'https://api-sepolia.etherscan.io/api',
};

// Contracts to fetch ABIs for (from our ABI registry)
const contracts = [
  {
    name: 'AssetDAO',
    fileName: 'assetdao.abi.v1.json',
    address: '0xa87e662061237a121Ca2E83E77dA8251bc4B3529',
    network: 'sepolia',
    description: 'The Asset DAO contract for managing treasury investments',
  },
  {
    name: 'ProtocolDAO',
    fileName: 'protocoldao.abi.v1.json',
    address: '0x012e4042ab5F55A556a8B453aBeC852D9466aFb0',
    network: 'sepolia',
    description: 'The Protocol DAO contract for governing the D-Loop Protocol',
  },
  {
    name: 'DLoopToken',
    fileName: 'dlooptoken.abi.v1.json',
    address: '0x05B366778566e93abfB8e4A9B794e4ad006446b4',
    network: 'sepolia',
    description: 'The DLOOP Token contract for the D-Loop Protocol governance token',
  },
  {
    name: 'SoulboundNFT',
    fileName: 'soulboundnft.abi.v1.json',
    address: '0x6391C14631b2Be5374297fA3110687b80233104c',
    network: 'sepolia',
    description: 'The Soulbound NFT contract for identity verification in the D-Loop Protocol',
  },
  {
    name: 'AINodeRegistry',
    fileName: 'ainoderegistry.abi.v1.json',
    address: '0x0045c7D99489f1d8A5900243956B0206344417DD',
    network: 'sepolia',
    description: 'The AI Node Registry contract for the D-Loop Protocol',
  },
];

// Base directory for ABI files
const ABI_DIR = path.join(__dirname, '..', 'client', 'src', 'abis');

/**
 * Fetch ABI from Etherscan
 */
async function fetchAbi(address, network) {
  try {
    const url = ETHERSCAN_URLS[network];
    if (!url) {
      throw new Error(`Network ${network} not supported`);
    }

    console.log(`Fetching ABI for ${address} from ${network}...`);
    
    const response = await axios.get(url, {
      params: {
        module: 'contract',
        action: 'getabi',
        address,
        apikey: API_KEY,
      },
    });

    if (response.data.status !== '1') {
      throw new Error(`Etherscan API error: ${response.data.message}`);
    }

    return JSON.parse(response.data.result);
  } catch (error) {
    console.error(`Error fetching ABI: ${error.message}`);
    return null;
  }
}

/**
 * Update local ABI file with data from Etherscan
 */
async function updateAbiFile(contract) {
  try {
    const { name, fileName, address, network, description } = contract;
    const filePath = path.join(ABI_DIR, fileName);
    
    // Fetch the ABI from Etherscan
    const abi = await fetchAbi(address, network);
    
    if (!abi) {
      console.warn(`No ABI found for ${name} at ${address} on ${network}, skipping...`);
      return false;
    }
    
    // Read the existing file if it exists
    let existingData = {};
    if (fs.existsSync(filePath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        console.warn(`Error reading existing ABI file: ${e.message}`);
      }
    }
    
    // Create the updated ABI file content
    const abiData = {
      ...existingData,
      version: existingData.version || '1.0.0',
      name,
      description,
      contractAddress: address,
      network,
      lastUpdated: new Date().toISOString().split('T')[0],
      abi,
    };
    
    // Write the updated file
    fs.writeFileSync(filePath, JSON.stringify(abiData, null, 2));
    console.log(`Updated ABI file for ${name} at ${filePath}`);
    
    return true;
  } catch (error) {
    console.error(`Error updating ABI file for ${contract.name}: ${error.message}`);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('Fetching ABIs from Etherscan...');
  
  // Create the ABI directory if it doesn't exist
  if (!fs.existsSync(ABI_DIR)) {
    fs.mkdirSync(ABI_DIR, { recursive: true });
  }
  
  // Process each contract
  const results = await Promise.all(
    contracts.map(contract => updateAbiFile(contract))
  );
  
  // Print summary
  const successCount = results.filter(Boolean).length;
  console.log(`\nABI update complete. Updated ${successCount} of ${contracts.length} contracts.`);
}

// Run the main function
main().catch(error => {
  console.error('An error occurred:', error);
  process.exit(1);
});
