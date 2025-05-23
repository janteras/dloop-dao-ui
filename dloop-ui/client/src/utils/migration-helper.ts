/**
 * Migration Helper Utility
 * 
 * Provides tools and utilities to assist developers in migrating
 * from Ethers.js to Wagmi. This includes code analysis, pattern detection,
 * and automatic code transformation suggestions.
 */

import { MigrationAudit } from './migration-audit';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Pattern mappings from Ethers to Wagmi
 */
export const MIGRATION_PATTERNS = {
  // Direct imports
  'import { ethers } from "ethers"': 'import { useAccount, useContract, useContractRead, useContractWrite } from "wagmi"',
  'import { Contract } from "ethers"': 'import { useContract } from "wagmi"',
  
  // Contract instantiation
  'new ethers.Contract(': 'useContract({',
  'new Contract(': 'useContract({',
  
  // Provider access
  'ethers.providers': 'useProvider()',
  'provider.getSigner()': 'useAccount()',
  
  // Contract reads
  'contract.functionName(': 'useContractRead({ functionName: "functionName", args: [',
  'await contract.functionName(': 'const { data } = useContractRead({ functionName: "functionName", args: [',
  
  // Contract writes
  'await contract.connect(signer).functionName(': 'const { write } = useContractWrite({ functionName: "functionName", args: [',
  
  // Event listeners
  'contract.on(': 'useContractEvent({ eventName:',
  
  // Utils
  'ethers.utils.formatEther(': 'formatEther(',
  'ethers.utils.parseEther(': 'parseEther(',
  'ethers.utils.formatUnits(': 'formatUnits(',
  'ethers.utils.parseUnits(': 'parseUnits(',
  
  // BigNumber
  'ethers.BigNumber.from(': 'parseUnits(',
};

/**
 * Suggested import replacements
 */
export const IMPORT_REPLACEMENTS = {
  'ethers': {
    imports: [
      'useAccount',
      'useBalance',
      'useBlockNumber',
      'useContract',
      'useContractRead',
      'useContractWrite',
      'useContractEvent',
      'useProvider',
      'useSigner'
    ],
    from: 'wagmi'
  },
  'ethers.utils': {
    imports: [
      'formatEther',
      'parseEther',
      'formatUnits',
      'parseUnits'
    ],
    from: 'ethers/lib/utils' // These utilities can still be imported directly from ethers
  },
  'ethers.BigNumber': {
    imports: [
      'parseUnits' // Use parseUnits instead of BigNumber.from in most cases
    ],
    from: 'ethers/lib/utils'
  }
};

/**
 * Component transformation suggestions
 */
export const COMPONENT_TRANSFORMATIONS = {
  'useState + useEffect for contract data': `
// Before:
const [data, setData] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const result = await contract.getData();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  fetchData();
}, [contract]);

// After:
const { data, isLoading, isError, error } = useContractRead({
  address: contractAddress,
  abi: contractAbi,
  functionName: 'getData',
  watch: true
});
`,

  'Contract write with state management': `
// Before:
const [isSubmitting, setIsSubmitting] = useState(false);
const [txHash, setTxHash] = useState(null);

const handleSubmit = async () => {
  try {
    setIsSubmitting(true);
    const tx = await contract.connect(signer).setValue(newValue);
    setTxHash(tx.hash);
    await tx.wait();
    // Handle success
  } catch (err) {
    // Handle error
  } finally {
    setIsSubmitting(false);
  }
};

// After:
const { write, isLoading, isSuccess, isError, data, error } = useContractWrite({
  address: contractAddress,
  abi: contractAbi,
  functionName: 'setValue',
});

const handleSubmit = () => {
  write({ args: [newValue] });
};
`,

  'Event listener setup': `
// Before:
useEffect(() => {
  const handleEvent = (value) => {
    // Handle event
  };
  
  contract.on('ValueChanged', handleEvent);
  
  return () => {
    contract.off('ValueChanged', handleEvent);
  };
}, [contract]);

// After:
useContractEvent({
  address: contractAddress,
  abi: contractAbi,
  eventName: 'ValueChanged',
  listener(value) {
    // Handle event
  },
});
`
};

