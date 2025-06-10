// Create 5 sample orders for testing
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:9002';

// Sample order data
const sampleOrders = [
  {
    orderReference: 'ORD-2025-001',
    description: 'Summer Collection T-Shirts',
    product: 'Basic Cotton T-Shirt',
    customer: 'Fashion Forward Ltd',
    buyer: 'Fashion Forward Ltd',
    styleName: 'Classic Crew Neck',
    status: 'confirmed',
    contractQuantity: 5000,
    orderDate: new Date('2025-06-01').toISOString(),
    receivedDate: new Date('2025-06-01').toISOString(),
    learningCurveId: 'lc-basic-tshirt',
    tnaTemplate: 'standard-garment',
    activeSizeNames: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    poLines: [
      {
        id: 'po-001-1',
        soNo: 'SO-2025-001',
        poName: 'PO-FF-001',
        deliveryDate: new Date('2025-08-15').toISOString(),
        country: 'USA',
        sizeQuantities: [
          { sizeName: 'XS', quantity: 250 },
          { sizeName: 'S', quantity: 750 },
          { sizeName: 'M', quantity: 1500 },
          { sizeName: 'L', quantity: 1500 },
          { sizeName: 'XL', quantity: 750 },
          { sizeName: 'XXL', quantity: 250 }
        ]
      }
    ],
    deliveryDetails: [
      {
        id: 'delivery-001-1',
        deliveryDate: new Date('2025-08-15').toISOString(),
        quantity: 5000,
        reference: 'Main Shipment'
      }
    ]
  },
  {
    orderReference: 'ORD-2025-002',
    description: 'Autumn Collection Hoodies',
    product: 'Premium Hoodie',
    customer: 'Urban Style Co',
    buyer: 'Urban Style Co',
    styleName: 'Pullover Hoodie with Pocket',
    status: 'provisional',
    contractQuantity: 3000,
    orderDate: new Date('2025-06-02').toISOString(),
    receivedDate: new Date('2025-06-02').toISOString(),
    learningCurveId: 'lc-hoodie',
    tnaTemplate: 'heavy-garment',
    activeSizeNames: ['S', 'M', 'L', 'XL', 'XXL'],
    poLines: [
      {
        id: 'po-002-1',
        soNo: 'SO-2025-002',
        poName: 'PO-US-002',
        deliveryDate: new Date('2025-09-30').toISOString(),
        country: 'Canada',
        sizeQuantities: [
          { sizeName: 'S', quantity: 300 },
          { sizeName: 'M', quantity: 900 },
          { sizeName: 'L', quantity: 1200 },
          { sizeName: 'XL', quantity: 450 },
          { sizeName: 'XXL', quantity: 150 }
        ]
      }
    ],
    deliveryDetails: [
      {
        id: 'delivery-002-1',
        deliveryDate: new Date('2025-09-30').toISOString(),
        quantity: 3000,
        reference: 'Autumn Collection'
      }
    ]
  },
  {
    orderReference: 'ORD-2025-003',
    description: 'Corporate Polo Shirts',
    product: 'Business Polo Shirt',
    customer: 'Corporate Apparel Inc',
    buyer: 'Corporate Apparel Inc',
    styleName: 'Professional Polo',
    status: 'provisional',
    contractQuantity: 2500,
    orderDate: new Date('2025-06-03').toISOString(),
    receivedDate: new Date('2025-06-03').toISOString(),
    learningCurveId: 'lc-polo',
    tnaTemplate: 'standard-garment',
    activeSizeNames: ['XS', 'S', 'M', 'L', 'XL'],
    poLines: [
      {
        id: 'po-003-1',
        soNo: 'SO-2025-003',
        poName: 'PO-CA-003',
        deliveryDate: new Date('2025-07-20').toISOString(),
        country: 'USA',
        sizeQuantities: [
          { sizeName: 'XS', quantity: 125 },
          { sizeName: 'S', quantity: 500 },
          { sizeName: 'M', quantity: 750 },
          { sizeName: 'L', quantity: 750 },
          { sizeName: 'XL', quantity: 375 }
        ]
      }
    ],
    deliveryDetails: [
      {
        id: 'delivery-003-1',
        deliveryDate: new Date('2025-07-20').toISOString(),
        quantity: 2500,
        reference: 'Corporate Order'
      }
    ]
  },
  {
    orderReference: 'ORD-2025-004',
    description: 'Kids Collection Tank Tops',
    product: 'Kids Tank Top',
    customer: 'Little Stars Clothing',
    buyer: 'Little Stars Clothing',
    styleName: 'Fun Print Tank',
    status: 'confirmed',
    contractQuantity: 4000,
    orderDate: new Date('2025-06-04').toISOString(),
    receivedDate: new Date('2025-06-04').toISOString(),
    learningCurveId: 'lc-kids-tank',
    tnaTemplate: 'kids-garment',
    activeSizeNames: ['2T', '3T', '4T', '5T', '6T'],
    poLines: [
      {
        id: 'po-004-1',
        soNo: 'SO-2025-004',
        poName: 'PO-LS-004-A',
        deliveryDate: new Date('2025-07-10').toISOString(),
        country: 'USA',
        sizeQuantities: [
          { sizeName: '2T', quantity: 400 },
          { sizeName: '3T', quantity: 800 },
          { sizeName: '4T', quantity: 1200 },
          { sizeName: '5T', quantity: 800 },
          { sizeName: '6T', quantity: 400 }
        ]
      },
      {
        id: 'po-004-2',
        soNo: 'SO-2025-004',
        poName: 'PO-LS-004-B',
        deliveryDate: new Date('2025-07-25').toISOString(),
        country: 'USA',
        sizeQuantities: [
          { sizeName: '2T', quantity: 100 },
          { sizeName: '3T', quantity: 200 },
          { sizeName: '4T', quantity: 300 },
          { sizeName: '5T', quantity: 200 },
          { sizeName: '6T', quantity: 100 }
        ]
      }
    ],
    deliveryDetails: [
      {
        id: 'delivery-004-1',
        deliveryDate: new Date('2025-07-10').toISOString(),
        quantity: 3600,
        reference: 'First Batch'
      },
      {
        id: 'delivery-004-2',
        deliveryDate: new Date('2025-07-25').toISOString(),
        quantity: 400,
        reference: 'Second Batch'
      }
    ]
  },
  {
    orderReference: 'ORD-2025-005',
    description: 'Athletic Wear Collection',
    product: 'Performance Sports Tee',
    customer: 'ActiveWear Pro',
    buyer: 'ActiveWear Pro',
    styleName: 'Moisture Wicking Tee',
    status: 'confirmed',
    contractQuantity: 6000,
    orderDate: new Date('2025-06-05').toISOString(),
    receivedDate: new Date('2025-06-05').toISOString(),
    learningCurveId: 'lc-performance',
    tnaTemplate: 'athletic-garment',
    activeSizeNames: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    poLines: [
      {
        id: 'po-005-1',
        soNo: 'SO-2025-005',
        poName: 'PO-AW-005',
        deliveryDate: new Date('2025-08-01').toISOString(),
        country: 'USA',
        sizeQuantities: [
          { sizeName: 'XS', quantity: 300 },
          { sizeName: 'S', quantity: 900 },
          { sizeName: 'M', quantity: 1800 },
          { sizeName: 'L', quantity: 1800 },
          { sizeName: 'XL', quantity: 900 },
          { sizeName: 'XXL', quantity: 300 }
        ]
      }
    ],
    deliveryDetails: [
      {
        id: 'delivery-005-1',
        deliveryDate: new Date('2025-08-01').toISOString(),
        quantity: 6000,
        reference: 'Athletic Collection Launch'
      }
    ]
  }
];

