const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Next.js Development Server with Enhanced Error Handling\n');

// Change to project directory
process.chdir('d:\\Planner React');

// Start the development server
const npm = spawn('npm', ['run', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

npm.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(output);
  
  if (output.includes('ready') || output.includes('Ready')) {
    console.log('✅ Server is ready at http://localhost:9002');
  }
  
  if (output.includes('error') || output.includes('Error')) {
    console.log('❌ Error detected in server output');
  }
});

npm.stderr.on('data', (data) => {
  const error = data.toString();
  console.error('❌ Server Error:', error);
  
  // Common error patterns and solutions
  if (error.includes('EADDRINUSE')) {
    console.log('💡 Solution: Port 9002 is already in use. Kill existing processes or use a different port.');
  }
  
  if (error.includes('MySQL') || error.includes('mysql')) {
    console.log('💡 Solution: MySQL connection issue. Check if MySQL service is running and credentials are correct.');
  }
  
  if (error.includes('MODULE_NOT_FOUND')) {
    console.log('💡 Solution: Missing dependencies. Run: npm install');
  }
  
  if (error.includes('TypeScript')) {
    console.log('💡 Solution: TypeScript compilation error. Check your .ts/.tsx files for errors.');
  }
});

npm.on('close', (code) => {
  console.log(`\n📊 Server process exited with code ${code}`);
  
  if (code !== 0) {
    console.log('❌ Server failed to start properly');
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check if MySQL is running');
    console.log('2. Verify .env.local configuration');
    console.log('3. Run: npm install');
    console.log('4. Run: npm run build (to check for build errors)');
    console.log('5. Check for port conflicts');
  }
});

npm.on('error', (error) => {
  console.error('❌ Failed to start server:', error.message);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping server...');
  npm.kill('SIGINT');
  process.exit(0);
});

console.log('Press Ctrl+C to stop the server\n');
