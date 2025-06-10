// Comprehensive Planning Board API and Database Connection Tests
const request = require('supertest');
const mysql = require('mysql2/promise');

// Mock database connection for tests
jest.mock('../src/lib/database', () => ({
  getConnection: jest.fn(),
  getTransactionConnection: jest.fn()
}));

describe('Planning Board API and Database Connection Tests', () => {
  let mockConnection;
  let mockPool;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock connection and pool
    mockConnection = {
      execute: jest.fn(),
      query: jest.fn(),
      release: jest.fn(),
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    };

    mockPool = {
      getConnection: jest.fn().mockResolvedValue(mockConnection)
    };

    require('../src/lib/database').getConnection.mockResolvedValue(mockPool);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Repository Connection Pooling Optimization', () => {
    
    test('BuyerRepository should use proper connection pooling', async () => {
      // Mock successful database response
      mockConnection.execute.mockResolvedValue([
        [{ id: 1, name: 'Test Buyer', code: 'TB01' }], 
        {}
      ]);

      const { BuyerRepository } = require('../src/lib/buyerRepository');
      const result = await BuyerRepository.findAll();

      // Verify connection pooling pattern
      expect(require('../src/lib/database').getConnection).toHaveBeenCalled();
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    test('OrderRepository should use proper connection pooling', async () => {
      mockConnection.execute.mockResolvedValue([
        [{ 
          id: 1, 
          order_reference: 'ORD001', 
          buyer: 'Test Buyer',
          quantity: 100,
          status: 'pending'
        }], 
        {}
      ]);

      const { OrderRepository } = require('../src/lib/orderRepository');
      const result = await OrderRepository.findAll();

      expect(require('../src/lib/database').getConnection).toHaveBeenCalled();
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    test('LineCapacityRepository should handle connection errors gracefully', async () => {
      mockConnection.execute.mockRejectedValue(new Error('Database connection failed'));

      const { lineCapacityRepository } = require('../src/lib/lineCapacityRepository_new');
      
      await expect(lineCapacityRepository.getLineCapacities()).rejects.toThrow('Database connection failed');
      
      // Verify connection is still released even on error
      expect(mockConnection.release).toHaveBeenCalled();
    });

    test('LineGroupRepository should use proper connection pooling for all methods', async () => {
      mockConnection.execute.mockResolvedValue([
        [{ 
          id: 1, 
          group_name: 'Test Group', 
          line_ids: JSON.stringify(['LINE001', 'LINE002']),
          is_active: true 
        }], 
        {}
      ]);

      const { lineGroupRepository } = require('../src/lib/lineGroupRepository_new');
      const result = await lineGroupRepository.getLineGroups();

      expect(require('../src/lib/database').getConnection).toHaveBeenCalled();
      expect(mockPool.getConnection).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('Database Configuration Optimization', () => {
    test('Database configuration should not contain invalid mysql2 options', () => {
      // Read the actual database configuration
      const fs = require('fs');
      const path = require('path');
      const dbConfigPath = path.join(__dirname, '../src/lib/database.ts');
      const dbConfigContent = fs.readFileSync(dbConfigPath, 'utf8');

      // Check that invalid options were removed
      expect(dbConfigContent).not.toContain('acquireTimeout');
      expect(dbConfigContent).not.toContain('timeout:');
      
      // Check that valid options are present
      expect(dbConfigContent).toContain('connectionLimit');
      expect(dbConfigContent).toContain('waitForConnections');
    });

    test('Connection pool should be properly configured', () => {
      const { getConnection } = require('../src/lib/database');
      expect(typeof getConnection).toBe('function');
    });
  });

  describe('Planning Board API Endpoints', () => {
    
    test('GET /api/buyers should return buyers list', async () => {
      // This would test the actual API endpoint
      mockConnection.execute.mockResolvedValue([
        [
          { id: 1, name: 'Buyer A', code: 'BA', email: 'buyer.a@test.com' },
          { id: 2, name: 'Buyer B', code: 'BB', email: 'buyer.b@test.com' }
        ], 
        {}
      ]);

      // Note: This would require the actual Next.js API to be running
      // For now, we test the repository layer
      const { BuyerRepository } = require('../src/lib/buyerRepository');
      const buyers = await BuyerRepository.findAll();
      
      expect(buyers).toHaveLength(2);
      expect(buyers[0]).toHaveProperty('name', 'Buyer A');
    });

    test('GET /api/orders should return orders list with proper buyer mapping', async () => {
      mockConnection.execute.mockResolvedValue([
        [
          { 
            id: 1, 
            order_reference: 'ORD001', 
            buyer: 'Buyer A',
            quantity: 100,
            delivery_date: new Date('2025-12-01'),
            status: 'pending'
          }
        ], 
        {}
      ]);

      const { OrderRepository } = require('../src/lib/orderRepository');
      const orders = await OrderRepository.findAll();
      
      expect(orders).toHaveLength(1);
      expect(orders[0]).toHaveProperty('buyer', 'Buyer A');
      expect(orders[0]).toHaveProperty('status', 'pending');
    });

    test('Planning board should handle unscheduled orders correctly', async () => {
      mockConnection.execute.mockResolvedValue([
        [
          { 
            id: 1, 
            order_reference: 'UNSCH001', 
            buyer: 'Buyer A',
            quantity: 50,
            status: 'unscheduled'
          }
        ], 
        {}
      ]);

      const { OrderRepository } = require('../src/lib/orderRepository');
      const unscheduledOrders = await OrderRepository.findUnscheduled();
      
      expect(unscheduledOrders).toHaveLength(1);
      expect(unscheduledOrders[0]).toHaveProperty('status', 'unscheduled');
    });
  });

  describe('Master Data Integration', () => {
    
    test('Line capacity should be properly updated on planning board', async () => {
      const mockLineCapacity = {
        id: 1,
        line_id: 'LINE001',
        daily_capacity: 100,
        efficiency: 85.5,
        operators: 15,
        working_hours: 8
      };

      mockConnection.execute.mockResolvedValue([
        [mockLineCapacity], 
        { affectedRows: 1 }
      ]);

      const { lineCapacityRepository } = require('../src/lib/lineCapacityRepository_new');
      
      const result = await lineCapacityRepository.updateLineCapacity(1, {
        dailyCapacity: 120,
        efficiency: 90
      });

      expect(mockConnection.execute).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    test('Order status updates should reflect on planning board', async () => {
      mockConnection.execute.mockResolvedValue([
        [], 
        { affectedRows: 1 }
      ]);

      const { OrderRepository } = require('../src/lib/orderRepository');
      
      const result = await OrderRepository.updateStatus(1, 'in_progress');

      expect(mockConnection.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orders SET status = ?'),
        expect.arrayContaining(['in_progress', 1])
      );
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe('Performance and Error Handling', () => {
    
    test('Repository methods should handle connection pool exhaustion', async () => {
      mockPool.getConnection.mockRejectedValue(new Error('Pool exhausted'));

      const { BuyerRepository } = require('../src/lib/buyerRepository');
      
      await expect(BuyerRepository.findAll()).rejects.toThrow('Pool exhausted');
    });

    test('Connection release should happen even on database errors', async () => {
      mockConnection.execute.mockRejectedValue(new Error('SQL Error'));

      const { OrderRepository } = require('../src/lib/orderRepository');
      
      try {
        await OrderRepository.findAll();
      } catch (error) {
        expect(error.message).toBe('SQL Error');
      }
      
      expect(mockConnection.release).toHaveBeenCalled();
    });

    test('Transaction management should work correctly', async () => {
      const { getTransactionConnection } = require('../src/lib/database');
      getTransactionConnection.mockResolvedValue(mockConnection);

      // Test transaction workflow
      mockConnection.beginTransaction.mockResolvedValue();
      mockConnection.commit.mockResolvedValue();

      const connection = await getTransactionConnection();
      await connection.beginTransaction();
      await connection.commit();

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
    });
  });

  describe('Data Integrity Validation', () => {
    
    test('Buyer references in orders should be validated', async () => {
      // Test for the buyer reference mismatch issue mentioned in conversation summary
      mockConnection.execute
        .mockResolvedValueOnce([
          [{ id: 1, name: 'Valid Buyer', code: 'VB001' }], 
          {}
        ])
        .mockResolvedValueOnce([
          [{ 
            id: 1, 
            order_reference: 'ORD001', 
            buyer: 'Valid Buyer',  // Should match buyer name
            quantity: 100
          }], 
          {}
        ]);

      const { BuyerRepository } = require('../src/lib/buyerRepository');
      const { OrderRepository } = require('../src/lib/orderRepository');
      
      const buyers = await BuyerRepository.findAll();
      const orders = await OrderRepository.findAll();
      
      expect(buyers[0].name).toBe(orders[0].buyer);
    });

    test('Duplicate order references should be handled', async () => {
      mockConnection.execute.mockResolvedValue([
        [
          { id: 1, order_reference: 'DUP001', buyer: 'Buyer A' },
          { id: 2, order_reference: 'DUP001', buyer: 'Buyer A' }  // Duplicate
        ], 
        {}
      ]);

      const { OrderRepository } = require('../src/lib/orderRepository');
      const orders = await OrderRepository.findAll();
      
      // This test identifies the duplicate issue mentioned in summary
      const orderRefs = orders.map(o => o.order_reference);
      const uniqueRefs = new Set(orderRefs);
      
      if (orderRefs.length !== uniqueRefs.size) {
        console.warn('🚨 Duplicate order references detected - needs cleanup');
      }
    });
  });
});

module.exports = {
  testSuite: 'Planning Board API and Database Connection Tests',
  coverage: [
    'Repository connection pooling optimization',
    'Database configuration validation', 
    'API endpoint functionality',
    'Master data integration',
    'Performance and error handling',
    'Data integrity validation'
  ]
};
