const mysql = require('mysql2/promise');

async function checkTableStructure() {
    console.log('🔍 Starting table structure check...');
    
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'planner_react',
        });

        console.log('✅ Connected to database successfully!');
        console.log('📋 Checking table structures...\n');
          // Check buyers table
        const [buyerCols] = await connection.execute('DESCRIBE buyers');
        console.log('🏢 BUYERS table structure:');
        buyerCols.forEach(col => {
            console.log(`   ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}${col.Key ? ` [${col.Key}]` : ''}`);
        });

        // Check lines table
        const [linesCols] = await connection.execute('DESCRIBE `lines`');
        console.log('\n🏭 LINES table structure:');
        linesCols.forEach(col => {
            console.log(`   ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}${col.Key ? ` [${col.Key}]` : ''}`);
        });

        // Check if other tables exist
        const [tables] = await connection.execute('SHOW TABLES');
        console.log('\n📊 Available tables:');
        tables.forEach(table => {
            console.log(`   - ${Object.values(table)[0]}`);
        });

        await connection.end();
        console.log('\n✅ Table check completed successfully!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

checkTableStructure();
