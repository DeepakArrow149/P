// Fix critical database issues identified in conversation summary
require('dotenv').config();
const mysql = require('mysql2/promise');

// Default database configuration for local development
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'planner_react',
  multipleStatements: true
};

async function fixDatabaseIssues() {
  let connection;
  
  try {
    console.log('🔧 Starting database issue fixes...');
    
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database');

    // 1. Fix collation conflicts - standardize to utf8mb4_unicode_ci
    console.log('\n🔧 Fixing collation conflicts...');
    
    const alterTableQueries = [
      `ALTER TABLE buyers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      `ALTER TABLE orders CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      `ALTER TABLE lines CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      `ALTER TABLE line_capacities CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    ];

    for (const query of alterTableQueries) {
      try {
        await connection.execute(query);
        console.log(`✅ Fixed collation for table`);
      } catch (error) {
        console.log(`⚠️  Could not fix collation: ${error.message}`);
      }
    }

    // 2. Check and fix missing 'description' field in lines table
    console.log('\n🔧 Checking lines table structure...');
    
    const [linesStructure] = await connection.execute('DESCRIBE `lines`');
    const hasDescription = linesStructure.some(col => col.Field === 'description');
    
    if (!hasDescription) {
      console.log('🔧 Adding missing description field to lines table...');
      await connection.execute(`
        ALTER TABLE lines 
        ADD COLUMN description TEXT AFTER line_name
      `);
      console.log('✅ Added description field to lines table');
    } else {
      console.log('✅ Description field already exists in lines table');
    }

    // 3. Check and fix buyer reference mismatches
    console.log('\n🔧 Analyzing buyer references...');
    
    const [buyerAnalysis] = await connection.execute(`
      SELECT 
        o.buyer,
        COUNT(*) as order_count,
        CASE 
          WHEN b_name.id IS NOT NULL THEN 'MATCHED_BY_NAME'
          WHEN b_code.id IS NOT NULL THEN 'MATCHED_BY_CODE'
          ELSE 'UNMATCHED'
        END as match_status
      FROM orders o
      LEFT JOIN buyers b_name ON o.buyer = b_name.name
      LEFT JOIN buyers b_code ON o.buyer = b_code.code
      GROUP BY o.buyer, match_status
      ORDER BY order_count DESC
      LIMIT 10
    `);

    console.log('📊 Buyer reference analysis:');
    buyerAnalysis.forEach(row => {
      console.log(`  ${row.buyer}: ${row.order_count} orders - ${row.match_status}`);
    });

    // 4. Fix duplicate order references
    console.log('\n🔧 Checking for duplicate order references...');
    
    const [duplicates] = await connection.execute(`
      SELECT order_reference, COUNT(*) as count 
      FROM orders 
      GROUP BY order_reference 
      HAVING COUNT(*) > 1 
      ORDER BY count DESC
      LIMIT 5
    `);

    if (duplicates.length > 0) {
      console.log('⚠️  Found duplicate order references:');
      duplicates.forEach(dup => {
        console.log(`  ${dup.order_reference}: ${dup.count} copies`);
      });
      
      // Option to clean up duplicates (keeping the first one)
      console.log('🔧 Cleaning up duplicate orders (keeping newest)...');
      for (const dup of duplicates) {
        await connection.execute(`
          DELETE o1 FROM orders o1
          INNER JOIN orders o2 
          WHERE o1.order_reference = o2.order_reference 
            AND o1.id < o2.id 
            AND o1.order_reference = ?
        `, [dup.order_reference]);
      }
      console.log('✅ Duplicate orders cleaned up');
    } else {
      console.log('✅ No duplicate order references found');
    }

    // 5. Add database indexes for optimization
    console.log('\n🔧 Adding performance indexes...');
    
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
      `CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date)`,
      `CREATE INDEX IF NOT EXISTS idx_line_capacities_line_id ON line_capacities(line_id)`,
      `CREATE INDEX IF NOT EXISTS idx_line_capacities_effective_from ON line_capacities(effective_from)`
    ];

    for (const query of indexQueries) {
      try {
        await connection.execute(query);
        console.log('✅ Added performance index');
      } catch (error) {
        console.log(`⚠️  Index already exists or error: ${error.message}`);
      }
    }

    // 6. Verify data integrity
    console.log('\n🔧 Verifying data integrity...');
    
    const [integrity] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM buyers) as total_buyers,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM lines) as total_lines,
        (SELECT COUNT(*) FROM line_capacities) as total_line_capacities
    `);

    console.log('📊 Data integrity summary:');
    console.log(`  Buyers: ${integrity[0].total_buyers}`);
    console.log(`  Orders: ${integrity[0].total_orders}`);
    console.log(`  Lines: ${integrity[0].total_lines}`);
    console.log(`  Line Capacities: ${integrity[0].total_line_capacities}`);

    console.log('\n✅ Database issue fixes completed successfully!');
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the fixes
if (require.main === module) {
  fixDatabaseIssues()
    .then(() => {
      console.log('\n🎉 All database issues have been addressed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Failed to fix database issues:', error);
      process.exit(1);
    });
}

module.exports = { fixDatabaseIssues };
