
/**
 * Local Storage Audit Component
 * 
 * Provides tools to audit and manage local storage items
 * that might affect AssetDAO data consistency.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  auditLocalStorage, 
  clearAssetDAOCache, 
  exportLocalStorageData,
  LocalStorageAuditReport,
  LocalStorageItem
} from '@/utils/local-storage-audit';
import { Download, Trash2, RefreshCw, Database, AlertTriangle, CheckCircle } from 'lucide-react';

export function LocalStorageAudit() {
  const [report, setReport] = useState<LocalStorageAuditReport | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [clearResult, setClearResult] = useState<{ clearedItems: string[]; errors: string[] } | null>(null);

  const runAudit = () => {
    const auditReport = auditLocalStorage();
    setReport(auditReport);
    setClearResult(null); // Clear previous clear results
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const result = clearAssetDAOCache();
      setClearResult(result);
      // Re-run audit after clearing
      setTimeout(runAudit, 100);
    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportData = () => {
    const exportData = exportLocalStorageData();
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `localStorage-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getImpactColor = (impact: LocalStorageItem['impact']) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: LocalStorageItem['type']) => {
    switch (type) {
      case 'proposal-cache':
      case 'vote-cache':
        return <AlertTriangle className="w-4 h-4" />;
      case 'feature-flag':
        return <Database className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  useEffect(() => {
    runAudit();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Local Storage Audit
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearCache}
              disabled={isClearing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cache
            </Button>
            <Button variant="outline" size="sm" onClick={runAudit}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {report && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{report.totalItems}</div>
                  <div className="text-sm text-muted-foreground">Total Items</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold">{formatBytes(report.totalSize)}</div>
                  <div className="text-sm text-muted-foreground">Total Size</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-red-600">{report.riskItems.length}</div>
                  <div className="text-sm text-muted-foreground">Risk Items</div>
                </CardContent>
              </Card>
            </div>

            {/* Clear Results */}
            {clearResult && (
              <Alert variant={clearResult.errors.length > 0 ? "destructive" : "default"}>
                <AlertDescription>
                  {clearResult.clearedItems.length > 0 && (
                    <div>Cleared {clearResult.clearedItems.length} cached items</div>
                  )}
                  {clearResult.errors.length > 0 && (
                    <div>Errors: {clearResult.errors.join(', ')}</div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Recommendations */}
            {report.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Recommendations:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {report.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Risk Items */}
            {report.riskItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-red-600">High-Risk Items:</h4>
                <div className="space-y-2">
                  {report.riskItems.map((item, index) => (
                    <Card key={index} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getTypeIcon(item.type)}
                            <span className="font-mono text-sm">{item.key}</span>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={getImpactColor(item.impact)}>
                              {item.impact}
                            </Badge>
                            <Badge variant="outline">
                              {item.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          Size: {formatBytes(item.size)}
                        </div>
                        <div className="text-sm text-blue-600">
                          {item.recommendation}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* All Items (Collapsible) */}
            <details className="space-y-2">
              <summary className="font-semibold cursor-pointer">
                All Local Storage Items ({report.items.length})
              </summary>
              <div className="space-y-2 mt-2">
                {report.items.map((item, index) => (
                  <Card key={index} className="border-l-4 border-l-gray-300">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{item.key}</span>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={getImpactColor(item.impact)} className="text-xs">
                            {item.impact}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {formatBytes(item.size)}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </details>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default LocalStorageAudit;
