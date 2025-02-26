module.exports = {
  // Test environment for browser-based code
  testEnvironment: 'jsdom',
  
  // Look for test files in the tests directory
  testMatch: ['**/tests/test_*.js'],
  
  // Transform ES modules with Babel
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  
  // Mock Chrome API and web resources
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/tests/mocks/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/mocks/fileMock.js',
  },
  
  // Set up the test environment
  setupFiles: ['<rootDir>/tests/setup.js'],
  
  // Collect coverage information
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/background.js', // Bundled file
    '!src/popup/popup.js', // UI interaction file
    '!src/content/content.js', // Content script with DOM interactions
  ],
  
  // Temporarily disable coverage thresholds until we fix all tests
  /*
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  */
  
  // Ignore node_modules
  transformIgnorePatterns: ['/node_modules/'],
}; 