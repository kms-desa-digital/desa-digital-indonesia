const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.tsx'],
  collectCoverageFrom: [
    'src/app/auth/login/page.tsx',
    'src/app/auth/register/page.tsx',
    'src/app/innovation/add/page.tsx',
    'src/app/admin/verification/[category]/page.tsx',
    'src/app/village/klaimInovasi/manual/page.tsx',
    'src/app/village/klaimInovasi/page.tsx',
    'src/app/innovator/profile/[id]/page.tsx',
    'src/app/village/profile/[id]/page.tsx',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^Components/(.*)$': '<rootDir>/src/components/$1',
    '^Consts/(.*)$': '<rootDir>/src/consts/$1',
    '^Services/(.*)$': '<rootDir>/src/services/$1',
    '^Hooks/(.*)$': '<rootDir>/src/hooks/$1'
  },
};

module.exports = createJestConfig(customJestConfig);
