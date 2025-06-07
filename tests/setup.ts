// Test setup configuration
require('dotenv').config();

// Global test timeout
jest.setTimeout(30000);

// Mock console methods for cleaner test output
const originalConsole = console;

beforeAll(() => {
  if (process.env.NODE_ENV === 'test') {
    global.console = {
      ...console,
      log: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: originalConsole.error,
    };
  }
});

afterAll(() => {
  if (process.env.NODE_ENV === 'test') {
    global.console = originalConsole;
  }
});

afterAll(() => {
  global.console = originalConsole;
});

// Basic setup validation test
describe('Test Setup', () => {
  test('should load environment variables', () => {
    expect(process.env.NODE_ENV).toBeDefined();
    expect(jest.setTimeout).toBeDefined();
  });
});
