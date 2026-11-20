// Runs before any test file imports. dotenv does not override existing
// process.env values, so setting these here ensures the test suite uses an
// in-memory SQLite database and a fixed JWT secret regardless of .env.
process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.DB_LOGGING = 'false';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';
