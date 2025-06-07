// Test script to manually run the same query that the API uses
const { getConnection } = require('../src/lib/database.ts');

async function testLinesQuery() {
    console.log('🔍 Testing Lines Query...');
    
    try {
        const pool = await getConnection();
        const connection = await pool.getConnection();
        
        try {
            // First, let's see what tables we have
            console.log('\n📋 Available tables:');
            const [tables] = await connection.execute('SHOW TABLES');
            tables.forEach(table => {
                console.log(`   - ${Object.values(table)[0]}`);
            });
            
            // Check if lines table exists
            const [linesExists] = await connection.execute("SHOW TABLES LIKE 'lines'");
            console.log(`\n✅ Lines table exists: ${linesExists.length > 0}`);
            
            if (linesExists.length > 0) {
                // Get table structure
                console.log('\n📋 Lines table structure:');
                const [columns] = await connection.execute('DESCRIBE `lines`');
                columns.forEach(col => {
                    console.log(`   ${col.Field} (${col.Type}) - ${col.Null} ${col.Key ? '[' + col.Key + ']' : ''}`);
                });
                
                // Test the problematic query
                console.log('\n🔍 Testing basic SELECT query:');
                const [rows] = await connection.execute('SELECT * FROM `lines` LIMIT 3');
                console.log(`   Found ${rows.length} rows`);
                if (rows.length > 0) {
                    console.log('   Sample row:', rows[0]);
                }
                
                // Test the ORDER BY clause that's causing issues
                console.log('\n🔍 Testing ORDER BY line_code:');
                try {
                    const [orderedRows] = await connection.execute('SELECT * FROM `lines` ORDER BY line_code ASC LIMIT 1');
                    console.log('   ✅ ORDER BY line_code works');
                } catch (err) {
                    console.log('   ❌ ORDER BY line_code failed:', err.message);
                }
                
            } else {
                console.log('❌ Lines table does not exist');
            }
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('❌ Database error:', error.message);
    }
}

testLinesQuery();
