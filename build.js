import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

console.log('🔨 Building TypeScript...');

try {
  // Compile TypeScript
  execSync('npx tsc', { stdio: 'inherit' });
  
  // Copy package.json to dist
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const distPkg = {
    name: pkg.name,
    version: pkg.version,
    type: pkg.type,
    dependencies: pkg.dependencies
  };
  
  writeFileSync('dist/package.json', JSON.stringify(distPkg, null, 2));
  console.log('✅ Build successful!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
