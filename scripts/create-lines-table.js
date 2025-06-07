const mysql = require('mysql2/promise');

async function createLinesTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'planner_react',
    });

    console.log('Connected to MySQL database');

    // Create lines table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS lines (
        id VARCHAR(50) PRIMARY KEY,
        lineCode VARCHAR(20) NOT NULL UNIQUE,
        lineName VARCHAR(100) NOT NULL,
        unitId VARCHAR(50) NOT NULL,
        lineType ENUM('Sewing', 'Cutting', 'Finishing', 'Assembly', 'Packing', 'Other') DEFAULT NULL,
        defaultCapacity INT DEFAULT 0,
        notes TEXT DEFAULT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_line_code (lineCode),
        INDEX idx_line_name (lineName),
        INDEX idx_unit_id (unitId),
        INDEX idx_line_type (lineType)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createTableSQL);
    console.log('✅ Lines table created successfully!');

    // Insert sample lines
    const sampleLines = [
      {
        id: 'line-001',
        lineCode: 'LINE-001',
        lineName: 'Sewing Line 1',
        unitId: 'unit-001',
        lineType: 'Sewing',
        defaultCapacity: 100,
        notes: 'Main sewing line'
      },
      {
        id: 'line-002',
        lineCode: 'LINE-002',
        lineName: 'Sewing Line 2',
        unitId: 'unit-001',
        lineType: 'Sewing',
        defaultCapacity: 120,
        notes: 'Secondary sewing line'
      },
      {
        id: 'line-003',
        lineCode: 'LINE-003',
        lineName: 'Cutting Line 1',
        unitId: 'unit-001',
        lineType: 'Cutting',
        defaultCapacity: 200,
        notes: 'Main cutting line'
      },
      {
        id: 'line-004',
        lineCode: 'LINE-004',
        lineName: 'Finishing Line 1',
        unitId: 'unit-001',
        lineType: 'Finishing',
        defaultCapacity: 80,
        notes: 'Main finishing line'
      },
      {
        id: 'line-005',
        lineCode: 'LINE-005',
        lineName: 'Assembly Line 1',
        unitId: 'unit-001',
        lineType: 'Assembly',
        defaultCapacity: 90,
        notes: 'Main assembly line'
      }
    ];

    for (const line of sampleLines) {
      try {
        await connection.execute(
          'INSERT INTO lines (id, lineCode, lineName, unitId, lineType, defaultCapacity, notes) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE lineName = VALUES(lineName)',
          [line.id, line.lineCode, line.lineName, line.unitId, line.lineType, line.defaultCapacity, line.notes]
        );
        console.log(`✓ Created/Updated line: ${line.lineName}`);
      } catch (error) {
        console.log(`- Line ${line.lineName} already exists or error:`, error.message);
      }
    }

    console.log('✅ Lines table setup completed!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createLinesTable();
