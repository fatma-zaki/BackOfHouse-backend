import type { Config } from 'jest';

/** Unit tests: pure logic, no database. Integration and e2e use test/jest-integration.json. */
const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  roots: ['<rootDir>/src'],
  testRegex: '.*\.spec\.ts$',
  transform: { '^.+\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.ts', '!src/generated/**', '!src/main.ts', '!src/worker.ts', '!src/**/*.module.ts'],
  coverageDirectory: './coverage',
};

export default config;
