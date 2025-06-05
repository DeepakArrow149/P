// Script to create 5 sample orders and save to MySQL database
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:9002';

// Sample order data with different characteristics
const sampleOrders = [
  {
    orderReference: 'ORD-2025-001',
    description: 'Summer Collection T-Shirts for European Market',
    product: 'Basic Cotton T-Shirt',
    customer: 'Fashion Forward EU',
    timetable: 'Q2 2025',
    orderSet: 'Summer-2025',
    salesYear: 2025,
    season: 'Summer',
    efficiency: 85,
    userStatus: 'Active',
    learningCurveId: 'standard-apparel',
    tnaTemplate: 'basic-garment-template',
    status: 'confirmed',
    color: '#FF6B6B',
    contractQuantity: 5000,
    distributeFrom: 'Main Warehouse',
    deliverTo: 'European Distribution Center',
    method: 'Sea Freight',
    planInGroup: 'Group-A',
    useRoute: 'EU-Route-1',
    orderDate: new Date('2025-06-01').toISOString(),
    receivedDate: new Date('2025-06-01').toISOString(),
    generalNotes: 'High priority order for summer season launch',
    poLines: [
      {
        id: 'po-summer-001',
        soNo: 'SO-2025-001',
        poName: 'EU Summer Basic Tees',
        deliveryDate: new Date('2025-08-15').toISOString(),
        country: 'Germany',
        extraPercentage: 5,
        sizeQuantities: [
          { sizeName: 'XS', quantity: 300 },
          { sizeName: 'S', quantity: 800 },
          { sizeName: 'M', quantity: 1200 },
          { sizeName: 'L', quantity: 1000 },
          { sizeName: 'XL', quantity: 500 },
          { sizeName: 'XXL', quantity: 200 }
        ]
      },
      {
        id: 'po-summer-002',
        soNo: 'SO-2025-002',
        poName: 'EU Summer Premium Tees',
        deliveryDate: new Date('2025-08-30').toISOString(),
        country: 'France',
        extraPercentage: 3,
        sizeQuantities: [
          { sizeName: 'XS', quantity: 200 },
          { sizeName: 'S', quantity: 600 },
          { sizeName: 'M', quantity: 800 },
          { sizeName: 'L', quantity: 700 },
          { sizeName: 'XL', quantity: 400 },
          { sizeName: 'XXL', quantity: 300 }
        ]
      }
    ],
    deliveryDetails: [
      {
        id: 'delivery-summer-001',
        deliveryDate: new Date('2025-08-15').toISOString(),
        quantity: 4000,
        reference: 'First Batch - Core Sizes'
      },
      {
        id: 'delivery-summer-002',
        deliveryDate: new Date('2025-08-30').toISOString(),
        quantity: 3000,
        reference: 'Second Batch - Extended Sizes'
      }
    ],
    activeSizeNames: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  },

  {
    orderReference: 'ORD-2025-002',
    description: 'Athletic Wear Collection for North American Market',
    product: 'Performance Athletic Shorts',
    customer: 'SportZone USA',
    timetable: 'Q3 2025',
    orderSet: 'Athletic-2025',
    salesYear: 2025,
    season: 'Fall',
    efficiency: 92,
    userStatus: 'In Progress',
    learningCurveId: 'athletic-wear',
    tnaTemplate: 'sports-garment-template',
    status: 'in_progress',
    color: '#4ECDC4',
    contractQuantity: 8000,
    distributeFrom: 'US Production Hub',
    deliverTo: 'North American Retail Centers',
    method: 'Ground Transportation',
    planInGroup: 'Group-B',
    useRoute: 'US-Route-2',
    orderDate: new Date('2025-05-15').toISOString(),
    receivedDate: new Date('2025-05-20').toISOString(),
    generalNotes: 'Focus on moisture-wicking fabric and athletic fit',
    planningNotes: 'Coordinate with athletic wear production line',
    poLines: [
      {
        id: 'po-athletic-001',
        soNo: 'SO-2025-003',
        poName: 'Performance Shorts - Men',
        deliveryDate: new Date('2025-09-10').toISOString(),
        country: 'United States',
        extraPercentage: 2,
        sizeQuantities: [
          { sizeName: 'S', quantity: 800 },
          { sizeName: 'M', quantity: 1500 },
          { sizeName: 'L', quantity: 1800 },
          { sizeName: 'XL', quantity: 1200 },
          { sizeName: 'XXL', quantity: 700 }
        ]
      },
      {
        id: 'po-athletic-002',
        soNo: 'SO-2025-004',
        poName: 'Performance Shorts - Women',
        deliveryDate: new Date('2025-09-15').toISOString(),
        country: 'United States',
        extraPercentage: 2,
        sizeQuantities: [
          { sizeName: 'XS', quantity: 400 },
          { sizeName: 'S', quantity: 900 },
          { sizeName: 'M', quantity: 1100 },
          { sizeName: 'L', quantity: 800 },
          { sizeName: 'XL', quantity: 300 }
        ]
      }
    ],
    deliveryDetails: [
      {
        id: 'delivery-athletic-001',
        deliveryDate: new Date('2025-09-10').toISOString(),
        quantity: 6000,
        reference: 'Men\'s Athletic Shorts'
      },
      {
        id: 'delivery-athletic-002',
        deliveryDate: new Date('2025-09-15').toISOString(),
        quantity: 3500,
        reference: 'Women\'s Athletic Shorts'
      }
    ],
    activeSizeNames: ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  },

  {
    orderReference: 'ORD-2025-003',
    description: 'Corporate Uniforms for Hospitality Chain',
    product: 'Professional Polo Shirts',
    customer: 'Grand Hotels International',
    timetable: 'Q4 2025',
    orderSet: 'Corporate-2025',
    salesYear: 2025,
    season: 'All Season',
    efficiency: 88,
    userStatus: 'Pending Approval',
    learningCurveId: 'corporate-uniform',
    tnaTemplate: 'uniform-template',
    status: 'provisional',
    color: '#45B7D1',
    contractQuantity: 3000,
    distributeFrom: 'Corporate Hub',
    deliverTo: 'Hotel Chain Locations',
    method: 'Express Delivery',
    planInGroup: 'Group-C',
    useRoute: 'Corporate-Route-1',
    orderDate: new Date('2025-06-03').toISOString(),
    receivedDate: new Date('2025-06-03').toISOString(),
    generalNotes: 'Corporate branding with logo embroidery required',
    materialsNotes: 'Use premium cotton blend for professional appearance',
    poLines: [
      {
        id: 'po-corporate-001',
        soNo: 'SO-2025-005',
        poName: 'Hotel Staff Polos - Navy',
        deliveryDate: new Date('2025-10-01').toISOString(),
        country: 'Multiple Locations',
        extraPercentage: 8,
        sizeQuantities: [
          { sizeName: 'S', quantity: 400 },
          { sizeName: 'M', quantity: 800 },
          { sizeName: 'L', quantity: 900 },
          { sizeName: 'XL', quantity: 600 },
          { sizeName: 'XXL', quantity: 300 }
        ]
      }
    ],
    deliveryDetails: [
      {
        id: 'delivery-corporate-001',
        deliveryDate: new Date('2025-10-01').toISOString(),
        quantity: 3000,
        reference: 'Complete Corporate Uniform Set'
      }
    ],
    activeSizeNames: ['S', 'M', 'L', 'XL', 'XXL']
  },

  {
    orderReference: 'ORD-2025-004',
    description: 'Designer Collection for Fashion Week Launch',
    product: 'Premium Designer Dress',
    customer: 'Elite Fashion House',
    timetable: 'Fashion Week 2025',
    orderSet: 'Designer-2025',
    salesYear: 2025,
    season: 'Spring',
    efficiency: 95,
    userStatus: 'High Priority',
    learningCurveId: 'premium-fashion',
    tnaTemplate: 'designer-template',
    status: 'confirmed',
    color: '#F39C12',
    contractQuantity: 1200,
    distributeFrom: 'Designer Atelier',
    deliverTo: 'Luxury Boutiques',
    method: 'Premium Courier',
    planInGroup: 'Group-Premium',
    useRoute: 'Luxury-Route-1',
    orderDate: new Date('2025-05-28').toISOString(),
    receivedDate: new Date('2025-05-30').toISOString(),
    generalNotes: 'Highest quality standards required for fashion week debut',
    sizesNotes: 'Premium sizing with exact fit requirements',
    eventsNotes: 'Must be ready for Fashion Week runway shows',
    poLines: [
      {
        id: 'po-designer-001',
        soNo: 'SO-2025-006',
        poName: 'Designer Collection - Main Line',
        deliveryDate: new Date('2025-07-15').toISOString(),
        country: 'Milan, Italy',
        extraPercentage: 15,
        sizeQuantities: [
          { sizeName: 'XS', quantity: 150 },
          { sizeName: 'S', quantity: 300 },
          { sizeName: 'M', quantity: 400 },
          { sizeName: 'L', quantity: 250 },
          { sizeName: 'XL', quantity: 100 }
        ]
      }
    ],
    deliveryDetails: [
      {
        id: 'delivery-designer-001',
        deliveryDate: new Date('2025-07-15').toISOString(),
        quantity: 1200,
        reference: 'Fashion Week Collection - Complete Set'
      }
    ],
    activeSizeNames: ['XS', 'S', 'M', 'L', 'XL']
  },

  {
    orderReference: 'ORD-2025-005',
    description: 'Children\'s School Uniform Collection',
    product: 'School Polo Shirts and Pants',
    customer: 'Educational Uniform Supply Co',
    timetable: 'Back to School 2025',
    orderSet: 'School-2025',
    salesYear: 2025,
    season: 'Fall',
    efficiency: 90,
    userStatus: 'Scheduled',
    learningCurveId: 'childrens-wear',
    tnaTemplate: 'school-uniform-template',
    status: 'unscheduled',
    color: '#8E44AD',
    contractQuantity: 6500,
    distributeFrom: 'Education Supply Center',
    deliverTo: 'School Districts',
    method: 'Standard Shipping',
    planInGroup: 'Group-D',
    useRoute: 'Education-Route-1',
    orderDate: new Date('2025-06-02').toISOString(),
    receivedDate: new Date('2025-06-04').toISOString(),
    generalNotes: 'Durable fabrics suitable for active children',
    sizesNotes: 'Wide range of children sizes from age 5-18',
    planningNotes: 'Schedule for completion before school year starts',
    poLines: [
      {
        id: 'po-school-001',
        soNo: 'SO-2025-007',
        poName: 'Elementary School Uniforms',
        deliveryDate: new Date('2025-08-01').toISOString(),
        country: 'United States',
        extraPercentage: 10,
        sizeQuantities: [
          { sizeName: 'Age 5-6', quantity: 400 },
          { sizeName: 'Age 7-8', quantity: 600 },
          { sizeName: 'Age 9-10', quantity: 700 },
          { sizeName: 'Age 11-12', quantity: 600 }
        ]
      },
      {
        id: 'po-school-002',
        soNo: 'SO-2025-008',
        poName: 'Middle & High School Uniforms',
        deliveryDate: new Date('2025-08-10').toISOString(),
        country: 'United States',
        extraPercentage: 8,
        sizeQuantities: [
          { sizeName: 'Age 13-14', quantity: 800 },
          { sizeName: 'Age 15-16', quantity: 900 },
          { sizeName: 'Age 17-18', quantity: 700 }
        ]
      }
    ],
    deliveryDetails: [
      {
        id: 'delivery-school-001',
        deliveryDate: new Date('2025-08-01').toISOString(),
        quantity: 2300,
        reference: 'Elementary School Batch'
      },
      {
        id: 'delivery-school-002',
        deliveryDate: new Date('2025-08-10').toISOString(),
        quantity: 2400,
        reference: 'Middle & High School Batch'
      }
    ],
    activeSizeNames: ['Age 5-6', 'Age 7-8', 'Age 9-10', 'Age 11-12', 'Age 13-14', 'Age 15-16', 'Age 17-18']
  }
];

