// Planning Board Functionality Integration Tests
import request from 'supertest';
import mysql from 'mysql2/promise';

const BASE_URL = 'http://localhost:9002';

describe('Planning Board Functionality Integration Tests', () => {
  let connection: mysql.Connection;

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

  describe('Order Management Functionality', () => {
    test('should display orders in planning board view', async () => {
      const response = await request(BASE_URL)
        .get('/api/orders')
        .expect(200);

      expect(response.body).toBeDefined();
      
      if (response.body.success) {
        const orders = response.body.data;
        
        // Verify planning board essential data
        orders.forEach((order: any) => {
          expect(order.id).toBeDefined();
          expect(order.order_reference).toBeDefined();
          expect(order.status).toBeDefined();
          
          // Planning board specific validations
          if (order.contract_quantity) {
            expect(order.contract_quantity).toBeGreaterThan(0);
          }
          
          if (order.order_date) {
            expect(new Date(order.order_date)).toBeInstanceOf(Date);
          }
        });
      }
    }, 15000);

    test('should filter orders by planning status', async () => {
      const statuses = ['confirmed', 'provisional', 'in_progress'];
      
      for (const status of statuses) {
        const response = await request(BASE_URL)
          .get(`/api/orders?status=${status}`)
          .expect(200);

        if (response.body.success && response.body.data.length > 0) {
          response.body.data.forEach((order: any) => {
            expect(order.status).toBe(status);
          });
        }
      }
    }, 30000);    test('should handle order assignment to production lines', async () => {
      // Get available lines
      const linesResponse = await request(BASE_URL)
        .get('/api/lines')
        .expect(200);      expect(linesResponse.body).toHaveProperty('success', true);
      expect(linesResponse.body).toHaveProperty('data');
      expect(linesResponse.body.data.length).toBeGreaterThan(0);
      
      // Verify that some orders can be assigned to lines
      const ordersResponse = await request(BASE_URL)
        .get('/api/orders')
        .expect(200);

      if (ordersResponse.body.success) {
        const ordersWithLines = ordersResponse.body.data.filter((o: any) => o.assignedLine);
        const availableLineCodes = linesResponse.body.data.map((l: any) => l.lineCode);
        
        ordersWithLines.forEach((order: any) => {
          expect(availableLineCodes).toContain(order.assignedLine);
        });
      }
    }, 15000);
  });

  describe('Master Data Integration', () => {
    test('should properly integrate buyer master data with orders', async () => {
      const [ordersResponse, buyersResponse] = await Promise.all([
        request(BASE_URL).get('/api/orders'),
        request(BASE_URL).get('/api/buyers')
      ]);

      expect(ordersResponse.status).toBe(200);
      expect(buyersResponse.status).toBe(200);      if (ordersResponse.body.success && buyersResponse.body.success) {
        const orders = ordersResponse.body.data;
        const buyers = buyersResponse.body.data;
        
        // Verify buyer references are valid
        const buyerNames = buyers.map((b: any) => b.buyerName);
        
        let validReferences = 0;
        orders.forEach((order: any) => {
          if (order.buyer && buyerNames.includes(order.buyer)) {
            validReferences++;
          }
        });
        
        expect(validReferences).toBeGreaterThan(0);
      }
    }, 15000);

    test('should properly integrate line master data with orders', async () => {
      const [ordersResponse, linesResponse] = await Promise.all([
        request(BASE_URL).get('/api/orders'),
        request(BASE_URL).get('/api/lines')
      ]);

      expect(ordersResponse.status).toBe(200);
      expect(linesResponse.status).toBe(200);

      if (ordersResponse.body.success) {
        const orders = ordersResponse.body.data;
        const lines = linesResponse.body;
        
        // Verify line references are valid
        const lineCodes = lines.map((l: any) => l.lineCode);
        
        orders.forEach((order: any) => {
          if (order.assignedLine) {
            expect(lineCodes).toContain(order.assignedLine);
          }
        });
      }
    }, 15000);
  });

  describe('Planning Board Business Logic', () => {
    test('should validate order quantities for planning', async () => {
      const [rows] = await connection.execute(`
        SELECT id, order_reference, contract_quantity 
        FROM orders 
        WHERE contract_quantity IS NOT NULL AND contract_quantity > 0
        LIMIT 10
      `);

      const orders = rows as any[];
      expect(orders.length).toBeGreaterThan(0);
      
      orders.forEach(order => {
        expect(order.contract_quantity).toBeGreaterThan(0);
        expect(typeof order.contract_quantity).toBe('number');
      });
    });

    test('should validate order dates for scheduling', async () => {
      const [rows] = await connection.execute(`
        SELECT id, order_reference, order_date, ship_date 
        FROM orders 
        WHERE order_date IS NOT NULL
        LIMIT 10
      `);

      const orders = rows as any[];
      expect(orders.length).toBeGreaterThan(0);
      
      orders.forEach(order => {
        expect(order.order_date).toBeDefined();
        expect(new Date(order.order_date)).toBeInstanceOf(Date);
        
        if (order.ship_date) {
          const orderDate = new Date(order.order_date);
          const shipDate = new Date(order.ship_date);
          expect(shipDate.getTime()).toBeGreaterThanOrEqual(orderDate.getTime());
        }
      });
    });

    test('should support order status workflow', async () => {
      const [rows] = await connection.execute(`
        SELECT status, COUNT(*) as count 
        FROM orders 
        WHERE status IS NOT NULL
        GROUP BY status
        ORDER BY count DESC
      `);

      const statusCounts = rows as any[];
      expect(statusCounts.length).toBeGreaterThan(0);
      
      // Verify that common planning statuses exist
      const statuses = statusCounts.map(s => s.status);
      const planningStatuses = ['confirmed', 'provisional', 'in_progress'];
      
      const hasPlanning = planningStatuses.some(status => statuses.includes(status));
      expect(hasPlanning).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple concurrent API requests', async () => {
      const promises = [
        request(BASE_URL).get('/api/orders'),
        request(BASE_URL).get('/api/buyers'),
        request(BASE_URL).get('/api/lines'),
        request(BASE_URL).get('/api/orders?status=confirmed'),
        request(BASE_URL).get('/api/orders?status=provisional')
      ];

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    }, 20000);

    test('should perform complex queries efficiently', async () => {
      const startTime = Date.now();
      
      const [rows] = await connection.execute(`
        SELECT o.id, o.order_reference, o.product, o.buyer, o.assignedLine, o.status,
               o.contract_quantity, o.order_date, o.ship_date
        FROM orders o
        WHERE o.status IN ('confirmed', 'provisional', 'in_progress')
        AND o.contract_quantity > 0
        ORDER BY o.order_date DESC
        LIMIT 50
      `);
      
      const endTime = Date.now();
      
      expect(rows).toBeDefined();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Data Consistency', () => {
    test('should maintain referential integrity', async () => {
      // Check that all buyer references in orders exist in buyers table
      const [invalidBuyers] = await connection.execute(`
        SELECT DISTINCT o.buyer 
        FROM orders o 
        LEFT JOIN buyers b ON o.buyer = b.name 
        WHERE o.buyer IS NOT NULL 
        AND b.name IS NULL
      `);

      // Should have no orphaned buyer references
      expect((invalidBuyers as any[]).length).toBe(0);
    });    test('should maintain line assignment consistency', async () => {
      // Check that all line assignments in orders exist in lines table
      const [invalidLines] = await connection.execute(`
        SELECT DISTINCT o.assignedLine 
        FROM orders o 
        LEFT JOIN \`lines\` l ON o.assignedLine = l.lineCode 
        WHERE o.assignedLine IS NOT NULL 
        AND l.lineCode IS NULL
      `);

      // Should have no orphaned line references
      expect((invalidLines as any[]).length).toBe(0);
    });
  });
});
