// Test script to verify planning board database and API integration
const axios = require('axios');

const BASE_URL = 'http://localhost:9002/api';

async function testPlanningBoardIntegration() {
    console.log('🔍 Testing Planning Board Database & API Integration...\n');
    
    const tests = [
        {
            name: 'Orders API',
            endpoint: '/orders',
            description: 'Test orders retrieval with database connection'
        },
        {
            name: 'Buyers API',
            endpoint: '/buyers',
            description: 'Test buyers master data retrieval'
        },
        {
            name: 'Lines API',
            endpoint: '/lines',
            description: 'Test production lines master data retrieval'
        },
        {
            name: 'Line Capacities API',
            endpoint: '/line-capacities',
            description: 'Test line capacity data for planning board'
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`📡 Testing ${test.name}...`);
            console.log(`   Description: ${test.description}`);
            console.log(`   Endpoint: ${BASE_URL}${test.endpoint}`);
            
            const response = await axios.get(`${BASE_URL}${test.endpoint}`);
            
            console.log(`   ✅ Status: ${response.status}`);
            console.log(`   📊 Data count: ${Array.isArray(response.data) ? response.data.length : 'Single object'}`);
            
            if (Array.isArray(response.data) && response.data.length > 0) {
                console.log(`   📋 Sample record:`, JSON.stringify(response.data[0], null, 2));
            } else if (typeof response.data === 'object') {
                console.log(`   📋 Response:`, JSON.stringify(response.data, null, 2));
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            if (error.response) {
                console.log(`   Status: ${error.response.status}`);
                console.log(`   Data: ${JSON.stringify(error.response.data)}`);
            }
        }
        console.log(''); // Empty line for readability
    }
    
    // Test specific planning board scenarios
    console.log('🎯 Testing Planning Board Specific Features...\n');
    
    try {
        console.log('📅 Testing orders with status and date filters...');
        const ordersResponse = await axios.get(`${BASE_URL}/orders`);
        
        if (ordersResponse.data && Array.isArray(ordersResponse.data)) {
            const orders = ordersResponse.data;
            
            // Analyze order statuses for planning board
            const statusCounts = {};
            orders.forEach(order => {
                statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
            });
            
            console.log('   📊 Order Status Distribution:');
            Object.entries(statusCounts).forEach(([status, count]) => {
                console.log(`      ${status}: ${count} orders`);
            });
            
            // Check for planning-relevant fields
            console.log('   🔍 Planning Board Field Analysis:');
            const sampleOrder = orders[0];
            const planningFields = ['assignedLine', 'ship_date', 'order_date', 'contract_quantity', 'status'];
            
            planningFields.forEach(field => {
                const hasValue = sampleOrder[field] !== null && sampleOrder[field] !== undefined;
                console.log(`      ${field}: ${hasValue ? '✅ Available' : '⚠️ Empty/Null'}`);
            });
        }
        
    } catch (error) {
        console.log(`   ❌ Planning board test error: ${error.message}`);
    }
    
    console.log('\n🎯 Testing Master Data Relationships...\n');
    
    try {
        // Test buyer-order relationships
        console.log('🔗 Testing Buyer-Order Relationships...');
        const [buyersRes, ordersRes] = await Promise.all([
            axios.get(`${BASE_URL}/buyers`),
            axios.get(`${BASE_URL}/orders`)
        ]);
        
        if (buyersRes.data && ordersRes.data) {
            const buyers = buyersRes.data;
            const orders = ordersRes.data;
            
            console.log(`   👥 Total buyers: ${buyers.length}`);
            console.log(`   📦 Total orders: ${orders.length}`);
            
            // Check buyer references in orders
            const buyerCodes = buyers.map(b => b.code);
            const orderBuyers = [...new Set(orders.map(o => o.buyer).filter(Boolean))];
            
            console.log(`   🔍 Unique buyers referenced in orders: ${orderBuyers.length}`);
            console.log(`   📋 Buyer references:`, orderBuyers.slice(0, 5));
        }
        
    } catch (error) {
        console.log(`   ❌ Relationship test error: ${error.message}`);
    }
    
    console.log('\n✅ Planning Board Integration Test Complete!');
}

// Run the test
testPlanningBoardIntegration().catch(console.error);