/**
 * Interface for migration suggestions
 */
export interface MigrationSuggestion {
  file: string;
  line: number;
  original: string;
  suggested: string;
  confidence: 'high' | 'medium' | 'low';
  patternType: string;
}

/**
 * Interface for component transformation result
 */
export interface ComponentTransformation {
  componentName: string;
  original: string;
  transformed: string;
  imports: string[];
  hooks: string[];
}

/**
 * Migration Helper class
 */
export class MigrationHelper {
  private auditTool: MigrationAudit;
  
  constructor() {
    this.auditTool = new MigrationAudit();
  }
  
  /**
   * Generate migration suggestions for a file
   * @param filePath Path to the file to analyze
   * @returns Promise resolving to an array of migration suggestions
   */
  public async generateSuggestions(filePath: string): Promise<MigrationSuggestion[]> {
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      const suggestions: MigrationSuggestion[] = [];
      
      // Analyze each line for patterns
      lines.forEach((line, index) => {
        for (const [pattern, replacement] of Object.entries(MIGRATION_PATTERNS)) {
          if (line.includes(pattern)) {
            let suggested = line.replace(pattern, replacement);
            
            // Adjust the suggested code based on the pattern type
            if (pattern.includes('new ethers.Contract(') || 
                pattern.includes('new Contract(')) {
              // Transform contract instantiation syntax
              suggested = this.transformContractInstantiation(line);
            } else if (pattern.includes('contract.') && 
                       (pattern.includes('(') || pattern.includes('='))) {
              // Transform contract method calls
              suggested = this.transformContractMethodCall(line);
            }
            
            suggestions.push({
              file: filePath,
              line: index + 1,
              original: line,
              suggested,
              confidence: this.determineConfidence(line, pattern),
              patternType: this.determinePatternType(pattern)
            });
            
            // Only apply the first matching pattern per line
            break;
          }
        }
      });
      
      // Check for import statements that need updating
      this.analyzeImports(content, filePath, suggestions);
      
      return suggestions;
    } catch (error) {
      console.error(`Error generating suggestions for ${filePath}:`, error);
      return [];
    }
  }
  
  /**
   * Analyze and suggest import replacements
   */
  private analyzeImports(content: string, filePath: string, suggestions: MigrationSuggestion[]): void {
    const importRegex = /import\s+(?:{([^}]+)})?\s*(?:from\s+['"]([^'"]+)['"])?/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const [fullImport, namedImports, packageName] = match;
      
      // Check for ethers imports
      if (packageName === 'ethers' || packageName?.includes('ethers/')) {
        const lineNumber = this.getLineNumber(content, match.index);
        
        // Determine which Wagmi imports to suggest
        const suggestedImports = this.suggestWagmiImports(namedImports, packageName);
        
        suggestions.push({
          file: filePath,
          line: lineNumber,
          original: fullImport,
          suggested: suggestedImports,
          confidence: 'high',
          patternType: 'import'
        });
      }
    }
  }
  
  /**
   * Suggest Wagmi imports based on Ethers imports
   */
  private suggestWagmiImports(namedImports: string, packageName: string): string {
    if (!namedImports) {
      return `import { useProvider } from 'wagmi'`;
    }
    
    const imports = namedImports.split(',').map(i => i.trim());
    const wagmiImports: string[] = [];
    
    imports.forEach(imp => {
      if (imp === 'ethers') {
        wagmiImports.push('useProvider', 'useAccount');
      } else if (imp === 'Contract') {
        wagmiImports.push('useContract');
      } else if (imp === 'providers') {
        wagmiImports.push('useProvider');
      } else if (imp === 'utils') {
        wagmiImports.push('formatEther', 'parseEther', 'formatUnits', 'parseUnits');
      }
    });
    
    const uniqueImports = [...new Set(wagmiImports)];
    return `import { ${uniqueImports.join(', ')} } from 'wagmi'`;
  }
  
  /**
   * Transform Ethers contract instantiation to Wagmi hook
   */
  private transformContractInstantiation(line: string): string {
    // Basic transformation for demo purposes
    // A real implementation would use AST parsing for more accurate transformations
    return line
      .replace(/new ethers\.Contract\(([^,]+),\s*([^,]+),\s*([^)]+)\)/, 
               'useContract({ address: $1, abi: $2, signerOrProvider: $3 })')
      .replace(/new Contract\(([^,]+),\s*([^,]+),\s*([^)]+)\)/, 
               'useContract({ address: $1, abi: $2, signerOrProvider: $3 })');
  }
  
  /**
   * Transform Ethers contract method calls to Wagmi hooks
   */
  private transformContractMethodCall(line: string): string {
    // Extract method name and args
    const methodMatch = line.match(/contract\.([a-zA-Z0-9_]+)\(([^)]*)\)/);
    if (!methodMatch) return line;
    
    const [fullMethod, methodName, args] = methodMatch;
    
    // Check if it's likely a read or write operation
    if (line.includes('await') || line.includes('then(')) {
      if (line.includes('connect(signer)')) {
        // Write operation
        return line.replace(
          /await\s+contract\.connect\(signer\)\.([a-zA-Z0-9_]+)\(([^)]*)\)/,
          `const { write } = useContractWrite({
  functionName: '$1',
  args: [$2],
  onSuccess: (data) => {
    // Handle success
  }
})`
        );
      } else {
        // Read operation
        return line.replace(
          /await\s+contract\.([a-zA-Z0-9_]+)\(([^)]*)\)/,
          `const { data } = useContractRead({
  functionName: '$1',
  args: [$2],
  watch: true
})`
        );
      }
    } else {
      // Simple method call without await
      return line.replace(
        /contract\.([a-zA-Z0-9_]+)\(([^)]*)\)/,
        `useContractRead({
  functionName: '$1',
  args: [$2]
}).data`
      );
    }
  }
  
  /**
   * Determine the confidence level of a suggestion
   */
  private determineConfidence(line: string, pattern: string): 'high' | 'medium' | 'low' {
    // Direct imports and contract instantiations are high confidence
    if (pattern.includes('import') || 
        pattern.includes('new ethers.Contract') || 
        pattern.includes('new Contract')) {
      return 'high';
    }
    
    // Method calls are medium confidence
    if (pattern.includes('contract.')) {
      return 'medium';
    }
    
    // Everything else is low confidence
    return 'low';
  }
  
  /**
   * Determine the pattern type for categorization
   */
  private determinePatternType(pattern: string): string {
    if (pattern.includes('import')) {
      return 'import';
    } else if (pattern.includes('new ethers.Contract') || 
               pattern.includes('new Contract')) {
      return 'contract-instantiation';
    } else if (pattern.includes('contract.') && !pattern.includes('on(')) {
      return 'method-call';
    } else if (pattern.includes('.on(')) {
      return 'event-listener';
    } else if (pattern.includes('utils')) {
      return 'utility';
    } else {
      return 'other';
    }
  }
  
  /**
   * Get the line number from character index
   */
  private getLineNumber(content: string, index: number): number {
    const contentSubstring = content.substring(0, index);
    return (contentSubstring.match(/\n/g) || []).length + 1;
  }
  
  /**
   * Analyze a React component for potential transformations
   * @param componentPath Path to the component file
   * @returns Promise resolving to component transformation
   */
  public async analyzeComponent(componentPath: string): Promise<ComponentTransformation | null> {
    try {
      const content = await fs.promises.readFile(componentPath, 'utf-8');
      const componentName = path.basename(componentPath, path.extname(componentPath));
      
      // Look for common React + Ethers patterns
      const usesEthersContract = content.includes('new ethers.Contract') || 
                                 content.includes('new Contract');
      
      const usesContractMethods = Boolean(content.match(/contract\.[a-zA-Z0-9_]+\(/));
      
      const usesEventListeners = content.includes('contract.on(') || 
                                 content.includes('contract.addEventListener');
      
      const usesStateForContractData = Boolean(content.match(/useState\([^)]*\).*useEffect\([^{]*{[^}]*contract\.[a-zA-Z0-9_]+\(/s));
      
      // Determine which transformation to apply
      let transformed = content;
      const imports: string[] = [];
      const hooks: string[] = [];
      
      if (usesStateForContractData) {
        // Add React Query imports
        imports.push(
          "import { useQuery } from 'react-query'",
          "import { useContract, useContractRead } from 'wagmi'"
        );
        hooks.push('useContractRead', 'useQuery');
      }
      
      if (usesEthersContract) {
        imports.push("import { useContract } from 'wagmi'");
        hooks.push('useContract');
      }
      
      if (usesContractMethods) {
        imports.push("import { useContractRead, useContractWrite } from 'wagmi'");
        hooks.push('useContractRead', 'useContractWrite');
      }
      
      if (usesEventListeners) {
        imports.push("import { useContractEvent } from 'wagmi'");
        hooks.push('useContractEvent');
      }
      
      // If no transformations apply, return null
      if (!usesEthersContract && !usesContractMethods && 
          !usesEventListeners && !usesStateForContractData) {
        return null;
      }
      
      return {
        componentName,
        original: content,
        transformed, // In a real implementation, we'd apply actual transformations
        imports: [...new Set(imports)],
        hooks: [...new Set(hooks)]
      };
    } catch (error) {
      console.error(`Error analyzing component ${componentPath}:`, error);
      return null;
    }
  }
  
  /**
   * Generate a migration report for a directory
   * @param directoryPath Directory to analyze
   * @returns Promise resolving to the audit report and suggestions
   */
  public async generateMigrationReport(directoryPath: string) {
    // Run audit first
    const auditReport = await this.auditTool.runMigrationAudit({
      includePaths: [directoryPath]
    });
    
    // Generate suggestions for files with issues
    const suggestions: Record<string, MigrationSuggestion[]> = {};
    
    for (const result of auditReport.results) {
      if (!suggestions[result.file]) {
        suggestions[result.file] = await this.generateSuggestions(result.file);
      }
    }
    
    return {
      auditReport,
      suggestions
    };
  }
  
  /**
   * Create a unified component template
   * @param componentName Name of the component
   * @param hooks Hooks to include
   * @returns Template string for the unified component
   */
  public createUnifiedComponentTemplate(
    componentName: string,
    hooks: string[] = []
  ): string {
    const includeAssetDao = hooks.includes('useAssetDaoContract');
    const includeTokenVault = hooks.includes('useTokenVaultContract');
    
    let imports = `import React, { useState, useEffect } from 'react';\n`;
    
    if (includeAssetDao) {
      imports += `import { useUnifiedAssetDaoContract } from '@/hooks/unified/useUnifiedAssetDaoContract';\n`;
    }
    
    if (includeTokenVault) {
      imports += `import { useUnifiedTokenVaultContract } from '@/hooks/unified/useUnifiedTokenVaultContract';\n`;
    }
    
    return `${imports}
/**
 * Unified ${componentName} Component
 * 
 * This component uses the unified pattern to support both Ethers.js and Wagmi implementations.
 */
export interface Unified${componentName}Props {
  implementation?: 'ethers' | 'wagmi';
  // Add other props here
}

export const Unified${componentName}: React.FC<Unified${componentName}Props> = ({
  implementation,
  // Destructure other props
}) => {
  ${includeAssetDao ? 
    `// Get the contract using the unified hook
  const { 
    implementation: activeImplementation,
    // Add required methods here
  } = useUnifiedAssetDaoContract({ implementation });\n` : ''}
  
  ${includeTokenVault ? 
    `// Get the token vault contract using the unified hook
  const { 
    implementation: vaultImplementation,
    // Add required methods here
  } = useUnifiedTokenVaultContract({ implementation });\n` : ''}
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Add other state variables
  
  // Fetch data effect
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Fetch data using the unified contract
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [/* dependencies */]);
  
  // Handle loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // Handle error state
  if (error) {
    return <div>Error: {error.message}</div>;
  }
  
  return (
    <div className="unified-${componentName.toLowerCase()}">
      <div className="text-xs text-gray-500 mb-2">
        Using {activeImplementation || implementation || 'default'} implementation
      </div>
      
      {/* Component content goes here */}
    </div>
  );
};`;
  }
}

// Export singleton instance
export const migrationHelper = new MigrationHelper();
