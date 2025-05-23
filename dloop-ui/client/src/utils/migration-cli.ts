#!/usr/bin/env node
/**
 * Migration CLI Tool
 * 
 * A command-line interface for the migration utilities to help developers
 * migrate components from Ethers to Wagmi.
 */

import * as path from 'path';
import * as fs from 'fs';
import { migrationHelper } from './migration-helper';
import { componentConverter, ConversionOptions } from './component-converter';

// Simple CLI argument parser
const args = process.argv.slice(2);
const command = args[0];

// Helper function to print usage
function printUsage() {
  console.log(`
Migration CLI Tool

Usage:
  migration-cli analyze <file-or-directory>     Analyze a file or directory for migration issues
  migration-cli suggestions <file>              Generate migration suggestions for a file
  migration-cli convert <file> [options]        Convert a component to use the unified pattern
  migration-cli batch <directory> [options]     Batch convert components in a directory
  migration-cli report [directory]              Generate a migration report
  migration-cli help                            Show this help message

Options for convert and batch commands:
  --pattern=<pattern>    Target pattern (unified, wagmi-only, react-query)
  --output=<directory>   Output directory for converted files
  --comments             Add migration comments to the converted files
  --preserve             Preserve the original files

Examples:
  migration-cli analyze src/components
  migration-cli suggestions src/components/ProposalList.tsx
  migration-cli convert src/components/ProposalList.tsx --pattern=unified
  migration-cli batch src/components --pattern=unified --output=src/components/unified
  migration-cli report src/components
`);
}

// Parse options for convert and batch commands
function parseOptions(args: string[]): ConversionOptions {
  const options: ConversionOptions = {
    targetPattern: 'unified',
    preserveOriginal: false,
    addComments: false
  };
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--pattern=')) {
      const pattern = arg.split('=')[1];
      
      if (['unified', 'wagmi-only', 'react-query'].includes(pattern)) {
        options.targetPattern = pattern as ConversionOptions['targetPattern'];
      } else {
        console.error(`Invalid pattern: ${pattern}`);
        process.exit(1);
      }
    } else if (arg.startsWith('--output=')) {
      options.outputDir = arg.split('=')[1];
    } else if (arg === '--comments') {
      options.addComments = true;
    } else if (arg === '--preserve') {
      options.preserveOriginal = true;
    }
  }
  
  return options;
}

