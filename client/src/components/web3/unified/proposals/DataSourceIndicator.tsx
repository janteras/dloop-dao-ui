
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Database, Globe } from 'lucide-react';

interface DataSourceIndicatorProps {
  isUsingMockData?: boolean;
  dataSource?: string;
  lastUpdated?: string;
  className?: string;
}

export const DataSourceIndicator: React.FC<DataSourceIndicatorProps> = ({
  isUsingMockData = false,
  dataSource = 'unknown',
  lastUpdated,
  className = ''
}) => {
  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <Alert className={`${className} border-blue-500/20 bg-blue-50/10`}>
      <Info className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          {isUsingMockData ? (
            <>
              <Database className="h-3 w-3" />
              <span>Using Mock Data</span>
            </>
          ) : (
            <>
              <Globe className="h-3 w-3" />
              <span>Live Contract Data</span>
            </>
          )}
          <Badge variant="outline" className="text-xs">
            {dataSource}
          </Badge>
        </div>
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            Updated: {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
};
