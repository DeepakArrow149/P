// scripts/seed-lines.js
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

const seedData = [
  {
    id: 'line-dg-01',
    lineCode: 'DG-L01',
    lineName: 'DG - Line 1',
    unitId: 'unit-1',
    lineType: 'Sewing',
    defaultCapacity: 1000,
    notes: 'Specializes in knitwear.',
  },
  {
    id: 'line-dg-02',
    lineCode: 'DG-L02',
    lineName: 'DG - Line 2',
    unitId: 'unit-1',
    lineType: 'Sewing',
    defaultCapacity: 850,
    notes: 'Handles complex garments.',
  },
  {
    id: 'line-dg-03',
    lineCode: 'DG-L03',
    lineName: 'DG - Line 3 (Cutting)',
    unitId: 'unit-1',
    lineType: 'Cutting',
    defaultCapacity: 5000,
    notes: 'Automated cutting tables.',
  },
  {
    id: 'line-sz-01',
    lineCode: 'SZ-L01',
    lineName: 'SH - Line 1',
    unitId: 'unit-2',
    lineType: 'Sewing',
    defaultCapacity: 1200,
    notes: null,
  },
  {
    id: 'line-sz-02',
    lineCode: 'SZ-L02',
    lineName: 'SH - Line 2 (Finishing)',
    unitId: 'unit-2',
    lineType: 'Finishing',
    defaultCapacity: 2000,
    notes: 'Pressing and packing.',
  },
  {
    id: 'line-hk-01',
    lineCode: 'HK-L01',
    lineName: 'HK - Assembly Line 1',
    unitId: 'unit-3',
    lineType: 'Assembly',
    defaultCapacity: 800,
    notes: 'Manual assembly operations.',
  },
  {
    id: 'line-hk-02',
    lineCode: 'HK-L02',
    lineName: 'HK - Packing Line 1',
    unitId: 'unit-3',
    lineType: 'Packing',
    defaultCapacity: 3000,
    notes: 'High-speed packing line.',
  },
];

async function seedLines() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'planner_react',
    });

    console.log('Connected to MySQL database');

    // Create table if it doesn't exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS lines (
        id VARCHAR(50) PRIMARY KEY,
        line_code VARCHAR(20) NOT NULL UNIQUE,
        line_name VARCHAR(100) NOT NULL,
        unit_id VARCHAR(50) NOT NULL,
        line_type ENUM('Sewing', 'Cutting', 'Finishing', 'Assembly', 'Packing', 'Other') DEFAULT NULL,
        default_capacity INT DEFAULT 0,
        notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_line_code (line_code),
        INDEX idx_line_name (line_name),
        INDEX idx_unit_id (unit_id),
        INDEX idx_line_type (line_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('Lines table created/verified');

    // Clear existing data
    await connection.execute('DELETE FROM lines');
    console.log('Cleared existing line data');

    // Insert seed data
    for (const line of seedData) {
      await connection.execute(
        `INSERT INTO lines (id, line_code, line_name, unit_id, line_type, default_capacity, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          line.id,
          line.lineCode,
          line.lineName,
          line.unitId,
          line.lineType,
          line.defaultCapacity,
          line.notes
        ]
      );
    }

    console.log(`Successfully seeded ${seedData.length} lines`);

    // Verify the data
    const [rows] = await connection.execute('SELECT * FROM lines ORDER BY line_code');
    console.log('\nSeeded lines:');
    console.table(rows.map(row => ({
      code: row.line_code,
      name: row.line_name,
      unit: row.unit_id,
      type: row.line_type,
      capacity: row.default_capacity,
      notes: row.notes?.substring(0, 30) + (row.notes?.length > 30 ? '...' : '') || '-'
    })));

  } catch (error) {
    console.error('Error seeding lines:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the seeding
seedLines();
