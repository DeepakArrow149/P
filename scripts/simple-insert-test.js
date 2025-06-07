// Simple test to check database connection and insert orders
const mysql = require('mysql2/promise');

async function testAndInsert() {
    console.log('🔄 Testing database connection and inserting orders...');
    
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'planner_react',
        });

        console.log('✅ Database connected successfully!');
        
        // Check current order count
        const [countBefore] = await connection.execute('SELECT COUNT(*) as count FROM orders');
        console.log(`📊 Current orders count: ${countBefore[0].count}`);
        
        // Get some buyers for reference
        const [buyers] = await connection.execute('SELECT code, name FROM buyers LIMIT 5');
        console.log(`👥 Available buyers: ${buyers.length}`);
        
        // Insert a simple test order
        const testOrderId = 'test-order-' + Date.now();
        const insertQuery = `
            INSERT INTO orders (
                id, order_reference, description, product, customer, buyer,
                status, contract_quantity, order_date, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        const values = [
            testOrderId,
            'TEST-ORDER-' + Date.now(),
            'Test order for planning board integration',
            'Test Product',
            buyers[0]?.name || 'Test Customer',
            buyers[0]?.name || 'Test Buyer',
            'provisional',
            1000,
            new Date()
        ];
        
        await connection.execute(insertQuery, values);
        console.log('✅ Test order inserted successfully!');
        
        // Check new count
        const [countAfter] = await connection.execute('SELECT COUNT(*) as count FROM orders');
        console.log(`📊 New orders count: ${countAfter[0].count}`);
        
        await connection.end();
        console.log('✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testAndInsert().catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
});
