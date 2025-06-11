const fs = require('fs');
const path = require('path');

console.log('🔍 Server Error Diagnostic Tool');
console.log('=====================================\n');

// Check if key files exist
const criticalFiles = [
  'package.json',
  'next.config.ts',
  'src/app/page.tsx',
  'src/app/layout.tsx',
  '.env.local'
];

console.log('📁 Checking critical files:');
criticalFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// Check Next.js configuration
console.log('\n⚙️ Next.js Configuration:');
try {
  const nextConfigPath = path.join(__dirname, '..', 'next.config.ts');
  const content = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Check for potential issues
  if (content.includes('typescript: {')) {
    console.log('✅ TypeScript configuration found');
  }
  if (content.includes('ignoreBuildErrors: true')) {
    console.log('⚠️  Build errors are being ignored');
  }
  if (content.includes('compress: true')) {
    console.log('✅ Compression enabled');
  }
} catch (error) {
  console.log('❌ Error reading next.config.ts:', error.message);
}

// Check package.json scripts
console.log('\n📦 Package.json scripts:');
try {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (packageJson.scripts?.dev) {
    console.log(`✅ Dev script: ${packageJson.scripts.dev}`);
  }
  if (packageJson.scripts?.build) {
    console.log(`✅ Build script: ${packageJson.scripts.build}`);
  }
  if (packageJson.scripts?.start) {
    console.log(`✅ Start script: ${packageJson.scripts.start}`);
  }
} catch (error) {
  console.log('❌ Error reading package.json:', error.message);
}

// Check environment variables
console.log('\n🔐 Environment Configuration:');
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  lines.forEach(line => {
    const [key] = line.split('=');
    if (key) {
      console.log(`✅ ${key.trim()}`);
    }
  });
} catch (error) {
  console.log('❌ Error reading .env.local:', error.message);
}

// Check for common issues
console.log('\n🚨 Common Issue Checks:');

// Check for node_modules
const nodeModulesExists = fs.existsSync(path.join(__dirname, '..', 'node_modules'));
console.log(`${nodeModulesExists ? '✅' : '❌'} node_modules directory exists`);

// Check for .next build directory
const nextBuildExists = fs.existsSync(path.join(__dirname, '..', '.next'));
console.log(`${nextBuildExists ? '✅' : '⚠️ '} .next build directory ${nextBuildExists ? 'exists' : 'missing (normal for first run)'}`);

// Check TypeScript config
const tsconfigExists = fs.existsSync(path.join(__dirname, '..', 'tsconfig.json'));
console.log(`${tsconfigExists ? '✅' : '❌'} tsconfig.json exists`);

console.log('\n💡 Recommendations:');
if (!nodeModulesExists) {
  console.log('🔧 Run: npm install');
}
if (!nextBuildExists) {
  console.log('🔧 Try: npm run build (to check for build errors)');
}
console.log('🔧 Check MySQL service is running');
console.log('🔧 Verify database credentials in .env.local');
console.log('🔧 Check browser console for client-side errors');

console.log('\n✅ Diagnostic complete!');
