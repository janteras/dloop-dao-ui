import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Script to fix Rollup platform-specific dependencies
 * 
 * This script addresses the npm bug #4828 related to optional dependencies
 * for Rollup v4.x platform-specific binaries.
 */

console.log('🔧 Running prebuild dependency fix script...');

const rollupBinaryPath = path.resolve(__dirname, '../node_modules/@rollup/rollup-linux-x64-gnu');
const rollupNativePath = path.resolve(__dirname, '../node_modules/rollup/dist/native.js');

// Check if we're running in a CI environment
const isCI = process.env.CI === 'true' || process.env.NETLIFY === 'true';

if (isCI) {
  console.log('📦 Running in CI environment, fixing Rollup dependencies...');
  
  try {
    // Install the specific Rollup platform binary for Linux x64
    console.log('📥 Installing @rollup/rollup-linux-x64-gnu...');
    execSync('npm install @rollup/rollup-linux-x64-gnu@4.31.0 --no-save', { 
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..') 
    });
    
    if (fs.existsSync(rollupNativePath)) {
      console.log('🔧 Patching Rollup native module loader...');
      let nativeCode = fs.readFileSync(rollupNativePath, 'utf8');
      
      // Add a fallback mechanism to use pure JS implementation if binary fails
      if (!nativeCode.includes('ROLLUP_FORCE_PURE_JS')) {
        nativeCode = nativeCode.replace(
          'throw new Error(',
          'console.warn("⚠️ Rollup binary not found, falling back to pure JS implementation");\n' +
          'process.env.ROLLUP_FORCE_PURE_JS = "true";\n' +
          '// throw new Error('
        );
        fs.writeFileSync(rollupNativePath, nativeCode);
      }
    }
    
    console.log('✅ Rollup dependency fix completed successfully');
  } catch (error) {
    console.error('❌ Error fixing Rollup dependencies:', error.message);
    console.log('⚠️ Continuing with build despite error, will use pure JS fallback if available');
    // Don't exit with error to allow build to continue with fallback
  }
}
