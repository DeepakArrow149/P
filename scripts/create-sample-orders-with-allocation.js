// Script to create 10 sample orders with realistic master data
// 4 orders will be allocated to planning board (status = 'scheduled' and assignedLine filled)

const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'planner_react',
};

// Sample data for realistic orders
const sampleBuyers = [
  { code: 'H&M001', name: 'H&M Global' },
  { code: 'ZARA001', name: 'Zara International' },
  { code: 'NIKE001', name: 'Nike Inc.' },
  { code: 'GAP001', name: 'Gap Inc.' },
  { code: 'UNIQ001', name: 'Uniqlo' }
];

const sampleProducts = [
  { name: 'Basic T-Shirt', style: 'BT-2024-001' },
  { name: 'Cotton Polo', style: 'CP-2024-002' },
  { name: 'Denim Jeans', style: 'DJ-2024-003' },
  { name: 'Casual Hoodie', style: 'CH-2024-004' },
  { name: 'Summer Dress', style: 'SD-2024-005' },
  { name: 'Sports Jacket', style: 'SJ-2024-006' },
  { name: 'Cargo Pants', style: 'CRP-2024-007' },
  { name: 'Blouse Shirt', style: 'BS-2024-008' },
  { name: 'Winter Coat', style: 'WC-2024-009' },
  { name: 'Swimwear Set', style: 'SW-2024-010' }
];

const sampleSeasons = ['Spring', 'Summer', 'Fall', 'Winter'];
const sampleColors = ['Navy', 'Black', 'White', 'Grey', 'Red', 'Blue', 'Green', 'Pink'];

// Function to generate random date within range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Function to generate unique order reference
function generateOrderRef(index) {
  const year = new Date().getFullYear();
  return `ORD-${year}-${String(index + 1).padStart(4, '0')}`;
}

