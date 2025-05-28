import React, { useState, useEffect } from 'react';
import { useAppConfig, MigrationFeatureFlag } from '@/config/app-config';
import { MigrationIssue } from '@/lib/migration-monitoring';
import { useMigrationAccess } from '@/hooks/useMigrationAccess';
import { useMigrationTelemetry } from '@/hooks/useMigrationTelemetry';
import { Web3Implementation } from '@/types/web3-types';
import { useUnifiedWallet } from '@/hooks/useUnifiedWallet';
import { AlertCircle, AlertTriangle, ArrowUpDown, BarChart2, Check, CheckCircle2, ChevronDown, ChevronUp, RefreshCw, Shield, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import WagmiMigrationDashboard from '@/components/WagmiMigrationDashboard';
import { useRouter } from 'next/router';

/**
 * Comprehensive migration dashboard that shows progress, issues,
 * and allows toggling between implementations on a per-feature basis
 */
export function MigrationDashboard() {
  const {
    useWagmi, 
    setUseWagmi, 
    migratedComponents, 
    migrationIssues = [],
    clearResolvedIssues,
    resolveIssue,
    featureFlags = {},
    setFeatureFlag,
    userSegments = [],
    updateUserSegment,
    migrationMetrics = [],
    pruneMetrics
  } = useAppConfig();
  
  const { hasDashboardAccess } = useMigrationAccess();
  const { address, isConnected } = useUnifiedWallet();
  const [activeTab, setActiveTab] = useState('progress');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const router = useRouter();
  
  // Telemetry for the dashboard itself
  const telemetry = useMigrationTelemetry({
    component: 'MigrationDashboard',
    implementation: Web3Implementation.HYBRID,
    alertThresholds: {
      responseTime: 500, // 500ms
      errorRate: 5 // 5%
    }
  });
  
  // Start timing when component mounts
  useEffect(() => {
    telemetry.startTiming();
    return () => {
      telemetry.endTiming();
    };
  }, []);
  
  // Restrict access to the dashboard
  useEffect(() => {
    if (isConnected && !hasDashboardAccess) {
      telemetry.createAlert({
        message: `Unauthorized access attempt by ${address}`,
        severity: 'warning'
      });
      router.push('/'); // Redirect to home page
    }
  }, [isConnected, hasDashboardAccess, address, router]);
  
  // Core components that need migration
  const CORE_COMPONENTS = [
    'WalletConnection',
    'TokenHandling',
    'ContractInteractions',
    'ProposalSystem',
    'VotingSystem',
    'AssetDaoComponents',
    'ProtocolDaoComponents',
    'UserProfile',
    'Governance',
    'Staking'
  ];

  // Feature flags from the enum
  const FEATURE_FLAGS = Object.entries(MigrationFeatureFlag).map(([name, key]) => {
    // Convert enum name to readable label (e.g., WALLET_CONNECTION -> Wallet Connection)
    const label = name.split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
      
    return {
      key,
      label,
      description: `Controls ${label.toLowerCase()} functionality`
    };
  });
  
  // Calculate migration progress
  const migrationProgress = Math.round(
    (migratedComponents.length / CORE_COMPONENTS.length) * 100
  );
  
  // Get active issues
  const activeIssues = migrationIssues.filter(issue => !issue.resolved);
  const resolvedIssues = migrationIssues.filter(issue => issue.resolved);
  
  // Group issues by component
  const issuesByComponent = migrationIssues.reduce((acc, issue) => {
    if (!acc[issue.component]) {
      acc[issue.component] = [];
    }
    acc[issue.component].push(issue);
    return acc;
  }, {} as Record<string, MigrationIssue[]>);
  
  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  // Handle global implementation toggle
  const handleGlobalToggle = (checked: boolean) => {
    setUseWagmi(checked);
    
    // Update all feature flags to match
    FEATURE_FLAGS.forEach(flag => {
      setFeatureFlag(flag.key, checked);
    });
  };
  
  // Handle individual feature flag toggle
  const handleFeatureFlagToggle = (key: string, checked: boolean) => {
    setFeatureFlag(key, checked);
  };
  
  // Handle resolving an issue
  const handleResolveIssue = (id: string) => {
    resolveIssue(id);
  };
  
  // Handle clearing resolved issues
  const handleClearResolved = () => {
    clearResolvedIssues();
  };
  
  return (
    <div className="w-full space-y-6 p-6 bg-dark-bg border border-dark-gray rounded-lg">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Migration Dashboard</h2>
          <p className="text-gray-400">Track Ethers v6 to Wagmi migration progress</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="global-toggle"
              checked={useWagmi}
              onCheckedChange={handleGlobalToggle}
            />
            <Label htmlFor="global-toggle" className="font-medium">
              {useWagmi ? 'Using Wagmi' : 'Using Ethers v6'}
            </Label>
          </div>
          
          <Badge 
            className={
              migrationProgress >= 80 ? "bg-green-900/20 text-green-500" :
              migrationProgress >= 40 ? "bg-amber-900/20 text-amber-500" :
              "bg-blue-900/20 text-blue-500"
            }
          >
            {migrationProgress}% Complete
          </Badge>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="progress">
            Progress
          </TabsTrigger>
          <TabsTrigger value="issues">
            Issues
            {activeIssues.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {activeIssues.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="flags">
            Feature Flags
          </TabsTrigger>
        </TabsList>
        
        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overall Migration Progress</CardTitle>
              <CardDescription>
                {migrationProgress}% of components migrated to Wagmi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={migrationProgress} className="h-2" />
              
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-medium">Component Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {CORE_COMPONENTS.map((component) => (
                    <div key={component} className="flex justify-between items-center p-2 rounded-md bg-dark-bg/50">
                      <span>{component}</span>
                      <Badge
                        className={migratedComponents.includes(component)
                          ? "bg-green-900/20 text-green-500 border-green-800/30"
                          : "bg-gray-800/20 text-gray-400 border-gray-700/30"}
                      >
                        {migratedComponents.includes(component) ? 'Migrated' : 'Pending'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Active Issues ({activeIssues.length})</h3>
            {resolvedIssues.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearResolved}
              >
                Clear {resolvedIssues.length} Resolved Issues
              </Button>
            )}
          </div>
          
          {Object.keys(issuesByComponent).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <CheckCircle2 className="w-12 h-12 text-green-500 mb-2" />
                <p className="text-center text-gray-400">No issues reported</p>
              </CardContent>
            </Card>
          ) : (
            Object.entries(issuesByComponent).map(([component, issues]) => {
              const activeComponentIssues = issues.filter(issue => !issue.resolved);
              const isExpanded = expandedSections[component] || false;
              
              return (
                <Card key={component} className={activeComponentIssues.length > 0 ? 'border-orange-800/50' : ''}>
                  <CardHeader className="pb-2" onClick={() => toggleSection(component)} style={{ cursor: 'pointer' }}>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-base flex items-center gap-2">
                        {component}
                        {activeComponentIssues.length > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {activeComponentIssues.length}
                          </Badge>
                        )}
                      </CardTitle>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-2">
                      <div className="space-y-2">
                        {issues.map((issue) => (
                          <div 
                            key={issue.id} 
                            className={`p-3 rounded-md flex justify-between items-start
                              ${issue.resolved 
                                ? 'bg-green-900/10 border border-green-900/20' 
                                : issue.severity === 'critical'
                                  ? 'bg-red-900/10 border border-red-900/20'
                                  : issue.severity === 'error'
                                    ? 'bg-orange-900/10 border border-orange-900/20'
                                    : 'bg-blue-900/10 border border-blue-900/20'
                              }`}
                          >
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <Badge className={
                                  issue.severity === 'critical' ? 'bg-red-900/20 text-red-500' :
                                  issue.severity === 'error' ? 'bg-orange-900/20 text-orange-500' :
                                  issue.severity === 'warning' ? 'bg-yellow-900/20 text-yellow-500' :
                                  'bg-blue-900/20 text-blue-500'
                                }>
                                  {issue.severity}
                                </Badge>
                                <Badge className={
                                  issue.implementation === 'wagmi' ? 'bg-purple-900/20 text-purple-500' :
                                  issue.implementation === 'ethers' ? 'bg-blue-900/20 text-blue-500' :
                                  'bg-gray-900/20 text-gray-500'
                                }>
                                  {issue.implementation}
                                </Badge>
                                <span className="text-xs text-gray-400">
                                  {new Date(issue.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm">{issue.description}</p>
                            </div>
                            
                            {!issue.resolved && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleResolveIssue(issue.id)}
                                className="ml-2"
                              >
                                <Check size={16} />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>
        
        {/* Feature Flags Tab */}
        <TabsContent value="flags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Flags</CardTitle>
              <CardDescription>
                Toggle individual features between Ethers and Wagmi implementations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {FEATURE_FLAGS.map((flag) => (
                  <div key={flag.key} className="flex justify-between items-center p-3 border border-dark-gray rounded-md">
                    <div>
                      <h4 className="font-medium">{flag.label}</h4>
                      <p className="text-sm text-gray-400">{flag.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={featureFlags[flag.key] ? 'bg-purple-900/20 text-purple-500' : 'bg-blue-900/20 text-blue-500'}>
                        {featureFlags[flag.key] ? 'Wagmi' : 'Ethers'}
                      </Badge>
                      <Switch
                        checked={featureFlags[flag.key] || false}
                        onCheckedChange={(checked) => handleFeatureFlagToggle(flag.key, checked)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-gray-400">
                Note: Some features may require a page refresh to apply changes
              </p>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Application
        </Button>
      </div>
    </div>
  );
}
