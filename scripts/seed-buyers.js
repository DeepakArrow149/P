const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const sampleBuyers = [
  {
    code: 'B001',
    name: 'Global Fashion Inc.',
    contactPerson: 'John Smith',
    email: 'john.smith@globalfashion.com',
    phone: '+1-555-0123',
    address: '123 Fashion Avenue, New York, NY 10001'
  },
  {
    code: 'B002',
    name: 'European Styles Ltd.',
    contactPerson: 'Marie Dubois',
    email: 'marie.dubois@europeanstyles.eu',
    phone: '+33-1-23-45-67-89',
    address: '45 Rue de la Mode, 75001 Paris'
  },
  {
    code: 'B003',
    name: 'Asian Apparel Co.',
    contactPerson: 'Hiroshi Tanaka',
    email: 'h.tanaka@asianapparel.jp',
    phone: '+81-3-1234-5678',
    address: '7-1-1 Ginza, Chuo-ku, Tokyo 104-0061'
  },
  {
    code: 'B004',
    name: 'Fast Fashion Group',
    contactPerson: 'Sarah Wilson',
    email: 'sarah.wilson@fastfashion.com',
    phone: '+44-20-7123-4567',
    address: '100 Oxford Street, London W1C 1DX'
  },
  {
    code: 'B005',
    name: 'Casual Wear Express',
    contactPerson: 'Michael Brown',
    email: 'michael.brown@casualwear.com',
    phone: '+1-555-0456',
    address: '789 Commerce Street, Los Angeles, CA 90028'
  }
];

async function seedBuyers() {
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

    console.log('Connected to database successfully!');    console.log('Connected to database successfully!');

    // Check if data already exists
    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM buyers');
    if (existing[0].count > 0) {
      console.log(`Table already contains ${existing[0].count} records. Skipping seed data.`);
      return;
    }

    // Insert sample buyers
    console.log('Inserting sample buyer data...');
    for (const buyer of sampleBuyers) {
      await connection.execute(
        'INSERT INTO buyers (id, code, name, contactPerson, email, phone, address, isActive) VALUES (UUID(), ?, ?, ?, ?, ?, ?, 1)',
        [buyer.code, buyer.name, buyer.contactPerson, buyer.email, buyer.phone, buyer.address]
      );
    }

    console.log(`Successfully inserted ${sampleBuyers.length} sample buyers!`);    // Display the inserted data
    const [buyers] = await connection.execute('SELECT * FROM buyers ORDER BY code');
    console.log('\nInserted buyers:');
    console.table(buyers);

  } catch (error) {
    console.error('Error seeding buyers:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed.');
    }
  }
}

seedBuyers();