async function createSampleOrders() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');    // First, ensure we have some buyers in the database
    console.log('\\n1. Creating sample buyers...');
    for (const buyer of sampleBuyers) {
      try {
        await connection.execute(
          `INSERT INTO buyers (id, code, name, contactPerson, email, phone, address, isActive, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE name = VALUES(name)`,
          [
            `buyer-${buyer.code.toLowerCase()}`,
            buyer.code,
            buyer.name,
            'Sample Contact',
            `contact@${buyer.code.toLowerCase()}.com`,
            '+1-555-0100',
            '123 Fashion Street',
            1 // true for isActive
          ]
        );
        console.log(`✓ Created/Updated buyer: ${buyer.name}`);
      } catch (error) {
        console.log(`- Buyer ${buyer.name} already exists or error:`, error.message);
      }
    }// Ensure we have some lines in the database
    console.log('\\n2. Creating sample lines...');
    
    // First create the lines table if it doesn't exist
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS \`lines\` (
          id VARCHAR(50) PRIMARY KEY,
          lineCode VARCHAR(20) NOT NULL UNIQUE,
          lineName VARCHAR(100) NOT NULL,
          unitId VARCHAR(50) NOT NULL,
          lineType VARCHAR(20),
          defaultCapacity INT DEFAULT 0,
          notes TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✓ Lines table created/verified');
    } catch (error) {
      console.log('- Lines table creation error:', error.message);
    }
    
    const sampleLines = [
      { code: 'LINE-001', name: 'Sewing Line 1', type: 'Sewing' },
      { code: 'LINE-002', name: 'Sewing Line 2', type: 'Sewing' },
      { code: 'LINE-003', name: 'Cutting Line 1', type: 'Cutting' },
      { code: 'LINE-004', name: 'Finishing Line 1', type: 'Finishing' },
      { code: 'LINE-005', name: 'Assembly Line 1', type: 'Assembly' }
    ];

    for (const line of sampleLines) {
      try {
        await connection.execute(
          `INSERT INTO \`lines\` (id, lineCode, lineName, unitId, lineType, defaultCapacity, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE lineName = VALUES(lineName)`,
          [
            `line-${line.code.toLowerCase()}`,
            line.code,
            line.name,
            'unit-001', // Default unit
            line.type,
            100 // Default capacity
          ]
        );
        console.log(`✓ Created/Updated line: ${line.name}`);
      } catch (error) {
        console.log(`- Line ${line.name} already exists or error:`, error.message);
      }
    }

    // Get available lines for allocation
    let availableLines = [];
    try {
      const [result] = await connection.execute('SELECT id, lineCode, lineName FROM `lines` LIMIT 5');
      availableLines = result;
      console.log(`\\nFound ${availableLines.length} available lines for allocation`);
    } catch (error) {
      console.log('\\nWarning: Could not fetch lines, orders will be created without line allocation');
      console.log('Lines fetch error:', error.message);
    }

    // Create 10 sample orders
    console.log('\\n3. Creating 10 sample orders...');
    
    const orders = [];
    const today = new Date();
    const futureDate = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 days from now
    
    for (let i = 0; i < 10; i++) {
      const buyer = sampleBuyers[i % sampleBuyers.length];
      const product = sampleProducts[i];
      const season = sampleSeasons[Math.floor(Math.random() * sampleSeasons.length)];
      const color = sampleColors[Math.floor(Math.random() * sampleColors.length)];
      
      // Determine if this order should be allocated (first 4 orders)
      const isAllocated = i < 4;
      const status = isAllocated ? 'scheduled' : (i < 6 ? 'confirmed' : 'provisional');
      const assignedLine = isAllocated && availableLines.length > 0 ? availableLines[i % availableLines.length].id : null;
      
      const orderData = {
        id: `order-${Date.now()}-${i}`,
        order_reference: generateOrderRef(i),
        description: `${product.name} for ${season} collection`,
        product: product.name,
        customer: buyer.name,
        buyer: buyer.code,
        style_name: product.style,
        order_set: `SET-${season.toUpperCase()}-2024`,
        sales_year: 2024,
        season: season,
        efficiency: Math.floor(Math.random() * 20) + 80, // 80-99%
        status: status,
        color: color,
        order_date: randomDate(new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000)), today),
        received_date: randomDate(new Date(today.getTime() - (20 * 24 * 60 * 60 * 1000)), today),
        launch_date: randomDate(today, futureDate),
        ship_date: randomDate(new Date(today.getTime() + (60 * 24 * 60 * 60 * 1000)), futureDate),
        contract_quantity: Math.floor(Math.random() * 5000) + 1000, // 1000-6000 pieces
        deliver_to: 'Main Warehouse',
        method: 'Standard Production',
        delivered_quantity: 0,
        planning_notes: isAllocated ? `Allocated to ${availableLines[i % availableLines.length]?.lineName || 'Line'}` : '',
        assignedLine: assignedLine
      };
      
      orders.push(orderData);
    }

    // Insert orders into database
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      try {
        await connection.execute(
          `INSERT INTO orders (
            id, order_reference, description, product, customer, buyer, style_name, 
            order_set, sales_year, season, efficiency, status, color, order_date, 
            received_date, launch_date, ship_date, contract_quantity, deliver_to, 
            method, delivered_quantity, planning_notes, assignedLine, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            order.id, order.order_reference, order.description, order.product,
            order.customer, order.buyer, order.style_name, order.order_set,
            order.sales_year, order.season, order.efficiency, order.status,
            order.color, order.order_date, order.received_date, order.launch_date,
            order.ship_date, order.contract_quantity, order.deliver_to,
            order.method, order.delivered_quantity, order.planning_notes, order.assignedLine
          ]
        );
        
        const statusIcon = order.status === 'scheduled' ? '📋' : (order.status === 'confirmed' ? '✅' : '📝');
        const allocation = order.assignedLine ? ` → ${availableLines.find(l => l.id === order.assignedLine)?.lineName}` : '';
        console.log(`${statusIcon} Created order: ${order.order_reference} (${order.product}) - ${order.status}${allocation}`);
      } catch (error) {
        console.error(`❌ Error creating order ${order.order_reference}:`, error.message);
      }
    }

    // Summary
    console.log('\\n4. Summary:');
    const [orderCount] = await connection.execute('SELECT COUNT(*) as total FROM orders');
    const [allocatedCount] = await connection.execute('SELECT COUNT(*) as allocated FROM orders WHERE status = "scheduled" AND assignedLine IS NOT NULL');
    const [confirmedCount] = await connection.execute('SELECT COUNT(*) as confirmed FROM orders WHERE status = "confirmed"');
    const [provisionalCount] = await connection.execute('SELECT COUNT(*) as provisional FROM orders WHERE status = "provisional"');
    
    console.log(`📊 Total orders in database: ${orderCount[0].total}`);
    console.log(`📋 Allocated to planning board: ${allocatedCount[0].allocated}`);
    console.log(`✅ Confirmed orders: ${confirmedCount[0].confirmed}`);
    console.log(`📝 Provisional orders: ${provisionalCount[0].provisional}`);

    console.log('\\n✅ Sample orders created successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the script
createSampleOrders().catch(console.error);