// Validate path
function validatePath(filePath: string): string {
  const resolvedPath = path.resolve(process.cwd(), filePath);
  
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: Path does not exist: ${resolvedPath}`);
    process.exit(1);
  }
  
  return resolvedPath;
}

// Implement commands
async function main() {
  if (!command || command === 'help') {
    printUsage();
    return;
  }
  
  try {
    switch (command) {
      case 'analyze': {
        const target = args[1];
        
        if (!target) {
          console.error('Error: Missing file or directory argument');
          process.exit(1);
        }
        
        const resolvedPath = validatePath(target);
        
        if (fs.statSync(resolvedPath).isDirectory()) {
          console.log(`Analyzing directory: ${resolvedPath}`);
          
          // Run migration audit on directory
          const report = await migrationHelper.generateMigrationReport(resolvedPath);
          
          console.log('\nMigration Analysis Report:');
          console.log(`- Migration completion: ${report.auditReport.summary.migrationCompletionPercentage}%`);
          console.log(`- Files analyzed: ${report.auditReport.summary.filesAnalyzed}`);
          console.log(`- Files with issues: ${report.auditReport.summary.filesWithIssues}`);
          console.log(`- Total issues: ${report.auditReport.summary.totalIssues}`);
          
          console.log('\nFiles requiring migration:');
          for (const result of report.auditReport.results) {
            console.log(`- ${result.file} (${result.issues.length} issues)`);
          }
        } else {
          console.log(`Analyzing file: ${resolvedPath}`);
          
          const suggestions = await migrationHelper.generateSuggestions(resolvedPath);
          
          console.log(`\nFound ${suggestions.length} migration suggestions:`);
          for (const suggestion of suggestions) {
            console.log(`\nLine ${suggestion.line} (${suggestion.patternType}, confidence: ${suggestion.confidence}):`);
            console.log(`- Original: ${suggestion.original.trim()}`);
            console.log(`- Suggested: ${suggestion.suggested.trim()}`);
          }
        }
        break;
      }
      
      case 'suggestions': {
        const filePath = args[1];
        
        if (!filePath) {
          console.error('Error: Missing file argument');
          process.exit(1);
        }
        
        const resolvedPath = validatePath(filePath);
        
        if (fs.statSync(resolvedPath).isDirectory()) {
          console.error('Error: Expected a file, but got a directory');
          process.exit(1);
        }
        
        console.log(`Generating migration suggestions for: ${resolvedPath}`);
        
        const suggestions = await migrationHelper.generateSuggestions(resolvedPath);
        
        console.log(`\nFound ${suggestions.length} migration suggestions:`);
        for (const suggestion of suggestions) {
          console.log(`\nLine ${suggestion.line} (${suggestion.patternType}, confidence: ${suggestion.confidence}):`);
          console.log(`- Original: ${suggestion.original.trim()}`);
          console.log(`- Suggested: ${suggestion.suggested.trim()}`);
        }
        break;
      }
      
      case 'convert': {
        const filePath = args[1];
        
        if (!filePath) {
          console.error('Error: Missing file argument');
          process.exit(1);
        }
        
        const resolvedPath = validatePath(filePath);
        
        if (fs.statSync(resolvedPath).isDirectory()) {
          console.error('Error: Expected a file, but got a directory');
          process.exit(1);
        }
        
        const options = parseOptions(args);
        
        console.log(`Converting component: ${resolvedPath}`);
        console.log(`Target pattern: ${options.targetPattern}`);
        
        const result = await componentConverter.convertComponent(resolvedPath, options);
        
        if (result.success) {
          console.log(`\nConversion successful!`);
          console.log(`- Original: ${result.originalPath}`);
          console.log(`- New: ${result.newPath}`);
          console.log(`- Added hooks: ${result.hooksAdded.join(', ') || 'none'}`);
        } else {
          console.error(`\nConversion failed for ${resolvedPath}`);
        }
        break;
      }
      
      case 'batch': {
        const directoryPath = args[1];
        
        if (!directoryPath) {
          console.error('Error: Missing directory argument');
          process.exit(1);
        }
        
        const resolvedPath = validatePath(directoryPath);
        
        if (!fs.statSync(resolvedPath).isDirectory()) {
          console.error('Error: Expected a directory, but got a file');
          process.exit(1);
        }
        
        const options = parseOptions(args);
        
        console.log(`Batch converting components in: ${resolvedPath}`);
        console.log(`Target pattern: ${options.targetPattern}`);
        
        const results = await componentConverter.convertDirectory(resolvedPath, options);
        
        console.log(`\nBatch conversion complete! Converted ${results.filter(r => r.success).length}/${results.length} components.`);
        
        console.log('\nSuccessful conversions:');
        for (const result of results.filter(r => r.success)) {
          console.log(`- ${result.componentName} -> ${path.basename(result.newPath)}`);
        }
        
        if (results.some(r => !r.success)) {
          console.log('\nFailed conversions:');
          for (const result of results.filter(r => !r.success)) {
            console.log(`- ${result.componentName}`);
          }
        }
        break;
      }
      
      case 'report': {
        const directoryPath = args[1] || '.';
        const resolvedPath = validatePath(directoryPath);
        
        if (!fs.statSync(resolvedPath).isDirectory()) {
          console.error('Error: Expected a directory, but got a file');
          process.exit(1);
        }
        
        console.log(`Generating migration report for: ${resolvedPath}`);
        
        const report = await migrationHelper.generateMigrationReport(resolvedPath);
        
        console.log('\nMigration Report:');
        console.log(`- Migration completion: ${report.auditReport.summary.migrationCompletionPercentage}%`);
        console.log(`- Files analyzed: ${report.auditReport.summary.filesAnalyzed}`);
        console.log(`- Files with issues: ${report.auditReport.summary.filesWithIssues}`);
        console.log(`- Total issues: ${report.auditReport.summary.totalIssues}`);
        
        console.log('\nTop migration suggestions:');
        
        // Get the top 5 files with the most suggestions
        const topFiles = Object.entries(report.suggestions)
          .sort((a, b) => b[1].length - a[1].length)
          .slice(0, 5);
        
        for (const [file, suggestions] of topFiles) {
          console.log(`\n${path.basename(file)} (${suggestions.length} suggestions):`);
          
          // Show top 3 suggestions per file
          for (const suggestion of suggestions.slice(0, 3)) {
            console.log(`  Line ${suggestion.line} (${suggestion.patternType}):`);
            console.log(`  - Original: ${suggestion.original.trim()}`);
            console.log(`  - Suggested: ${suggestion.suggested.trim()}`);
          }
          
          if (suggestions.length > 3) {
            console.log(`  ... and ${suggestions.length - 3} more suggestions`);
          }
        }
        
        // Create a detailed report file
        const reportDir = path.join(process.cwd(), 'migration-reports');
        fs.mkdirSync(reportDir, { recursive: true });
        
        const reportFile = path.join(reportDir, `migration-report-${Date.now()}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf-8');
        
        console.log(`\nDetailed report saved to: ${reportFile}`);
        break;
      }
      
      default:
        console.error(`Error: Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the CLI
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
