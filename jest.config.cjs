/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@types$': '<rootDir>/src/types/index.ts',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@appConstants$': '<rootDir>/src/appConstants/index.ts',
    '^@appConstants/(.*)$': '<rootDir>/src/appConstants/$1',
    '^@utils/logger$': '<rootDir>/src/logger/logger.ts',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@helpers/(.*)$': '<rootDir>/src/helpers/$1',
    '^@controllers/(.*)$': '<rootDir>/src/controllers/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@dto/(.*)$': '<rootDir>/src/dto/$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: false, tsconfig: 'tsconfig.json' }],
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts', '!src/**/*.d.ts'],
  coverageDirectory: 'coverage',
  verbose: false,
  setupFiles: ['<rootDir>/test/setup.ts'],
};
