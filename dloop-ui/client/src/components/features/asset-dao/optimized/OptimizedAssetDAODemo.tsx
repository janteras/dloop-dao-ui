/**
 * Optimized AssetDAO Demo
 * 
 * A demonstration component that showcases the React Query optimized
 * implementation of the AssetDAO with comparative performance metrics.
 */

import { useState } from 'react';
import { QueryProvider } from '@/lib/query/provider';
import { OptimizedAssetDAO } from './OptimizedAssetDAO';
import { UnifiedAssetDAO } from '../unified/UnifiedAssetDAO';
import { useFeatureFlag } from '@/config/feature-flags';

/**
 * Demo component properties
 */
interface OptimizedAssetDAODemoProps {
  className?: string;
}

/**
 * A demo component that showcases the React Query optimized implementation
 * of the AssetDAO alongside the original unified implementation for comparison.
 */
export function OptimizedAssetDAODemo({ className = '' }: OptimizedAssetDAODemoProps) {
  // State for implementation switching
  const [implementation, setImplementation] = useState<'ethers' | 'wagmi' | undefined>(undefined);
  
  // Get feature flag status
  const useWagmiFlag = useFeatureFlag('useWagmiProposals');
  
  // Toggle implementation
  const toggleImplementation = () => {
    if (implementation === 'ethers') {
      setImplementation('wagmi');
    } else if (implementation === 'wagmi') {
      setImplementation(undefined);
    } else {
      setImplementation('ethers');
    }
  };
  
  return (
    <div className={`optimized-asset-dao-demo ${className}`}>
      <div className="demo-header">
        <h1>D-Loop AssetDAO Optimization Demo</h1>
        <p className="subtitle">Phase 2: Performance Optimization with React Query</p>
        
        <div className="implementation-controls">
          <div className="implementation-status">
            <span className="label">Feature Flag:</span>
            <span className={`value ${useWagmiFlag ? 'wagmi' : 'ethers'}`}>
              {useWagmiFlag ? 'Wagmi Enabled' : 'Ethers Enabled'}
            </span>
          </div>
          
          <div className="implementation-status">
            <span className="label">Current Override:</span>
            <span className={`value ${implementation || 'default'}`}>
              {implementation || 'Using Feature Flag'}
            </span>
          </div>
          
          <button 
            className="toggle-implementation"
            onClick={toggleImplementation}
          >
            Toggle Implementation
          </button>
        </div>
      </div>
      
      <div className="demo-content">
        <div className="demo-section">
          <div className="section-header">
            <h2>React Query Optimized Implementation</h2>
            <div className="section-features">
              <span className="feature">✅ Efficient Caching</span>
              <span className="feature">✅ Background Refreshing</span>
              <span className="feature">✅ Optimistic Updates</span>
              <span className="feature">✅ Automatic Retries</span>
              <span className="feature">✅ Improved Performance</span>
            </div>
          </div>
          
          <div className="section-content">
            <QueryProvider>
              <OptimizedAssetDAO 
                implementation={implementation}
                className="optimized-demo"
              />
            </QueryProvider>
          </div>
        </div>
        
        <div className="demo-divider">
          <div className="divider-line"></div>
          <span className="divider-text">vs</span>
          <div className="divider-line"></div>
        </div>
        
        <div className="demo-section">
          <div className="section-header">
            <h2>Original Unified Implementation</h2>
            <div className="section-features">
              <span className="feature">✅ Implementation Switching</span>
              <span className="feature">✅ Consistent Interface</span>
              <span className="feature">❌ No Efficient Caching</span>
              <span className="feature">❌ No Background Refreshing</span>
              <span className="feature">❌ Manual State Management</span>
            </div>
          </div>
          
          <div className="section-content">
            <UnifiedAssetDAO 
              implementation={implementation}
              className="unified-demo"
            />
          </div>
        </div>
      </div>
      
      <div className="demo-footer">
        <p>
          This demo showcases the performance improvements achieved by integrating 
          React Query with our unified contract access pattern.
        </p>
        <p>
          The optimized implementation maintains all the features of the unified pattern
          while adding efficient data caching, background refreshing, and improved error handling.
        </p>
      </div>
    </div>
  );
}
