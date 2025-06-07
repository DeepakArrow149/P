// Simple API test for planning board
const http = require('http');

function testAPI(path, description) {
    return new Promise((resolve, reject) => {
        console.log(`\n📡 Testing ${description}...`);
        console.log(`   Endpoint: http://localhost:9002/api${path}`);
        
        const req = http.get(`http://localhost:9002/api${path}`, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    console.log(`   ✅ Status: ${res.statusCode}`);
                    console.log(`   📊 Data count: ${Array.isArray(jsonData) ? jsonData.length : 'Single object'}`);
                    
                    if (Array.isArray(jsonData) && jsonData.length > 0) {
                        console.log(`   📋 Sample:`, JSON.stringify(jsonData[0], null, 2).substring(0, 200) + '...');
                    }
                    resolve(jsonData);
                } catch (error) {
                    console.log(`   ❌ Parse Error: ${error.message}`);
                    resolve(data);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`   ❌ Connection Error: ${error.message}`);
            reject(error);
        });
        
        req.setTimeout(5000, () => {
            console.log(`   ⏰ Timeout after 5 seconds`);
            req.destroy();
            reject(new Error('Timeout'));
        });
    });
}

async function runTests() {
    console.log('🔍 Testing Planning Board API Integration...');
    
    try {
        await testAPI('/orders', 'Orders API');
        await testAPI('/buyers', 'Buyers API');
        await testAPI('/lines', 'Lines API');
        
        console.log('\n✅ Basic API tests completed!');
    } catch (error) {
        console.log(`\n❌ Test failed: ${error.message}`);
    }
}

runTests();
