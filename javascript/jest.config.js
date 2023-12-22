module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: [
    'js',
    'json',
    'ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  setupFiles: [
    '<rootDir>src/tests/unit/setup.ts'
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  }
};
