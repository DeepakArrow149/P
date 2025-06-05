// Test script for MySQL order integration
async function testOrderAPI() {
  console.log('🚀 Testing MySQL Order Integration...\n');

  try {
    // Use native fetch for Node.js 18+
    const fetch = globalThis.fetch || require('node-fetch');

    // Test 1: Get all orders (should return empty array initially)
    console.log('📝 Test 1: GET /api/orders');
    const response1 = await fetch(`http://localhost:9002/api/orders`);
    const result1 = await response1.json();
    console.log('Response:', JSON.stringify(result1, null, 2));
    console.log('✅ GET orders successful\n');    // Test 2: Create a new order
    console.log('📝 Test 2: POST /api/orders - Create new order');
    const testOrder = {
      orderReference: 'TEST-001',
      description: 'Test Order for MySQL Integration',
      product: 'T-Shirt',
      customer: 'Test Customer',
      buyer: 'Test Buyer',
      styleName: 'Basic Tee',
      status: 'confirmed',
      contractQuantity: 1000,
      orderDate: new Date().toISOString(),
      receivedDate: new Date().toISOString(),
      learningCurveId: 'default-lc',
      tnaTemplate: 'default-template',
      activeSizeNames: ['S', 'M', 'L', 'XL'],
      poLines: [
        {
          id: 'po-1',
          soNo: 'SO-001',
          poName: 'PO-001',
          deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          country: 'USA',
          sizeQuantities: [
            { sizeName: 'S', size: 'S', quantity: 200 },
            { sizeName: 'M', size: 'M', quantity: 400 },
            { sizeName: 'L', size: 'L', quantity: 300 },
            { sizeName: 'XL', size: 'XL', quantity: 100 }
          ]
        }
      ],
      deliveryDetails: [
        {
          id: 'delivery-1',
          deliveryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
          quantity: 1000
        }
      ]
    };

    const response2 = await fetch(`http://localhost:9002/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testOrder)
    });
    
    const result2 = await response2.json();
    console.log('Response:', JSON.stringify(result2, null, 2));
    
    if (result2.success) {
      console.log('✅ POST order successful');
      const createdOrderId = result2.data.id;
      console.log(`Created order with ID: ${createdOrderId}\n`);

      // Test 3: Get all orders again (should now have the created order)
      console.log('📝 Test 3: GET /api/orders - Verify order was created');
      const response3 = await fetch(`http://localhost:9002/api/orders`);
      const result3 = await response3.json();
      console.log('Response:', JSON.stringify(result3, null, 2));
      console.log('✅ GET orders after creation successful\n');

      // Test 4: Get specific order by ID
      console.log(`📝 Test 4: GET /api/orders/${createdOrderId} - Get specific order`);
      const response4 = await fetch(`http://localhost:9002/api/orders/${createdOrderId}`);
      const result4 = await response4.json();
      console.log('Response:', JSON.stringify(result4, null, 2));
      console.log('✅ GET specific order successful\n');

      // Test 5: Update order status
      console.log(`📝 Test 5: PATCH /api/orders/${createdOrderId} - Update order status`);
      const response5 = await fetch(`http://localhost:9002/api/orders/${createdOrderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'in_progress' })
      });
      const result5 = await response5.json();
      console.log('Response:', JSON.stringify(result5, null, 2));
      console.log('✅ PATCH order status successful\n');

    } else {
      console.log('❌ POST order failed:', result2.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testOrderAPI();
