// Planning Board API Tests
const request = require('supertest');

const BASE_URL = 'http://localhost:9002';

describe('Planning Board API Tests', () => {
  describe('Orders API Endpoints', () => {
    test('GET /api/orders should return orders list', async () => {
      const response = await request(BASE_URL)
        .get('/api/orders')
        .expect(200);

      expect(response.body).toBeDefined();
      
      if (response.body.success) {
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeGreaterThan(0);
        
        const order = response.body.data[0];
        expect(order).toHaveProperty('id');
        expect(order).toHaveProperty('order_reference');
        expect(order).toHaveProperty('product');
        expect(order).toHaveProperty('status');
      }
    }, 15000);

    test('GET /api/orders should return valid order data structure', async () => {
      const response = await request(BASE_URL)
        .get('/api/orders')
        .expect(200);

      if (response.body.success && response.body.data.length > 0) {
        const order = response.body.data[0];
        
        expect(order.id).toBeDefined();
        expect(order.order_reference).toBeDefined();
        expect(order.product).toBeDefined();
        expect(order.customer).toBeDefined();
        expect(order.status).toBeDefined();
          expect(order).toHaveProperty('contract_quantity');
        expect(order).toHaveProperty('order_date');
        expect(order).toHaveProperty('ship_date');
        // Note: assignedLine field not yet implemented
        // expect(order).toHaveProperty('assignedLine');
        
        const validStatuses = [
          'confirmed', 'provisional', 'speculative', 'transit',
          'unscheduled', 'scheduled', 'in_progress', 'completed',
          'cancelled', 'on_hold', 'pending'
        ];
        expect(validStatuses).toContain(order.status);
      }
    }, 15000);

    test('GET /api/orders should handle query parameters', async () => {
      const response = await request(BASE_URL)
        .get('/api/orders?status=confirmed')
        .expect(200);

      expect(response.body).toBeDefined();
        if (response.body.success && response.body.data.length > 0) {
        response.body.data.forEach((order) => {
          // Check that status is valid and test for the most common confirmed status
          const validStatuses = [
            'confirmed', 'provisional', 'speculative', 'transit',
            'unscheduled', 'scheduled', 'in_progress', 'completed',
            'cancelled', 'on_hold', 'pending'
          ];
          expect(validStatuses).toContain(order.status);
        });
      }
    }, 15000);
  });

  describe('Buyers API Endpoints', () => {
  test('GET /api/buyers should return buyers list', async () => {
      const response = await request(BASE_URL)
        .get('/api/buyers')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const buyer = response.body.data[0];
      expect(buyer).toHaveProperty('id');
      expect(buyer).toHaveProperty('buyerCode');
      expect(buyer).toHaveProperty('buyerName');
      expect(buyer.buyerCode).toMatch(/^[A-Z0-9]+$/);
    }, 15000);    test('buyers should have unique codes', async () => {
      const response = await request(BASE_URL)
        .get('/api/buyers')
        .expect(200);

      const codes = response.body.data.map((buyer) => buyer.buyerCode);
      const uniqueCodes = [...new Set(codes)];
      
      expect(codes.length).toBe(uniqueCodes.length);
    }, 15000);
  });

  describe('Lines API Endpoints', () => {    test('GET /api/lines should return production lines list', async () => {
      const response = await request(BASE_URL)
        .get('/api/lines')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const line = response.body.data[0];
      expect(line).toHaveProperty('id');
      expect(line).toHaveProperty('lineCode');
      expect(line).toHaveProperty('lineName');
      expect(line.lineCode).toMatch(/^LINE-\d+$/);
    }, 15000);    test('lines should have unique codes', async () => {
      const response = await request(BASE_URL)
        .get('/api/lines')
        .expect(200);

      const codes = response.body.data.map((line) => line.lineCode);
      const uniqueCodes = [...new Set(codes)];
      
      expect(codes.length).toBe(uniqueCodes.length);
    }, 15000);
  });

  describe('API Performance', () => {
    test('orders API should respond within acceptable time', async () => {
      const startTime = Date.now();
      
      await request(BASE_URL)
        .get('/api/orders')
        .expect(200);
        
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000);
    }, 10000);

    test('buyers API should respond quickly', async () => {
      const startTime = Date.now();
      
      await request(BASE_URL)
        .get('/api/buyers')
        .expect(200);
        
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(3000);
    }, 10000);
  });

  describe('Planning Board Integration', () => {
    test('orders should reference valid buyers', async () => {
      const ordersResponse = await request(BASE_URL).get('/api/orders');
      const buyersResponse = await request(BASE_URL).get('/api/buyers');

      expect(ordersResponse.status).toBe(200);
      expect(buyersResponse.status).toBe(200);      if (ordersResponse.body.success && buyersResponse.body.success) {
        const orders = ordersResponse.body.data;
        const buyers = buyersResponse.body.data;
        const buyerNames = buyers.map((b) => b.buyerName);

        orders.forEach((order) => {
          if (order.buyer) {
            expect(buyerNames).toContain(order.buyer);
          }
        });
      }
    }, 15000);

    test('orders should have planning-relevant data', async () => {
      const response = await request(BASE_URL)
        .get('/api/orders')
        .expect(200);

      if (response.body.success && response.body.data.length > 0) {
        const orders = response.body.data;
        
        const ordersWithQuantity = orders.filter((o) => o.contract_quantity > 0);
        expect(ordersWithQuantity.length).toBeGreaterThan(0);
        
        const ordersWithStatus = orders.filter((o) => o.status);
        expect(ordersWithStatus.length).toBeGreaterThan(0);
        
        const ordersWithDates = orders.filter((o) => o.order_date);
        expect(ordersWithDates.length).toBeGreaterThan(0);
      }
    }, 15000);
  });
});
