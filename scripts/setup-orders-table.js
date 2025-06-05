// scripts/setup-orders-table.js
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function setupOrdersTable() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Connected to database successfully!');

    // Check if orders table exists
    console.log('\nChecking if orders table exists...');
    const [tables] = await connection.execute("SHOW TABLES LIKE 'orders'");
    
    if (tables.length === 0) {
      console.log('Creating orders table...');
      
      const createOrdersTableSQL = `
        CREATE TABLE orders (
          id VARCHAR(36) PRIMARY KEY,
          order_reference VARCHAR(100) NOT NULL,
          description TEXT,
          product VARCHAR(100),
          customer VARCHAR(100),
          buyer VARCHAR(100),
          style_name VARCHAR(100),
          timetable VARCHAR(50),
          order_set VARCHAR(100),
          sales_year INT,
          season VARCHAR(50),
          efficiency DECIMAL(5,2),
          user_status VARCHAR(50),
          learning_curve_id VARCHAR(36),
          tna_template VARCHAR(50),
          status ENUM('confirmed', 'provisional', 'speculative', 'transit', 'unscheduled', 'scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold', 'pending') DEFAULT 'provisional',
          color VARCHAR(7) DEFAULT '#FFFFFF',
          is_completed BOOLEAN DEFAULT FALSE,
          
          -- Date fields
          order_date DATE,
          received_date DATE,
          launch_date DATE,
          ship_date DATE,
          
          -- Logistics
          contract_quantity INT,
          distribute_from VARCHAR(100),
          deliver_to VARCHAR(100),
          method VARCHAR(50),
          plan_in_group VARCHAR(50),
          use_route VARCHAR(50),
          delivered_quantity INT DEFAULT 0,
          reservation VARCHAR(100),
          schedule_offset VARCHAR(50),
          
          -- Notes fields
          general_notes TEXT,
          financial_notes TEXT,
          sizes_notes TEXT,
          planning_notes TEXT,
          materials_notes TEXT,
          events_notes TEXT,
          user_values_notes TEXT,
          consolidated_view_notes TEXT,
          progress_view_notes TEXT,
          
          -- Metadata
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          -- Indexes
          INDEX idx_order_reference (order_reference),
          INDEX idx_customer (customer),
          INDEX idx_buyer (buyer),
          INDEX idx_status (status),
          INDEX idx_order_date (order_date),
          INDEX idx_ship_date (ship_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      
      await connection.execute(createOrdersTableSQL);
      console.log('✅ Orders table created successfully!');
    } else {
      console.log('✅ Orders table already exists.');
    }

    // Create delivery_details table
    console.log('\nChecking if delivery_details table exists...');
    const [deliveryTables] = await connection.execute("SHOW TABLES LIKE 'delivery_details'");
    
    if (deliveryTables.length === 0) {
      console.log('Creating delivery_details table...');
      
      const createDeliveryDetailsSQL = `
        CREATE TABLE delivery_details (
          id VARCHAR(36) PRIMARY KEY,
          order_id VARCHAR(36) NOT NULL,
          delivery_date DATE NOT NULL,
          quantity INT NOT NULL DEFAULT 0,
          reference VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          INDEX idx_order_id (order_id),
          INDEX idx_delivery_date (delivery_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      
      await connection.execute(createDeliveryDetailsSQL);
      console.log('✅ Delivery details table created successfully!');
    } else {
      console.log('✅ Delivery details table already exists.');
    }

    // Create po_lines table
    console.log('\nChecking if po_lines table exists...');
    const [poLinesTables] = await connection.execute("SHOW TABLES LIKE 'po_lines'");
    
    if (poLinesTables.length === 0) {
      console.log('Creating po_lines table...');
      
      const createPoLinesSQL = `
        CREATE TABLE po_lines (
          id VARCHAR(36) PRIMARY KEY,
          order_id VARCHAR(36) NOT NULL,
          so_no VARCHAR(100),
          po_name VARCHAR(100),
          delivery_date DATE,
          country VARCHAR(100),
          extra_percentage DECIMAL(5,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          INDEX idx_order_id (order_id),
          INDEX idx_delivery_date (delivery_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      
      await connection.execute(createPoLinesSQL);
      console.log('✅ PO lines table created successfully!');
    } else {
      console.log('✅ PO lines table already exists.');
    }

    // Create size_quantities table
    console.log('\nChecking if size_quantities table exists...');
    const [sizeQuantitiesTables] = await connection.execute("SHOW TABLES LIKE 'size_quantities'");
    
    if (sizeQuantitiesTables.length === 0) {
      console.log('Creating size_quantities table...');
      
      const createSizeQuantitiesSQL = `
        CREATE TABLE size_quantities (
          id VARCHAR(36) PRIMARY KEY,
          po_line_id VARCHAR(36) NOT NULL,
          size_name VARCHAR(20) NOT NULL,
          quantity INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          FOREIGN KEY (po_line_id) REFERENCES po_lines(id) ON DELETE CASCADE,
          INDEX idx_po_line_id (po_line_id),
          INDEX idx_size_name (size_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      
      await connection.execute(createSizeQuantitiesSQL);
      console.log('✅ Size quantities table created successfully!');
    } else {
      console.log('✅ Size quantities table already exists.');
    }

    // Verify tables were created
    console.log('\nVerifying table creation...');
    const [allTables] = await connection.execute('SHOW TABLES');
    console.log('All tables in database:');
    allTables.forEach(table => console.log('-', Object.values(table)[0]));

    console.log('\n🎉 Orders database setup completed successfully!');
    console.log('The following tables are now available:');
    console.log('- orders (main order data)');
    console.log('- delivery_details (delivery schedule)');
    console.log('- po_lines (purchase order lines)');
    console.log('- size_quantities (size breakdown per PO line)');

  } catch (error) {
    console.error('\n❌ Orders table setup failed:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

setupOrdersTable();
