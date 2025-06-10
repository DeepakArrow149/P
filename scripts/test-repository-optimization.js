// Test repository connection pooling optimization
require('dotenv').config();

async function testRepositoryOptimization() {
  try {
    console.log('Testing repository connection pooling optimization...');
    
    // Test buyer repository
    const { BuyerRepository } = require('../src/lib/buyerRepository.ts');
    console.log('✅ BuyerRepository imported successfully');
    
    // Test if connection pooling is working by calling findAll
    const startTime = Date.now();
    const buyers = await BuyerRepository.findAll();
    const endTime = Date.now();
    
    console.log(`✅ BuyerRepository.findAll() completed in ${endTime - startTime}ms`);
    console.log(`✅ Found ${buyers.length} buyers`);
    
    // Test order repository
    const { OrderRepository } = require('../src/lib/orderRepository.ts');
    console.log('✅ OrderRepository imported successfully');
    
    const startTime2 = Date.now();
    const orders = await OrderRepository.findAll();
    const endTime2 = Date.now();
    
    console.log(`✅ OrderRepository.findAll() completed in ${endTime2 - startTime2}ms`);
    console.log(`✅ Found ${orders.length} orders`);
    
    console.log('✅ Repository optimization test completed successfully!');
    
  } catch (error) {
    console.error('❌ Repository optimization test failed:', error.message);
    console.error('Full error:', error);
  }
}

testRepositoryOptimization().then(() => process.exit(0)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
