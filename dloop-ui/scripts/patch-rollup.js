/**
 * Patch for Rollup to fix platform-specific binary issues
 * This script forces Rollup to use its pure JavaScript implementation
 * instead of attempting to use native binaries
 */

// Set environment variable before importing any modules
process.env.ROLLUP_FORCE_PURE_JS = 'true';

console.log('🔧 Forcing Rollup to use pure JavaScript implementation');
console.log('📦 Starting development server...');

// Get the script path from command line arguments
const scriptPath = process.argv[2];
if (!scriptPath) {
  console.error('Error: No script path provided');
  process.exit(1);
}

// Use dynamic import for child_process since we're in ESM
import { spawnSync } from 'child_process';

// Spawn the tsx process with the right arguments
const result = spawnSync('node', [
  './node_modules/tsx/dist/cli.js',
  scriptPath
], { 
  stdio: 'inherit',
  env: { ...process.env }
});

// Exit with the same code as the spawned process
process.exit(result.status);
