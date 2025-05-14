import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";
import { EthersProvider } from "@/contexts/EthersContext";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <EthersProvider>
      <App />
    </EthersProvider>
    {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
  </QueryClientProvider>
);
