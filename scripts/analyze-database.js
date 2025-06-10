// Database collation analysis
require('dotenv').config();
const mysql = require('mysql2/promise');

async function analyzeDatabase() {
  try {
    console.log('Analyzing database structure and collations...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'planner_react'
    });

    // Check table collations
    console.log('\n🔍 Checking table collations:');
    const [tables] = await connection.execute('SHOW TABLE STATUS');
    tables.forEach(table => {
      console.log(`  ${table.Name}: ${table.Collation}`);
    });

    // Check for buyer reference issues
    console.log('\n🔍 Checking buyer references in orders:');
    const [buyerCheck] = await connection.execute(`
      SELECT 
        COUNT(DISTINCT o.buyer) as order_buyers,
        COUNT(DISTINCT b.name) as master_buyers,
        COUNT(DISTINCT b.code) as buyer_codes
      FROM orders o
      LEFT JOIN buyers b ON (o.buyer = b.name OR o.buyer = b.code)
    `);
    console.log('  Buyer reference analysis:', buyerCheck[0]);

    // Check for missing description field in lines table
    console.log('\n🔍 Checking lines table structure:');
    const [linesStructure] = await connection.execute('DESCRIBE `lines`');
    const hasDescription = linesStructure.some(col => col.Field === 'description');
    console.log(`  Description field exists: ${hasDescription}`);
    
    if (!hasDescription) {
      console.log('  ⚠️  Missing description field in lines table');
    }

    // Check for duplicate orders
    console.log('\n🔍 Checking for duplicate order references:');
    const [duplicates] = await connection.execute(`
      SELECT order_reference, COUNT(*) as count 
      FROM orders 
      GROUP BY order_reference 
      HAVING COUNT(*) > 1 
      LIMIT 5
    `);
    console.log(`  Found ${duplicates.length} duplicate order references`);
    
    if (duplicates.length > 0) {
      duplicates.forEach(dup => {
        console.log(`    ${dup.order_reference}: ${dup.count} copies`);
      });
    }

    await connection.end();
    console.log('\n✅ Database analysis completed');
    
  } catch (error) {
    console.error('❌ Database analysis failed:', error.message);
  }
}

analyzeDatabase();
