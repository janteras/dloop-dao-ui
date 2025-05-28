// Performance Metrics API
// 
// This serverless function collects and provides performance metrics
// for both Ethers and Wagmi implementations.

// In a production environment, this would connect to a database
// For demonstration, we'll use in-memory storage with simulated data
let metricsStore = {
  assetDao: {
    ethers: {
      operations: {
        getProposals: { totalDuration: 225000, callCount: 1250, errorCount: 19 },
        getProposal: { totalDuration: 512000, callCount: 3200, errorCount: 29 },
        voteOnProposal: { totalDuration: 2704000, callCount: 520, errorCount: 15 },
        executeProposal: { totalDuration: 720000, callCount: 150, errorCount: 3 }
      }
    },
    wagmi: {
      operations: {
        getProposals: { totalDuration: 102000, callCount: 850, errorCount: 7 },
        getProposal: { totalDuration: 231000, callCount: 2100, errorCount: 4 },
        voteOnProposal: { totalDuration: 1824000, callCount: 380, errorCount: 6 },
        executeProposal: { totalDuration: 405000, callCount: 90, errorCount: 1 }
      }
    }
  },
  tokenVault: {
    ethers: {
      operations: {
        getTokens: { totalDuration: 168000, callCount: 980, errorCount: 12 },
        getToken: { totalDuration: 352000, callCount: 2800, errorCount: 18 },
        transferToken: { totalDuration: 1850000, callCount: 420, errorCount: 13 }
      }
    },
    wagmi: {
      operations: {
        getTokens: { totalDuration: 76000, callCount: 620, errorCount: 5 },
        getToken: { totalDuration: 187000, callCount: 1400, errorCount: 6 },
        transferToken: { totalDuration: 1050000, callCount: 210, errorCount: 4 }
      }
    }
  }
};

// Calculate averages and create comparison data
function generateComparisonData(component) {
  const ethersOps = metricsStore[component]?.ethers?.operations || {};
  const wagmiOps = metricsStore[component]?.wagmi?.operations || {};
  
  const comparison = [];
  
  // Combine all operations from both implementations
  const allOperations = new Set([
    ...Object.keys(ethersOps),
    ...Object.keys(wagmiOps)
  ]);
  
  allOperations.forEach(operation => {
    const ethersData = ethersOps[operation] || { totalDuration: 0, callCount: 0, errorCount: 0 };
    const wagmiData = wagmiOps[operation] || { totalDuration: 0, callCount: 0, errorCount: 0 };
    
    // Skip if no data for both implementations
    if (ethersData.callCount === 0 && wagmiData.callCount === 0) return;
    
    const ethersAvg = ethersData.callCount > 0 
      ? ethersData.totalDuration / ethersData.callCount 
      : 0;
      
    const wagmiAvg = wagmiData.callCount > 0 
      ? wagmiData.totalDuration / wagmiData.callCount 
      : 0;
    
    const ethersSuccessRate = ethersData.callCount > 0 
      ? ((ethersData.callCount - ethersData.errorCount) / ethersData.callCount) * 100 
      : 0;
      
    const wagmiSuccessRate = wagmiData.callCount > 0 
      ? ((wagmiData.callCount - wagmiData.errorCount) / wagmiData.callCount) * 100 
      : 0;
    
    // Calculate improvement percentage (if both have data)
    const improvementPercentage = (ethersData.callCount > 0 && wagmiData.callCount > 0 && ethersAvg > 0)
      ? ((ethersAvg - wagmiAvg) / ethersAvg) * 100
      : 0;
    
    comparison.push({
      operation,
      ethersAvgDuration: Math.round(ethersAvg),
      wagmiAvgDuration: Math.round(wagmiAvg),
      ethersSuccessRate: parseFloat(ethersSuccessRate.toFixed(1)),
      wagmiSuccessRate: parseFloat(wagmiSuccessRate.toFixed(1)),
      ethersSampleSize: ethersData.callCount,
      wagmiSampleSize: wagmiData.callCount,
      improvementPercentage: parseFloat(improvementPercentage.toFixed(1))
    });
  });
  
  return comparison;
}

// Store new metrics
function storeMetrics(metrics) {
  metrics.forEach(metric => {
    const { component, operation, implementation, metrics: { duration, success } } = metric;
    
    if (!metricsStore[component]) {
      metricsStore[component] = { ethers: { operations: {} }, wagmi: { operations: {} } };
    }
    
    if (!metricsStore[component][implementation].operations[operation]) {
      metricsStore[component][implementation].operations[operation] = {
        totalDuration: 0,
        callCount: 0,
        errorCount: 0
      };
    }
    
    const opData = metricsStore[component][implementation].operations[operation];
    opData.totalDuration += duration;
    opData.callCount += 1;
    
    if (!success) {
      opData.errorCount += 1;
    }
  });
}

exports.handler = async (event, context) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle OPTIONS request for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: ''
    };
  }

  try {
    // Handle POST request to collect metrics
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body);
      const metrics = body.metrics || [];
      
      // Store the metrics
      storeMetrics(metrics);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, metricsStored: metrics.length })
      };
    }
    
    // Handle GET request to fetch metrics
    const params = event.queryStringParameters || {};
    const component = params.component || 'assetDao';
    const endpoint = params.endpoint;
    
    // Return comparison data for specific component
    if (endpoint === 'comparison') {
      const comparison = generateComparisonData(component);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(comparison)
      };
    }
    
    // Return raw metrics for component
    if (metricsStore[component]) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(metricsStore[component])
      };
    }
    
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: `No metrics found for component: ${component}` })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to process metrics request', details: error.message })
    };
  }
};
