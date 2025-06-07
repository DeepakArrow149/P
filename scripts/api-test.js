const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:9002';

async function testAPI(endpoint, name) {
    try {
        console.log(`\n🔍 Testing ${name} API: ${endpoint}`);
        const response = await fetch(`${BASE_URL}${endpoint}`);
        
        if (!response.ok) {
            console.log(`❌ HTTP ${response.status}: ${response.statusText}`);
            const text = await response.text();
            console.log(`Response: ${text}`);
            return false;
        }
        
        const data = await response.json();
        console.log(`✅ ${name} API working:`);
        console.log(`   - Success: ${data.success}`);
        console.log(`   - Data Source: ${data.dataSource || 'N/A'}`);
        console.log(`   - Count: ${data.count || data.data?.length || 'N/A'}`);
        
        return true;
    } catch (error) {
        console.log(`❌ ${name} API failed: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting Comprehensive API Tests...\n');
    
    const tests = [
        // Masters Module
        { endpoint: '/api/buyers', name: 'Buyers' },
        { endpoint: '/api/lines', name: 'Lines' },
        { endpoint: '/api/line-groups', name: 'Line Groups' },
        { endpoint: '/api/line-capacities', name: 'Line Capacities' },
        
        // New Order Module
        { endpoint: '/api/orders', name: 'Orders' },
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
        const passed = await testAPI(test.endpoint, test.name);
        if (passed) passedTests++;
    }
    
    console.log(`\n📊 Test Results: ${passedTests}/${totalTests} APIs working`);
    
    if (passedTests === totalTests) {
        console.log('🎉 All APIs are working correctly!');
    } else {
        console.log('⚠️  Some APIs need attention');
    }
}

runTests().catch(console.error);
