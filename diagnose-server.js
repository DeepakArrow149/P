// Server diagnostic script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Next.js Server Diagnostic Tool');
console.log('==================================');

// Check Node.js version
console.log('\n📦 Environment Check:');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Current directory:', process.cwd());

// Check if package.json exists
const packagePath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packagePath)) {
  console.log('✅ package.json found');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log('Next.js version:', pkg.dependencies?.next || 'Not found');
} else {
  console.log('❌ package.json not found');
}

// Check if .next directory exists
const nextDir = path.join(process.cwd(), '.next');
if (fs.existsSync(nextDir)) {
  console.log('✅ .next build directory found');
} else {
  console.log('⚠️ .next build directory not found');
}

// Check key files
const keyFiles = [
  'next.config.ts',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  '.env.local'
];

console.log('\n📁 Key Files Check:');
keyFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Check for potential issues
console.log('\n🔍 Potential Issues:');

// Check for common problems
try {
  // Check if there are any immediate syntax errors
  require('./next.config.ts');
  console.log('✅ next.config.ts loads without syntax errors');
} catch (error) {
  console.log('❌ next.config.ts has issues:', error.message);
}

// Check ports
console.log('\n🌐 Port Status:');
try {
  const netstat = execSync('netstat -ano | findstr :9002', { encoding: 'utf8' });
  if (netstat.trim()) {
    console.log('⚠️ Port 9002 is in use:');
    console.log(netstat);
  } else {
    console.log('✅ Port 9002 is available');
  }
} catch (error) {
  console.log('✅ Port 9002 is available');
}

try {
  const netstat3000 = execSync('netstat -ano | findstr :3000', { encoding: 'utf8' });
  if (netstat3000.trim()) {
    console.log('⚠️ Port 3000 is in use:');
    console.log(netstat3000);
  } else {
    console.log('✅ Port 3000 is available');
  }
} catch (error) {
  console.log('✅ Port 3000 is available');
}

console.log('\n🚀 Attempting to start server...');
console.log('If this hangs, press Ctrl+C and check the error messages above.');
