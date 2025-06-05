// Simple test to verify MockBuyerService
const { MockBuyerService } = require('../src/lib/mockBuyerService.ts');

async function testMockService() {
  console.log('Testing MockBuyerService...');
  
  try {
    // Test findAll
    const buyers = await MockBuyerService.findAll();
    console.log(`✅ findAll: Found ${buyers.length} buyers`);
    
    // Test create
    const newBuyer = await MockBuyerService.create({
      buyerCode: 'TEST001',
      buyerName: 'Test Buyer',
      contactPerson: 'Test Person',
      email: 'test@example.com',
      phone: '123-456-7890',
      address: 'Test Address',
      country: 'Test Country'
    });
    console.log(`✅ create: Created buyer with ID ${newBuyer.id}`);
    
    // Test findById
    const foundBuyer = await MockBuyerService.findById(newBuyer.id);
    console.log(`✅ findById: Found buyer: ${foundBuyer?.buyerName}`);
    
    console.log('MockBuyerService is working correctly!');
  } catch (error) {
    console.error('❌ MockBuyerService test failed:', error);
  }
}

testMockService();
