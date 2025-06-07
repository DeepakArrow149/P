const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:9002';

async function testAPIWithId(endpoint, name) {
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
        console.log(`   - Has Data: ${data.data ? 'Yes' : 'No'}`);
        
        return true;
    } catch (error) {
        console.log(`❌ ${name} API failed: ${error.message}`);
        return false;
    }
}

async function getFirstId(endpoint) {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`);
        if (!response.ok) return null;
        
        const data = await response.json();
        if (data.success && data.data && data.data.length > 0) {
            return data.data[0].id;
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function runIdBasedTests() {
    console.log('🚀 Starting ID-Based API Tests...\n');
    
    // Get first buyer ID and test individual buyer endpoint
    const buyerId = await getFirstId('/api/buyers');
    if (buyerId) {
        await testAPIWithId(`/api/buyers/${buyerId}`, 'Single Buyer');
    } else {
        console.log('❌ Could not get buyer ID for individual test');
    }
    
    // Get first line ID and test individual line endpoint
    const lineId = await getFirstId('/api/lines');
    if (lineId) {
        await testAPIWithId(`/api/lines/${lineId}`, 'Single Line');
    } else {
        console.log('❌ Could not get line ID for individual test');
    }
    
    // Get first order ID and test individual order endpoint
    const orderId = await getFirstId('/api/orders');
    if (orderId) {
        await testAPIWithId(`/api/orders/${orderId}`, 'Single Order');
    } else {
        console.log('❌ Could not get order ID for individual test');
    }
    
    console.log('\n📊 ID-based API tests completed');
}

runIdBasedTests().catch(console.error);
