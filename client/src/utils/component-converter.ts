/**
 * Component Converter Utility
 * 
 * Provides automated tools to convert React components using Ethers.js
 * to components that use Wagmi or the unified pattern.
 */

import * as fs from 'fs';
import * as path from 'path';
import { migrationHelper, ComponentTransformation } from './migration-helper';

/**
 * Options for component conversion
 */
export interface ConversionOptions {
  targetPattern: 'unified' | 'wagmi-only' | 'react-query';
  outputDir?: string;
  preserveOriginal?: boolean;
  addComments?: boolean;
}

/**
 * Result of a component conversion
 */
export interface ConversionResult {
  originalPath: string;
  newPath: string;
  componentName: string;
  conversionType: 'unified' | 'wagmi-only' | 'react-query';
  hooksAdded: string[];
  success: boolean;
}

/**
 * Component Converter class
 */
export class ComponentConverter {
  /**
   * Convert a component from using Ethers to the specified pattern
   * @param componentPath Path to the component file
   * @param options Conversion options
   * @returns Promise resolving to the conversion result
   */
  public async convertComponent(
    componentPath: string,
    options: ConversionOptions
  ): Promise<ConversionResult> {
    const componentName = path.basename(componentPath, path.extname(componentPath));
    const fileExt = path.extname(componentPath);
    
    try {
      // Analyze the component
      const analysis = await migrationHelper.analyzeComponent(componentPath);
      
      if (!analysis) {
        throw new Error(`Could not analyze component: ${componentPath}`);
      }
      
      // Determine the output path
      const outputDir = options.outputDir || path.dirname(componentPath);
      let outputPath = '';
      
      switch (options.targetPattern) {
        case 'unified':
          outputPath = path.join(outputDir, `Unified${componentName}${fileExt}`);
          break;
        case 'wagmi-only':
          outputPath = path.join(outputDir, `${componentName}.wagmi${fileExt}`);
          break;
        case 'react-query':
          outputPath = path.join(outputDir, `Optimized${componentName}${fileExt}`);
          break;
        default:
          outputPath = path.join(outputDir, `${componentName}.migrated${fileExt}`);
      }
      
      // Generate the converted component code
      const convertedCode = await this.generateConvertedCode(
        analysis,
        options.targetPattern,
        options.addComments || false
      );
      
      // Create directory if it doesn't exist
      await fs.promises.mkdir(outputDir, { recursive: true });
      
      // Write the converted component to file
      await fs.promises.writeFile(outputPath, convertedCode, 'utf-8');
      
      return {
        originalPath: componentPath,
        newPath: outputPath,
        componentName,
        conversionType: options.targetPattern,
        hooksAdded: analysis.hooks,
        success: true
      };
    } catch (error) {
      console.error(`Error converting component ${componentPath}:`, error);
      
      return {
        originalPath: componentPath,
        newPath: '',
        componentName,
        conversionType: options.targetPattern,
        hooksAdded: [],
        success: false
      };
    }
  }
  
  /**
   * Generate the converted code for a component
   * @param analysis Component analysis result
   * @param targetPattern Target conversion pattern
   * @param addComments Whether to add migration comments
   * @returns Promise resolving to the converted code
   */
  private async generateConvertedCode(
    analysis: ComponentTransformation,
    targetPattern: ConversionOptions['targetPattern'],
    addComments: boolean
  ): Promise<string> {
    switch (targetPattern) {
      case 'unified':
        return this.generateUnifiedComponent(analysis, addComments);
      case 'wagmi-only':
        return this.generateWagmiComponent(analysis, addComments);
      case 'react-query':
        return this.generateReactQueryComponent(analysis, addComments);
      default:
        throw new Error(`Unsupported target pattern: ${targetPattern}`);
    }
  }
  
  /**
   * Generate a unified component
   * @param analysis Component analysis
   * @param addComments Whether to add migration comments
   * @returns The unified component code
   */
  private generateUnifiedComponent(
    analysis: ComponentTransformation,
    addComments: boolean
  ): string {
    const componentName = analysis.componentName;
    
    // Determine if this component needs contract access
    const needsAssetDaoContract = analysis.original.includes('AssetDaoContract') ||
                                analysis.original.toLowerCase().includes('assetdao');
    
    const needsTokenVaultContract = analysis.original.includes('TokenVaultContract') ||
                                   analysis.original.toLowerCase().includes('tokenvault');
    
    const hooks = [
      ...(needsAssetDaoContract ? ['useAssetDaoContract'] : []),
      ...(needsTokenVaultContract ? ['useTokenVaultContract'] : [])
    ];
    
    // Generate the unified component template
    const template = migrationHelper.createUnifiedComponentTemplate(componentName, hooks);
    
    // Add migration comments if requested
    if (addComments) {
      return `/**
 * MIGRATION NOTICE
 * 
 * This component was automatically converted to use the unified pattern
 * from an Ethers.js implementation. Please review and adjust as needed.
 * 
 * Original component: ${componentName}
 * Migration date: ${new Date().toISOString()}
 * 
 * Detected hooks: ${analysis.hooks.join(', ')}
 */

${template}`;
    }
    
    return template;
  }
  
