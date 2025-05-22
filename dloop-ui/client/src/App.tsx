import { useState, useEffect, lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import { ThemeProvider } from "@/components/common/theme-provider";
import { Toaster } from "@/components/common/ui/toaster";
import { Toaster as HotToaster } from "react-hot-toast";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

// Lazy-loaded page components
const Dashboard = lazy(() => import("@/pages/dashboard"));
const AssetDAO = lazy(() => import("@/pages/assetdao"));
const Leaderboard = lazy(() => import("@/pages/leaderboard"));
const AINodes = lazy(() => import("@/pages/ainodes"));
const ProtocolDAO = lazy(() => import("@/pages/protocoldao"));
const Delegations = lazy(() => import("@/pages/delegations"));
const WagmiDemo = lazy(() => import("@/pages/wagmi-demo"));
const WagmiAssetDAO = lazy(() => import("@/pages/wagmi-asset-dao"));
const NotFound = lazy(() => import("@/pages/not-found"));

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
        <ErrorBoundary
          fallback={(error, resetError) => (
            <div className="p-6 m-4 border border-red-600 rounded-md bg-red-50 text-red-800 shadow-md">
              <h2 className="text-xl font-bold mb-4">Something went wrong with the D-Loop UI</h2>
              <p className="mb-2">We encountered an error while trying to load the application. This may be related to the Ethers to Wagmi migration.</p>
              <details className="text-sm mb-4">
                <summary className="cursor-pointer mb-2 font-medium">Technical details (for developers)</summary>
                <pre className="p-3 bg-red-100 overflow-auto max-w-full whitespace-pre-wrap break-words rounded">
                  {error.message}
                  {error.stack}
                </pre>
              </details>
              <button
                onClick={resetError}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
            </div>
          )}
        >
          <SimplifiedWalletProvider>
            <ErrorBoundary>
              <DashboardLayout>
                <Suspense fallback={<div className="page-loading">Loading...</div>}>
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
                    <Route path="/wagmi-demo" component={WagmiDemo} />
                    <Route path="/wagmi-asset-dao" component={WagmiAssetDAO} />

                    <Route component={NotFound} />
                  </Switch>
                </Suspense>
              </DashboardLayout>
            </ErrorBoundary>
            <Toaster />
            <HotToaster position="top-right" />
          </SimplifiedWalletProvider>
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