async function createSampleOrders() {
  console.log('🚀 Creating 5 Sample Orders...\n');

  try {
    // Use native fetch for Node.js 18+
    const fetch = globalThis.fetch || require('node-fetch');

    let successCount = 0;
    
    for (let i = 0; i < sampleOrders.length; i++) {
      const order = sampleOrders[i];
      console.log(`📝 Creating Order ${i + 1}: ${order.orderReference}`);
      
      const response = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Order ${order.orderReference} created successfully (ID: ${result.data.id})`);
        successCount++;
      } else {
        console.log(`❌ Failed to create order ${order.orderReference}:`, result.error);
        if (result.details) {
          console.log('   Validation errors:', result.details);
        }
      }
    }
    
    console.log(`\n🎉 Successfully created ${successCount} out of ${sampleOrders.length} orders!`);
    
    // Verify by fetching all orders
    console.log('\n📊 Fetching all orders to verify...');
    const allOrdersResponse = await fetch(`${BASE_URL}/api/orders`);
    const allOrdersResult = await allOrdersResponse.json();
    
    if (allOrdersResult.success) {
      console.log(`✅ Total orders in database: ${allOrdersResult.data.length}`);
      
      // Show summary of created orders
      console.log('\n📋 Order Summary:');
      allOrdersResult.data.forEach((order, index) => {
        const totalQty = order.poLines.reduce((sum, poLine) => {
          return sum + poLine.sizeQuantities.reduce((lineSum, sizeQty) => lineSum + sizeQty.quantity, 0);
        }, 0);
        
        console.log(`${index + 1}. ${order.order_reference} - ${order.product} (${order.status}) - ${totalQty} units`);
      });
    }

  } catch (error) {
    console.error('❌ Error creating sample orders:', error.message);
  }
}

// Run the script
createSampleOrders();