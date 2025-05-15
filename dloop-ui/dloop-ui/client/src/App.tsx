import { useState, useEffect } from "react";
import { Route, Switch } from "wouter";
import { ThemeProvider } from "@/components/common/theme-provider";
import { Toaster } from "@/components/common/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import Dashboard from "@/pages/dashboard";
import AssetDAO from "@/pages/assetdao";
import Leaderboard from "@/pages/leaderboard";
import AINodes from "@/pages/ainodes";
import ProtocolDAO from "@/pages/protocoldao";
import Delegations from "@/pages/delegations";
import NotFound from "@/pages/not-found";

import DashboardLayout from "@/components/layouts/dashboard-layout";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

// Import our simplified wallet provider
import { SimplifiedWalletProvider } from "@/components/features/wallet/simplified-wallet-provider";

function App() {
  const [mounted, setMounted] = useState(false);

  // Ensure window is available before mounting components that might need it
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <SimplifiedWalletProvider>
          <DashboardLayout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/asset-dao" component={AssetDAO} />
              <Route path="/asset-dao/proposal/:id" component={AssetDAO} />
              <Route path="/delegations" component={Delegations} />
              <Route path="/leaderboard" component={Leaderboard} />
              <Route path="/ai-nodes" component={AINodes} />
              <Route path="/ai-nodes/:id" component={AINodes} />
              <Route path="/protocol-dao" component={ProtocolDAO} />
              <Route path="/protocol-dao/proposal/:id" component={ProtocolDAO} />

              <Route component={NotFound} />
            </Switch>
          </DashboardLayout>
          <Toaster />
          <HotToaster position="top-right" />
        </SimplifiedWalletProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
