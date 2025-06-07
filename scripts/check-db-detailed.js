const mysql = require('mysql2/promise');

async function checkAndInsertOrders() {
    console.log('🔍 Checking database and inserting orders...');
    
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'planner_react',
        });

        console.log('✅ Connected to database successfully!');
        
        // Check if orders table exists and its structure
        console.log('\n📋 Checking orders table...');
        try {
            const [tables] = await connection.execute("SHOW TABLES LIKE 'orders'");
            if (tables.length === 0) {
                console.log('❌ Orders table does not exist. Creating it...');
                // We should create the orders table first
                await connection.end();
                return;
            }
            
            console.log('✅ Orders table exists');
            
            // Get table structure
            const [columns] = await connection.execute('DESCRIBE orders');
            console.log('📝 Orders table columns:');
            columns.forEach(col => {
                console.log(`   ${col.Field} (${col.Type})`);
            });
            
        } catch (error) {
            console.log('❌ Error checking orders table:', error.message);
            await connection.end();
            return;
        }
        
        // Get available buyers
        console.log('\n👥 Getting buyers...');
        const [buyers] = await connection.execute('SELECT id, code, name FROM buyers LIMIT 4');
        console.log(`Found ${buyers.length} buyers:`);
        buyers.forEach(buyer => {
            console.log(`   ${buyer.code} - ${buyer.name}`);
        });
        
        // Get available lines  
        console.log('\n🏭 Getting lines...');
        const [lines] = await connection.execute('SELECT id, lineCode, lineName FROM `lines` LIMIT 4');
        console.log(`Found ${lines.length} lines:`);
        lines.forEach(line => {
            console.log(`   ${line.lineCode} - ${line.lineName}`);
        });
        
        if (buyers.length === 0) {
            console.log('❌ No buyers found. Please add buyers first.');
            await connection.end();
            return;
        }
        
        // Check current orders count
        const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM orders');
        console.log(`\n📊 Current orders count: ${countResult[0].count}`);
        
        await connection.end();
        console.log('\n✅ Database check completed!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkAndInsertOrders();
