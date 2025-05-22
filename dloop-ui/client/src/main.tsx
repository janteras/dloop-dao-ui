import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";
import { EthersProvider } from "@/contexts/EthersContext";
import { WagmiProvider } from "@/components/features/wallet/wagmi-provider";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <WagmiProvider>
      <EthersProvider>
        <App />
      </EthersProvider>
    </WagmiProvider>
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);