async function createSampleOrders() {
  console.log('🏭 Creating 5 Sample Orders for MySQL Database...\n');

  try {
    // Use native fetch for Node.js 18+
    const fetch = globalThis.fetch || require('node-fetch');

    for (let i = 0; i < sampleOrders.length; i++) {
      const order = sampleOrders[i];
      console.log(`📦 Creating Order ${i + 1}: ${order.orderReference}`);
      console.log(`   Product: ${order.product}`);
      console.log(`   Customer: ${order.customer}`);
      console.log(`   Quantity: ${order.contractQuantity} units`);
      console.log(`   Status: ${order.status}`);

      const response = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order)
      });

      const result = await response.json();

      if (result.success) {
        console.log(`   ✅ Order created successfully (ID: ${result.data.id})`);
      } else {
        console.log(`   ❌ Failed to create order: ${result.error}`);
        if (result.details) {
          console.log(`   Details:`, result.details);
        }
      }
      console.log('');
    }

    // Verify all orders were created
    console.log('📊 Verifying orders in database...');
    const verifyResponse = await fetch(`${BASE_URL}/api/orders`);
    const verifyResult = await verifyResponse.json();

    if (verifyResult.success) {
      console.log(`✅ Database now contains ${verifyResult.data.length} orders total`);
      console.log('\n📋 Order Summary:');
      verifyResult.data.forEach((order, index) => {
        const totalQuantity = order.poLines.reduce((sum, poLine) => {
          return sum + poLine.sizeQuantities.reduce((lineSum, size) => lineSum + size.quantity, 0);
        }, 0);
        
        console.log(`   ${index + 1}. ${order.order_reference} - ${order.product} (${totalQuantity} units) - Status: ${order.status}`);
      });
    } else {
      console.log('❌ Failed to verify orders in database');
    }

    console.log('\n🎉 Sample order creation complete!');
    console.log('💡 You can now view these orders in the application:');
    console.log('   - Order List: http://localhost:9002/order-list');
    console.log('   - Unscheduled Orders: http://localhost:9002/unscheduled-orders');
    console.log('   - Production Updates: http://localhost:9002/production-updates');

  } catch (error) {
    console.error('❌ Error creating sample orders:', error.message);
  }
}

// Run the script
createSampleOrders();
