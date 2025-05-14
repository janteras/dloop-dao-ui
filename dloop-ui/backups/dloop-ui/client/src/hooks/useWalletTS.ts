import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ethers } from "ethers";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getContract } from "@/lib/contracts";

// Add the ethereum type to the window object
declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletContextProps {
  isConnected: boolean;
  address: string;
  balance: number | undefined;
  connect: () => Promise<void>;
  disconnect: () => void;
  rageQuit: () => Promise<void>;
  isRageQuitting: boolean;
  signer: ethers.JsonRpcSigner | null;
}

// Create a default context
const defaultContext: WalletContextProps = {
  isConnected: false,
  address: "",
  balance: undefined,
  connect: async () => {},
  disconnect: () => {},
  rageQuit: async () => {},
  isRageQuitting: false,
  signer: null
};

// Create the context
const WalletContext = createContext<WalletContextProps>(defaultContext);

// Custom hook to use the wallet context
export function useWallet() {
  return useContext(WalletContext);
}

// Export the context for the JSX provider
export { WalletContext };