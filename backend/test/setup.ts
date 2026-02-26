// Global test setup
// This file runs before all tests

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.AI_SERVICE_URL = 'http://localhost:8001';

// Increase timeout for integration tests
jest.setTimeout(10000);
