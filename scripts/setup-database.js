const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function setupDatabase() {
  console.log('🔍 MySQL Database Setup and Verification');
  console.log('=' .repeat(50));
  
  // Check if MySQL server is running by trying to connect without database
  let connection;
  
  try {
    console.log('Step 1: Testing MySQL server connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT);
    console.log('User:', process.env.DB_USER);
    
    // Try connecting without specifying a database first
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });

    console.log('✅ MySQL server connection successful!');    // Check if the database exists
    console.log('\nStep 2: Checking if database exists...');
    const [databases] = await connection.execute(`SHOW DATABASES LIKE '${process.env.DB_NAME}'`);
    
    if (databases.length === 0) {
      console.log(`❌ Database '${process.env.DB_NAME}' does not exist.`);
      console.log('Creating database...');
      
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
      console.log(`✅ Database '${process.env.DB_NAME}' created successfully!`);
    } else {
      console.log(`✅ Database '${process.env.DB_NAME}' already exists.`);
    }

    // Close connection and reconnect to the specific database
    await connection.end();
    
    console.log('\nStep 3: Testing connection to the specific database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log(`✅ Connected to database '${process.env.DB_NAME}' successfully!`);

    // Check and create buyers table
    console.log('\nStep 4: Checking buyers table...');
    const [tables] = await connection.execute("SHOW TABLES LIKE 'buyers'");
    
    if (tables.length === 0) {
      console.log('Creating buyers table...');
      
      const createTableSQL = `
        CREATE TABLE buyers (
          id VARCHAR(36) PRIMARY KEY,
          code VARCHAR(10) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          contactPerson VARCHAR(100),
          email VARCHAR(100),
          phone VARCHAR(20),
          address TEXT,
          isActive BOOLEAN DEFAULT true,
          notes TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `;
      
      await connection.execute(createTableSQL);
      console.log('✅ Buyers table created successfully!');
    } else {
      console.log('✅ Buyers table already exists.');
    }

    // Test query
    console.log('\nStep 5: Running test query...');
    const [result] = await connection.execute('SELECT COUNT(*) as count FROM buyers');
    console.log(`✅ Test query successful. Current buyers count: ${result[0].count}`);

    console.log('\n🎉 Database setup completed successfully!');
    console.log('You can now run the application with: npm run dev');

  } catch (error) {
    console.error('\n❌ Database setup failed:');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access denied - Please check:');
      console.error('1. MySQL server is running');
      console.error('2. Username and password are correct');
      console.error('3. User has proper permissions');
      console.error('\nTo fix this, you can:');
      console.error('1. Update the password in .env.local');
      console.error('2. Or run: mysql -u root -p');
      console.error('   Then execute: ALTER USER \'root\'@\'localhost\' IDENTIFIED BY \'your_new_password\';');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused - MySQL server is not running');
      console.error('Please start MySQL server first');
    } else {
      console.error('Error details:', error.message);
      console.error('Full error:', error);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

setupDatabase();
