// Simple database connection and optimization verification
const mysql = require('mysql2/promise');

async function verifyOptimizations() {
  try {
    console.log('🔍 Verifying repository optimizations...');
    
    // Test basic connection
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'planner_react'
    });

    console.log('✅ Database connection successful');

    // Verify tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`✅ Found ${tables.length} tables in database`);

    // Test connection pooling by importing our optimized repositories
    console.log('\n🔍 Testing optimized repositories...');
    
    try {
      // Since we can't easily test TypeScript files with node directly,
      // let's verify the optimization patterns are in place
      const fs = require('fs');
      
      const buyerRepoContent = fs.readFileSync('./src/lib/buyerRepository.ts', 'utf8');
      const orderRepoContent = fs.readFileSync('./src/lib/orderRepository.ts', 'utf8');
      const lineCapacityRepoContent = fs.readFileSync('./src/lib/lineCapacityRepository_new.ts', 'utf8');
      const lineGroupRepoContent = fs.readFileSync('./src/lib/lineGroupRepository_new.ts', 'utf8');

      // Check for proper connection pooling pattern
      const optimizationPattern = /const pool = await getConnection\(\);\s*const connection = await pool\.getConnection\(\);/;
      
      const buyerOptimized = optimizationPattern.test(buyerRepoContent);
      const orderOptimized = optimizationPattern.test(orderRepoContent);
      const lineCapacityOptimized = optimizationPattern.test(lineCapacityRepoContent);
      const lineGroupOptimized = optimizationPattern.test(lineGroupRepoContent);

      console.log('📊 Repository Optimization Status:');
      console.log(`  BuyerRepository: ${buyerOptimized ? '✅ OPTIMIZED' : '❌ NEEDS OPTIMIZATION'}`);
      console.log(`  OrderRepository: ${orderOptimized ? '✅ OPTIMIZED' : '❌ NEEDS OPTIMIZATION'}`);
      console.log(`  LineCapacityRepository_new: ${lineCapacityOptimized ? '✅ OPTIMIZED' : '❌ NEEDS OPTIMIZATION'}`);
      console.log(`  LineGroupRepository_new: ${lineGroupOptimized ? '✅ OPTIMIZED' : '❌ NEEDS OPTIMIZATION'}`);

      // Check for proper finally blocks
      const finallyPattern = /finally\s*{\s*connection\.release\(\);/;
      
      const buyerFinally = finallyPattern.test(buyerRepoContent);
      const orderFinally = finallyPattern.test(orderRepoContent);
      const lineCapacityFinally = finallyPattern.test(lineCapacityRepoContent);
      const lineGroupFinally = finallyPattern.test(lineGroupRepoContent);

      console.log('\n📊 Connection Release Pattern Status:');
      console.log(`  BuyerRepository: ${buyerFinally ? '✅ PROPER CLEANUP' : '❌ MISSING CLEANUP'}`);
      console.log(`  OrderRepository: ${orderFinally ? '✅ PROPER CLEANUP' : '❌ MISSING CLEANUP'}`);
      console.log(`  LineCapacityRepository_new: ${lineCapacityFinally ? '✅ PROPER CLEANUP' : '❌ MISSING CLEANUP'}`);
      console.log(`  LineGroupRepository_new: ${lineGroupFinally ? '✅ PROPER CLEANUP' : '❌ MISSING CLEANUP'}`);

      const allOptimized = buyerOptimized && orderOptimized && lineCapacityOptimized && lineGroupOptimized;
      const allCleanup = buyerFinally && orderFinally && lineCapacityFinally && lineGroupFinally;

      if (allOptimized && allCleanup) {
        console.log('\n🎉 ALL REPOSITORIES SUCCESSFULLY OPTIMIZED!');
      } else {
        console.log('\n⚠️  Some repositories still need optimization');
      }

    } catch (repoError) {
      console.log('⚠️  Could not verify repository files:', repoError.message);
    }

    await connection.end();
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Suggestion: Make sure MySQL server is running');
      console.log('   - Check if MySQL service is started');
      console.log('   - Verify connection credentials');
    }
  }
}

verifyOptimizations();
