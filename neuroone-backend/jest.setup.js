/**
 * Jest Setup - Global test configuration
 */

// Mock de variáveis de ambiente
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-key';
process.env.PORT = '3001';
process.env.ALLOWED_ORIGINS = 'http://localhost:5173';
