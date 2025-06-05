const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function testConnection() {
    console.log('🔍 Testing MySQL Connection...\n');
    
    // Try different password scenarios
    const testCases = [
        { password: '', description: 'No password' },
        { password: 'root', description: 'Password: root' },
        { password: 'admin', description: 'Password: admin' },
        { password: '123456', description: 'Password: 123456' },
        { password: 'password', description: 'Password: password' }
    ];
    
    for (const testCase of testCases) {
        try {
            console.log(`🔐 Testing ${testCase.description}...`);
            
            const connection = await mysql.createConnection({
                host: 'localhost',
                port: 3306,
                user: 'root',
                password: testCase.password
            });
            
            const [rows] = await connection.execute('SHOW DATABASES');
            console.log(`✅ SUCCESS with ${testCase.description}`);
            console.log('📋 Available databases:');
            rows.forEach(row => {
                console.log(`   - ${row.Database}`);
            });
            
            // Check if our database exists
            const dbExists = rows.some(row => row.Database === 'planner_react');
            console.log(`\n📊 Database 'planner_react' exists: ${dbExists ? 'YES' : 'NO'}`);
            
            if (!dbExists) {
                console.log('\n🔨 Creating planner_react database...');
                await connection.execute('CREATE DATABASE planner_react');
                console.log('✅ Database created successfully!');
            }
            
            // Update .env.local file with working password
            const envPath = path.join(__dirname, '..', '.env.local');
            let envContent = fs.readFileSync(envPath, 'utf8');
            envContent = envContent.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${testCase.password}`);
            fs.writeFileSync(envPath, envContent);
            console.log(`\n📝 Updated .env.local with working password`);
            
            await connection.end();
            return true;
            
        } catch (error) {
            console.log(`❌ Failed with ${testCase.description}: ${error.message}`);
        }
    }
    
    console.log('\n🚨 Could not establish connection with any common passwords.');
    console.log('\n📋 To fix this, you can:');
    console.log('1. Reset MySQL root password using: mysqladmin -u root password "newpassword"');
    console.log('2. Or create a new MySQL user for the application');
    console.log('3. Or reinstall MySQL with a known password');
    
    return false;
}

// Run the test
testConnection().catch(console.error);
