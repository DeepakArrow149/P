// Planning Board Database Connection Tests
const mysql = require('mysql2/promise');

describe('Planning Board Database Connection Tests', () => {
  let connection;

  beforeAll(async () => {
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'planner_react',
    });
  });

  afterAll(async () => {
    if (connection) {
      await connection.end();
    }
  });

  describe('Database Connectivity', () => {
    test('should connect to MySQL database successfully', async () => {
      expect(connection).toBeDefined();
      const [rows] = await connection.execute('SELECT 1 as test');
      expect(rows).toHaveLength(1);
      expect(rows[0].test).toBe(1);
    });

    test('should connect to correct database', async () => {
      const [rows] = await connection.execute('SELECT DATABASE() as db');
      expect(rows[0].db).toBe('planner_react');
    });
  });

  describe('Table Structure Validation', () => {
    test('should have required orders table with correct structure', async () => {
      const [columns] = await connection.execute('DESCRIBE orders');
      const columnNames = columns.map(col => col.Field);
      
      // Essential planning board fields
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('order_reference');
      expect(columnNames).toContain('product');
      expect(columnNames).toContain('customer');
      expect(columnNames).toContain('buyer');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('contract_quantity');
      expect(columnNames).toContain('assignedLine');
      expect(columnNames).toContain('ship_date');
      expect(columnNames).toContain('order_date');
    });

    test('should have buyers table with master data structure', async () => {
      const [columns] = await connection.execute('DESCRIBE buyers');
      const columnNames = columns.map(col => col.Field);
      
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('code');
      expect(columnNames).toContain('name');
      expect(columnNames).toContain('email');
    });    test('should have lines table with production line structure', async () => {
      const [columns] = await connection.execute('DESCRIBE `lines`');
      const columnNames = columns.map(col => col.Field);
      
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('lineCode');
      expect(columnNames).toContain('lineName');
      expect(columnNames).toContain('description');
    });
  });

  describe('Master Data Validation', () => {
    test('should have buyers master data available', async () => {
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM buyers');
      const count = rows[0].count;
      expect(count).toBeGreaterThan(0);
      expect(count).toBeGreaterThanOrEqual(5);
    });    test('should have production lines master data available', async () => {
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM `lines`');
      const count = rows[0].count;
      expect(count).toBeGreaterThan(0);
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test('buyers should have valid codes and names', async () => {
      const [rows] = await connection.execute('SELECT code, name FROM buyers LIMIT 5');
      
      rows.forEach(buyer => {
        expect(buyer.code).toBeDefined();
        expect(buyer.code).toMatch(/^[A-Z0-9]+$/);
        expect(buyer.name).toBeDefined();
        expect(buyer.name.length).toBeGreaterThan(0);
      });
    });    test('production lines should have valid codes and names', async () => {
      const [rows] = await connection.execute('SELECT lineCode, lineName FROM `lines` LIMIT 5');
      
      rows.forEach(line => {
        expect(line.lineCode).toBeDefined();
        expect(line.lineCode).toMatch(/^LINE-\d+$/);
        expect(line.lineName).toBeDefined();
        expect(line.lineName.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Orders Data Validation', () => {
    test('should have orders data available', async () => {
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM orders');
      const count = rows[0].count;
      expect(count).toBeGreaterThan(0);
    });

    test('orders should have valid status values', async () => {
      const [rows] = await connection.execute('SELECT DISTINCT status FROM orders WHERE status IS NOT NULL');
      const statuses = rows.map(row => row.status);
      
      const validStatuses = [
        'confirmed', 'provisional', 'speculative', 'transit',
        'unscheduled', 'scheduled', 'in_progress', 'completed',
        'cancelled', 'on_hold', 'pending'
      ];
      
      statuses.forEach(status => {
        expect(validStatuses).toContain(status);
      });
    });

    test('orders should have proper buyer references', async () => {
      const [orders] = await connection.execute('SELECT buyer FROM orders WHERE buyer IS NOT NULL LIMIT 10');
      const [buyers] = await connection.execute('SELECT name FROM buyers');
      
      const buyerNames = buyers.map(b => b.name);
      const orderBuyers = orders.map(o => o.buyer);
      
      const validReferences = orderBuyers.filter(buyer => buyerNames.includes(buyer));
      expect(validReferences.length).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity', () => {
    test('orders should have unique references', async () => {
      const [rows] = await connection.execute(`
        SELECT order_reference, COUNT(*) as count 
        FROM orders 
        GROUP BY order_reference 
        HAVING COUNT(*) > 1
      `);
      
      expect(rows).toHaveLength(0);
    });

    test('buyers should have unique codes', async () => {
      const [rows] = await connection.execute(`
        SELECT code, COUNT(*) as count 
        FROM buyers 
        GROUP BY code 
        HAVING COUNT(*) > 1
      `);
      
      expect(rows).toHaveLength(0);
    });
  });
});
