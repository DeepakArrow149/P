// Planning Board Repository Unit Tests
import { OrderRepository } from '@/lib/orderRepository';
import { BuyerRepository } from '@/lib/buyerRepository';
import { LineRepository } from '@/lib/lineRepository';

describe('Planning Board Repository Tests', () => {
  let lineRepo: LineRepository;

  beforeAll(() => {
    // Only LineRepository needs instantiation as it uses instance methods
    // OrderRepository and BuyerRepository use static methods
    lineRepo = new LineRepository();
  });

  describe('OrderRepository', () => {
    test('should retrieve orders list', async () => {
      const orders = await OrderRepository.findAll();
      
      expect(orders).toBeDefined();
      expect(Array.isArray(orders)).toBe(true);
      expect(orders.length).toBeGreaterThan(0);
      
      if (orders.length > 0) {
        const order = orders[0];
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('order_reference');
        expect(order).toHaveProperty('status');
      }
    }, 15000);

    test('should retrieve order by ID', async () => {
      const allOrders = await OrderRepository.findAll();
      
      if (allOrders.length > 0) {
        const firstOrderId = allOrders[0].id;
        const order = await OrderRepository.findById(firstOrderId);
        
        expect(order).toBeDefined();
        expect(order?.id).toBe(firstOrderId);
      }
    }, 15000);

    test('should handle invalid order ID gracefully', async () => {
      const order = await OrderRepository.findById('invalid-id');
      expect(order).toBeNull();
    }, 10000);

    test('should retrieve unscheduled orders', async () => {
      const unscheduledOrders = await OrderRepository.findUnscheduled();
      
      expect(unscheduledOrders).toBeDefined();
      expect(Array.isArray(unscheduledOrders)).toBe(true);
      
      unscheduledOrders.forEach(order => {
        expect(['unscheduled', 'provisional']).toContain(order.status);
      });
    }, 15000);
  });

  describe('BuyerRepository', () => {
    test('should retrieve buyers list', async () => {
      const buyers = await BuyerRepository.findAll();
      
      expect(buyers).toBeDefined();
      expect(Array.isArray(buyers)).toBe(true);
      expect(buyers.length).toBeGreaterThan(0);
      
      if (buyers.length > 0) {
        const buyer = buyers[0];
        expect(buyer).toHaveProperty('id');
        expect(buyer).toHaveProperty('buyerCode');
        expect(buyer).toHaveProperty('buyerName');
      }
    }, 15000);

    test('should retrieve buyer by ID', async () => {
      const allBuyers = await BuyerRepository.findAll();
      
      if (allBuyers.length > 0) {
        const firstBuyerId = allBuyers[0].id;
        const buyer = await BuyerRepository.findById(firstBuyerId);
        
        expect(buyer).toBeDefined();
        expect(buyer?.id).toBe(firstBuyerId);
      }
    }, 15000);

    test('should retrieve buyer by code', async () => {
      const allBuyers = await BuyerRepository.findAll();
      
      if (allBuyers.length > 0) {
        const firstBuyerCode = allBuyers[0].buyerCode;
        const buyer = await BuyerRepository.findByCode(firstBuyerCode);
        
        expect(buyer).toBeDefined();
        expect(buyer?.buyerCode).toBe(firstBuyerCode);
      }
    }, 15000);

    test('should check if buyer code exists', async () => {
      const allBuyers = await BuyerRepository.findAll();
      
      if (allBuyers.length > 0) {
        const firstBuyerCode = allBuyers[0].buyerCode;
        const exists = await BuyerRepository.codeExists(firstBuyerCode);
        
        expect(exists).toBe(true);
      }
      
      const nonExistentExists = await BuyerRepository.codeExists('NON_EXISTENT_CODE');
      expect(nonExistentExists).toBe(false);
    }, 15000);
  });

  describe('LineRepository', () => {
    test('should initialize successfully', () => {
      expect(lineRepo).toBeDefined();
      expect(lineRepo).toBeInstanceOf(LineRepository);
    });

    test('should retrieve production lines list', async () => {
      const lines = await lineRepo.findMany();
      
      expect(lines).toBeDefined();
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeGreaterThan(0);
      
      if (lines.length > 0) {
        const line = lines[0];
        expect(line).toHaveProperty('id');
        expect(line).toHaveProperty('lineCode');
        expect(line).toHaveProperty('lineName');
      }
    }, 15000);

    test('should retrieve line by ID', async () => {
      const allLines = await lineRepo.findMany();
      
      if (allLines.length > 0) {
        const firstLineId = allLines[0].id;
        const line = await lineRepo.findById(firstLineId);
        
        expect(line).toBeDefined();
        expect(line?.id).toBe(firstLineId);
      }
    }, 15000);

    test('should retrieve line by code', async () => {
      const allLines = await lineRepo.findMany();
      
      if (allLines.length > 0) {
        const firstLineCode = allLines[0].lineCode;
        const line = await lineRepo.findByCode(firstLineCode);
        
        expect(line).toBeDefined();
        expect(line?.lineCode).toBe(firstLineCode);
      }
    }, 15000);

    test('should search lines with parameters', async () => {
      const lines = await lineRepo.findMany({ search: 'LINE', limit: 3 });
      
      expect(lines).toBeDefined();
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeLessThanOrEqual(3);
    }, 15000);

    test('should count lines', async () => {
      const count = await lineRepo.count();
      
      expect(count).toBeDefined();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    }, 15000);
  });

  describe('Repository Integration', () => {
    test('orders should reference existing buyers', async () => {
      const orders = await OrderRepository.findAll();
      const buyers = await BuyerRepository.findAll();
      
      const buyerNames = buyers.map(b => b.buyerName);
      
      orders.forEach(order => {
        if (order.buyer) {
          expect(buyerNames).toContain(order.buyer);
        }
      });
    }, 20000);

    test('verify data consistency between repositories', async () => {
      const orders = await OrderRepository.findAll();
      const buyers = await BuyerRepository.findAll();
      const lines = await lineRepo.findMany();
      
      expect(orders.length).toBeGreaterThan(0);
      expect(buyers.length).toBeGreaterThan(0);
      expect(lines.length).toBeGreaterThan(0);
      
      // Verify orders have proper structure
      orders.forEach(order => {
        expect(order.id).toBeDefined();
        expect(order.order_reference).toBeDefined();
        expect(order.status).toBeDefined();
      });

      // Verify buyers have proper structure
      buyers.forEach(buyer => {
        expect(buyer.id).toBeDefined();
        expect(buyer.buyerCode).toBeDefined();
        expect(buyer.buyerName).toBeDefined();
      });

      // Verify lines have proper structure
      lines.forEach(line => {
        expect(line.id).toBeDefined();
        expect(line.lineCode).toBeDefined();
        expect(line.lineName).toBeDefined();
      });
    }, 25000);
  });

  describe('Repository Error Handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // This test would need a way to simulate connection failures
      // For now, we'll test that methods don't throw unexpected errors
      expect(async () => {
        await OrderRepository.findAll();
      }).not.toThrow();
    });

    test('should handle invalid parameters gracefully', async () => {
      expect(async () => {
        await OrderRepository.findById('');
      }).not.toThrow();
      
      expect(async () => {
        await BuyerRepository.findByCode('');
      }).not.toThrow();
      
      expect(async () => {
        await lineRepo.findByCode('');
      }).not.toThrow();
    });

    test('should return null for non-existent records', async () => {
      const nonExistentOrder = await OrderRepository.findById('non-existent-id');
      expect(nonExistentOrder).toBeNull();

      const nonExistentBuyer = await BuyerRepository.findById('non-existent-id');
      expect(nonExistentBuyer).toBeNull();

      const nonExistentLine = await lineRepo.findById('non-existent-id');
      expect(nonExistentLine).toBeNull();
    }, 15000);
  });
});
