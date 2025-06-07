const mysql = require('mysql2/promise');

async function checkOrdersStructure() {
    console.log('🔍 Checking orders table structure...');
    
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'planner_react',
        });

        console.log('✅ Connected to database successfully!');
        
        // Check orders table structure
        console.log('\n📋 ORDERS table structure:');
        const [columns] = await connection.execute('DESCRIBE `orders`');
        columns.forEach(col => {
            console.log(`   ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}${col.Key ? ` [${col.Key}]` : ''}`);
        });
        
        // Count existing records
        const [count] = await connection.execute('SELECT COUNT(*) as count FROM `orders`');
        console.log(`\nTotal orders: ${count[0].count}`);
        
        // Show sample order if exists
        if (count[0].count > 0) {
            console.log('\n🔍 Sample order:');
            const [sample] = await connection.execute('SELECT * FROM `orders` LIMIT 1');
            console.log(sample[0]);
        }
        
        // Check available buyers
        console.log('\n👥 Available buyers:');
        const [buyers] = await connection.execute('SELECT id, code, name FROM `buyers` LIMIT 5');
        buyers.forEach(buyer => {
            console.log(`   ${buyer.id} - ${buyer.code} (${buyer.name})`);
        });
        
        // Check available lines
        console.log('\n🏭 Available lines:');
        const [lines] = await connection.execute('SELECT id, lineCode, lineName FROM `lines` LIMIT 5');
        lines.forEach(line => {
            console.log(`   ${line.id} - ${line.lineCode} (${line.lineName})`);
        });
        
        await connection.end();
        console.log('\n✅ Check completed!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkOrdersStructure();
