const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Path to Next.js app to load next.config.js and .env
  dir: './',
});

// Custom Jest configurations
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^bson$': require.resolve('bson'),
    // Map path aliases matching tsconfig.json
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@public/(.*)$': '<rootDir>/public/$1',
    '^Components/(.*)$': '<rootDir>/src/components/$1',
    '^Consts/(.*)$': '<rootDir>/src/consts/$1',
    '^Services/(.*)$': '<rootDir>/src/services/$1',
    '^Hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};

module.exports = createJestConfig(customJestConfig);
