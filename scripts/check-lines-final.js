const mysql = require('mysql2/promise');

async function checkLinesTable() {
    console.log('🔍 Checking lines table...');
    
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'planner_react',
        });

        console.log('✅ Connected to database successfully!');
        
        // Check if lines table exists
        const [tables] = await connection.execute("SHOW TABLES LIKE 'lines'");
        console.log(`Lines table exists: ${tables.length > 0}`);
        
        if (tables.length > 0) {
            // Get table structure
            console.log('\n📋 LINES table structure:');
            const [columns] = await connection.execute('DESCRIBE `lines`');
            columns.forEach(col => {
                console.log(`   ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}${col.Key ? ` [${col.Key}]` : ''}`);
            });
            
            // Count rows
            const [count] = await connection.execute('SELECT COUNT(*) as count FROM `lines`');
            console.log(`\nTotal rows: ${count[0].count}`);
            
            // Test the problematic ORDER BY query
            console.log('\n🔍 Testing ORDER BY queries:');
            
            try {
                const [test1] = await connection.execute('SELECT * FROM `lines` ORDER BY id LIMIT 1');
                console.log('✅ ORDER BY id works');
            } catch (err) {
                console.log('❌ ORDER BY id failed:', err.message);
            }
            
            try {
                const [test2] = await connection.execute('SELECT * FROM `lines` ORDER BY line_code LIMIT 1');
                console.log('✅ ORDER BY line_code works');
            } catch (err) {
                console.log('❌ ORDER BY line_code failed:', err.message);
            }
            
            // Show sample data
            if (count[0].count > 0) {
                console.log('\n🔍 Sample data:');
                const [sample] = await connection.execute('SELECT * FROM `lines` LIMIT 2');
                sample.forEach((row, index) => {
                    console.log(`Row ${index + 1}:`, row);
                });
            }
        }
        
        await connection.end();
        console.log('\n✅ Check completed!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkLinesTable();
