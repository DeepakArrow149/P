// Comprehensive validation of all optimizations
const fs = require('fs');
const path = require('path');

function validateOptimizations() {
  console.log('🔍 COMPREHENSIVE OPTIMIZATION VALIDATION');
  console.log('==========================================\n');

  const results = {
    repositoryOptimizations: {},
    databaseConfig: false,
    totalScore: 0,
    maxScore: 0
  };

  // Repository files to check
  const repositories = [
    { name: 'BuyerRepository', file: 'src/lib/buyerRepository.ts' },
    { name: 'OrderRepository', file: 'src/lib/orderRepository.ts' },
    { name: 'LineCapacityRepository_new', file: 'src/lib/lineCapacityRepository_new.ts' },
    { name: 'LineGroupRepository_new', file: 'src/lib/lineGroupRepository_new.ts' }
  ];

  console.log('📊 REPOSITORY CONNECTION POOLING OPTIMIZATION:');
  console.log('================================================');

  repositories.forEach(repo => {
    try {
      const filePath = path.join(__dirname, '..', repo.file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for proper connection pooling pattern
      const poolingPattern = /const pool = await getConnection\(\);\s*const connection = await pool\.getConnection\(\);/g;
      const poolingMatches = content.match(poolingPattern) || [];
      
      // Check for proper cleanup pattern
      const cleanupPattern = /finally\s*{\s*connection\.release\(\);/g;
      const cleanupMatches = content.match(cleanupPattern) || [];
      
      // Check for try-finally blocks
      const tryFinallyPattern = /try\s*{[\s\S]*?}\s*finally\s*{\s*connection\.release\(\);/g;
      const tryFinallyMatches = content.match(tryFinallyPattern) || [];

      const score = {
        poolingCount: poolingMatches.length,
        cleanupCount: cleanupMatches.length,
        tryFinallyCount: tryFinallyMatches.length,
        optimized: poolingMatches.length > 0 && cleanupMatches.length > 0
      };

      results.repositoryOptimizations[repo.name] = score;
      results.maxScore += 3; // 3 points per repository (pooling + cleanup + try-finally)
      
      if (score.optimized) {
        results.totalScore += 2; // 2 points for basic optimization
        if (score.tryFinallyCount > 0) {
          results.totalScore += 1; // 1 extra point for proper try-finally
        }
      }

      console.log(`  ${repo.name}:`);
      console.log(`    ✅ Connection pooling methods: ${score.poolingCount}`);
      console.log(`    ✅ Proper cleanup blocks: ${score.cleanupCount}`);
      console.log(`    ✅ Try-finally patterns: ${score.tryFinallyCount}`);
      console.log(`    📊 Status: ${score.optimized ? '✅ OPTIMIZED' : '❌ NEEDS WORK'}\n`);
      
    } catch (error) {
      console.log(`  ❌ ${repo.name}: Could not read file - ${error.message}\n`);
    }
  });

  // Check database configuration
  console.log('📊 DATABASE CONFIGURATION:');
  console.log('===========================');
  
  try {
    const dbConfigPath = path.join(__dirname, '..', 'src/lib/database.ts');
    const dbContent = fs.readFileSync(dbConfigPath, 'utf8');
    
    // Check if invalid mysql2 options were removed
    const hasInvalidOptions = dbContent.includes('acquireTimeout') || dbContent.includes('timeout:');
    const hasConnectionLimit = dbContent.includes('connectionLimit');
    const hasWaitForConnections = dbContent.includes('waitForConnections');
    
    results.databaseConfig = !hasInvalidOptions && hasConnectionLimit && hasWaitForConnections;
    
    if (results.databaseConfig) {
      results.totalScore += 2;
    }
    results.maxScore += 2;
    
    console.log(`  ✅ Invalid mysql2 options removed: ${!hasInvalidOptions ? '✅ YES' : '❌ NO'}`);
    console.log(`  ✅ Connection pooling configured: ${hasConnectionLimit ? '✅ YES' : '❌ NO'}`);
    console.log(`  ✅ Wait for connections enabled: ${hasWaitForConnections ? '✅ YES' : '❌ NO'}`);
    console.log(`  📊 Status: ${results.databaseConfig ? '✅ OPTIMIZED' : '❌ NEEDS WORK'}\n`);
    
  } catch (error) {
    console.log(`  ❌ Could not check database config - ${error.message}\n`);
  }

  // Summary
  console.log('📊 OPTIMIZATION SUMMARY:');
  console.log('=========================');
  
  const percentage = Math.round((results.totalScore / results.maxScore) * 100);
  
  console.log(`  📈 Optimization Score: ${results.totalScore}/${results.maxScore} (${percentage}%)`);
  
  if (percentage >= 90) {
    console.log('  🎉 EXCELLENT! All optimizations are in place.');
  } else if (percentage >= 70) {
    console.log('  ✅ GOOD! Most optimizations are complete.');
  } else {
    console.log('  ⚠️  MORE WORK NEEDED! Some optimizations are missing.');
  }

  // Specific recommendations
  console.log('\n📋 STATUS BY CATEGORY:');
  console.log('======================');
  
  Object.entries(results.repositoryOptimizations).forEach(([name, score]) => {
    const status = score.optimized ? '✅ COMPLETE' : '❌ INCOMPLETE';
    console.log(`  ${name}: ${status}`);
  });
  
  console.log(`  Database Configuration: ${results.databaseConfig ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);

  console.log('\n🎯 NEXT STEPS:');
  console.log('===============');
  
  if (percentage === 100) {
    console.log('  🎉 All optimizations complete! Ready for production testing.');
  } else {
    console.log('  1. Fix any remaining repository optimization issues');
    console.log('  2. Verify database configuration');
    console.log('  3. Run integration tests');
    console.log('  4. Perform load testing');
  }

  return results;
}

// Run validation
try {
  const results = validateOptimizations();
  process.exit(results.totalScore === results.maxScore ? 0 : 1);
} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}
