const mysql = require('mysql2/promise');

async function checkDB() {
    try {        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Chandan@123',
            database: 'planner_react'
        });

        console.log('✅ Connected to database');
        
        // Check if lines table exists and get its structure
        const [tables] = await connection.execute("SHOW TABLES LIKE 'lines'");
        console.log('Tables matching "lines":', tables);
        
        if (tables.length > 0) {
            console.log('\n📋 Lines table structure:');
            const [columns] = await connection.execute('DESCRIBE `lines`');
            columns.forEach(col => {
                console.log(`   ${col.Field} (${col.Type})`);
            });
            
            console.log('\n📊 Row count:');
            const [count] = await connection.execute('SELECT COUNT(*) as count FROM `lines`');
            console.log(`   Total rows: ${count[0].count}`);
            
            if (count[0].count > 0) {
                console.log('\n🔍 Sample row:');
                const [sample] = await connection.execute('SELECT * FROM `lines` LIMIT 1');
                console.log(sample[0]);
            }
        } else {
            console.log('❌ Lines table does not exist');
        }
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
    }
}

checkDB();
