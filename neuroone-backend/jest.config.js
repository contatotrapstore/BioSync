/**
 * Jest Configuration - NeuroOne Backend
 * Testes unitários e de integração
 */

export default {
  // Ambiente de testes
  testEnvironment: 'node',

  // Transformação ES modules
  transform: {
    '^.+\\.jsx?$': ['babel-jest', { configFile: './babel.config.cjs' }],
  },

  // Extensões de arquivo suportadas
  moduleFileExtensions: ['js', 'json'],

  // Padrão de arquivos de teste
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js',
  ],

  // Coverage
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**',
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Setup
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Timeout
  testTimeout: 10000,

  // Verbose
  verbose: true,

  // Clear mocks
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
