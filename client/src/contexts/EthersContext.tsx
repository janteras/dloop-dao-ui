import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers } from 'ethers';

interface EthersContextType {
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null;
  signer: ethers.JsonRpcSigner | null;
}

const EthersContext = createContext<EthersContextType | undefined>(undefined);

export const EthersProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<EthersContextType['provider']>(null);
  const [signer, setSigner] = useState<EthersContextType['signer']>(null);

  useEffect(() => {
    const init = async () => {
      if ((window as any).ethereum) {
        const browserProvider = new ethers.BrowserProvider((window as any).ethereum);
        setProvider(browserProvider);
        try {
          const signer = await browserProvider.getSigner();
          setSigner(signer);
        } catch {
          setSigner(null);
        }
      } else {
        const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL;
        if (rpcUrl) {
          const jsonProvider = new ethers.JsonRpcProvider(rpcUrl);
          setProvider(jsonProvider);
        }
      }
    };
    init();
  }, []);

  return (
    <EthersContext.Provider value={{ provider, signer }}>
      {children}
    </EthersContext.Provider>
  );
};

export const useEthers = (): EthersContextType => {
  const context = useContext(EthersContext);
  if (!context) {
    throw new Error('useEthers must be used within EthersProvider');
  }
  return context;
};
