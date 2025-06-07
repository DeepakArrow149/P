const mysql = require('mysql2/promise');

async function checkLinesTable() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'Chandan@123',
        database: 'planner_db'
    });

    try {
        console.log('🔍 Checking LINES table structure...');
        
        const [rows] = await connection.execute('DESCRIBE `lines`');
        
        console.log('📋 LINES table columns:');
        rows.forEach(row => {
            console.log(`   ${row.Field} (${row.Type}) - ${row.Null} ${row.Key ? '[' + row.Key + ']' : ''}`);
        });
        
        console.log('\n📊 Sample data from lines table:');
        const [sampleRows] = await connection.execute('SELECT * FROM `lines` LIMIT 3');
        console.log(sampleRows);
        
    } catch (error) {
        console.error('❌ Error checking lines table:', error.message);
    } finally {
        await connection.end();
    }
}

checkLinesTable();