  /**
   * Generate a Wagmi-only component
   * @param analysis Component analysis
   * @param addComments Whether to add migration comments
   * @returns The Wagmi component code
   */
  private generateWagmiComponent(
    analysis: ComponentTransformation,
    addComments: boolean
  ): string {
    // Start with the original content
    let code = analysis.original;
    
    // Replace imports
    if (code.includes('import { ethers }') || code.includes('import { Contract }')) {
      code = code.replace(
        /import\s+{([^}]+)}\s+from\s+['"]ethers['"]/g,
        'import { useContract, useContractRead, useContractWrite, useAccount } from "wagmi"'
      );
    }
    
    // Replace new Contract instantiations
    code = code.replace(
      /new\s+(ethers\.)?Contract\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g,
      'useContract({ address: $2, abi: $3, signerOrProvider: $4 })'
    );
    
    // Replace contract method calls (simplified for demonstration)
    code = code.replace(
      /await\s+contract\.([a-zA-Z0-9_]+)\(([^)]*)\)/g,
      'const { data } = await useContractRead({ functionName: "$1", args: [$2] })'
    );
    
    // Replace contract write operations (simplified)
    code = code.replace(
      /await\s+contract\.connect\(signer\)\.([a-zA-Z0-9_]+)\(([^)]*)\)/g,
      'const { write } = useContractWrite({ functionName: "$1", args: [$2] }); await write()'
    );
    
    // Add migration comments if requested
    if (addComments) {
      return `/**
 * MIGRATION NOTICE
 * 
 * This component was automatically converted to use Wagmi hooks
 * from an Ethers.js implementation. Please review and adjust as needed.
 * 
 * Original component: ${analysis.componentName}
 * Migration date: ${new Date().toISOString()}
 * 
 * Note: This is an automated conversion and may require manual adjustments.
 */

${code}`;
    }
    
    return code;
  }
  
  /**
   * Generate a React Query optimized component
   * @param analysis Component analysis
   * @param addComments Whether to add migration comments
   * @returns The React Query optimized component code
   */
  private generateReactQueryComponent(
    analysis: ComponentTransformation,
    addComments: boolean
  ): string {
    const componentName = analysis.componentName;
    const optimizedName = `Optimized${componentName}`;
    
    // Determine contract type and corresponding query hooks
    const isAssetDao = analysis.original.includes('AssetDaoContract') ||
                      analysis.original.toLowerCase().includes('assetdao');
    
    const isTokenVault = analysis.original.includes('TokenVaultContract') ||
                        analysis.original.toLowerCase().includes('tokenvault');
    
    const queryImports = [];
    
    if (isAssetDao) {
      queryImports.push(
        'useProposalsQuery',
        'useProposalQuery',
        'useProposalVoteMutation',
        'useProposalExecuteMutation'
      );
    }
    
    if (isTokenVault) {
      queryImports.push(
        'useTokensQuery',
        'useTokenBalanceQuery',
        'useTokenTransferMutation'
      );
    }
    
    // Generate imports
    let imports = `import React from 'react';\n`;
    imports += `import { QueryClient, QueryClientProvider } from 'react-query';\n`;
    
    if (queryImports.length > 0) {
      if (isAssetDao) {
        imports += `import { ${queryImports.join(', ')} } from '@/hooks/query/useAssetDaoQueries';\n`;
      }
      
      if (isTokenVault) {
        imports += `import { ${queryImports.filter(i => i.includes('Token')).join(', ')} } from '@/hooks/query/useTokenVaultQueries';\n`;
      }
    }
    
    // Basic component template for React Query version
    const template = `${imports}
/**
 * ${optimizedName} Component
 * 
 * An optimized version of ${componentName} using React Query for
 * improved data fetching, caching, and state management.
 */
export interface ${optimizedName}Props {
  implementation?: 'ethers' | 'wagmi';
  // Add other props here
}

export const ${optimizedName}: React.FC<${optimizedName}Props> = ({
  implementation = 'ethers',
  // Destructure other props
}) => {
  // Use React Query hooks
  ${isAssetDao ? 
    `const { 
    data, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useProposalsQuery({ limit: 10, offset: 0 }, {}, implementation);
  
  const voteMutation = useProposalVoteMutation(implementation);
  const executeMutation = useProposalExecuteMutation(implementation);\n` : ''}
  
  ${isTokenVault ? 
    `const { 
    data: tokens, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useTokensQuery({ limit: 10, offset: 0 }, implementation);
  
  const transferMutation = useTokenTransferMutation(implementation);\n` : ''}
  
  // Handle loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // Handle error state
  if (isError) {
    return <div>Error: {error?.message || 'Unknown error'}</div>;
  }
  
  // Handle mutations
  ${isAssetDao ? 
    `const handleVote = async (proposalId: number, support: boolean) => {
    try {
      await voteMutation.mutateAsync({ proposalId, support });
      // Handle success
    } catch (err) {
      // Handle error
    }
  };
  
  const handleExecute = async (proposalId: number) => {
    try {
      await executeMutation.mutateAsync({ proposalId });
      // Handle success
    } catch (err) {
      // Handle error
    }
  };\n` : ''}
  
  ${isTokenVault ? 
    `const handleTransfer = async (tokenId: string, to: string, amount: string) => {
    try {
      await transferMutation.mutateAsync({ tokenId, to, amount });
      // Handle success
    } catch (err) {
      // Handle error
    }
  };\n` : ''}
  
  return (
    <div className="optimized-component">
      <div className="text-xs text-gray-500 mb-2">
        Using {implementation} implementation with React Query
      </div>
      
      {/* Component content goes here */}
      ${isAssetDao ? 
        `{data?.map(proposal => (
        <div key={proposal.id} className="proposal-item">
          <h3>{proposal.title}</h3>
          <p>{proposal.description}</p>
          <div className="actions">
            <button 
              onClick={() => handleVote(proposal.id, true)}
              disabled={voteMutation.isLoading}
            >
              Vote Yes
            </button>
            <button 
              onClick={() => handleVote(proposal.id, false)}
              disabled={voteMutation.isLoading}
            >
              Vote No
            </button>
            {proposal.state === 'Succeeded' && (
              <button 
                onClick={() => handleExecute(proposal.id)}
                disabled={executeMutation.isLoading}
              >
                Execute
              </button>
            )}
          </div>
        </div>
      ))}\n` : ''}
      
      ${isTokenVault ? 
        `{tokens?.map(token => (
        <div key={token.id} className="token-item">
          <h3>{token.name} ({token.symbol})</h3>
          <p>Balance: {token.balance}</p>
          <div className="actions">
            <button 
              onClick={() => handleTransfer(token.id, '', '0')}
              disabled={transferMutation.isLoading}
            >
              Transfer
            </button>
          </div>
        </div>
      ))}\n` : ''}
    </div>
  );
};`;
    
    // Add migration comments if requested
    if (addComments) {
      return `/**
 * MIGRATION NOTICE
 * 
 * This component was automatically converted to use React Query
 * from an Ethers.js implementation. Please review and adjust as needed.
 * 
 * Original component: ${componentName}
 * Migration date: ${new Date().toISOString()}
 * 
 * This optimized version uses React Query for improved data fetching,
 * automatic caching, and simplified state management.
 */

${template}`;
    }
    
    return template;
  }
  
  /**
   * Batch convert multiple components
   * @param componentPaths List of component paths to convert
   * @param options Conversion options
   * @returns Promise resolving to array of conversion results
   */
  public async batchConvert(
    componentPaths: string[],
    options: ConversionOptions
  ): Promise<ConversionResult[]> {
    const results: ConversionResult[] = [];
    
    for (const path of componentPaths) {
      const result = await this.convertComponent(path, options);
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Find and convert components in a directory
   * @param directoryPath Path to directory to scan for components
   * @param options Conversion options
   * @param pattern Filename pattern to match (default: *.tsx)
   * @returns Promise resolving to array of conversion results
   */
  public async convertDirectory(
    directoryPath: string,
    options: ConversionOptions,
    pattern = '*.tsx'
  ): Promise<ConversionResult[]> {
    // Get list of files in directory (this would use fs in a real implementation)
    const files = await this.getFilesInDirectory(directoryPath, pattern);
    
    return this.batchConvert(files, options);
  }
  
  /**
   * Get files in a directory matching a pattern
   * @param directoryPath Path to directory
   * @param pattern File pattern to match
   * @returns Promise resolving to array of file paths
   */
  private async getFilesInDirectory(
    directoryPath: string,
    pattern: string
  ): Promise<string[]> {
    // In a real implementation, this would use glob or similar
    try {
      const files = await fs.promises.readdir(directoryPath);
      const ext = pattern.replace('*', '');
      
      return files
        .filter(file => file.endsWith(ext))
        .map(file => path.join(directoryPath, file));
    } catch (error) {
      console.error(`Error getting files in directory ${directoryPath}:`, error);
      return [];
    }
  }
}

// Export singleton instance
export const componentConverter = new ComponentConverter();
