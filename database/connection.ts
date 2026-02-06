// Database connection utilities for Cloudflare D1
// Provides type-safe database access for Cloudflare Workers

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
  };
  error?: string;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

// Environment bindings for Cloudflare Workers
export interface Env {
  DB: D1Database;
  // Add other environment bindings as needed
}

/**
 * Execute a database query with error handling
 */
export async function executeQuery<T = unknown>(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<D1Result<T>> {
  try {
    const stmt = db.prepare(query);
    const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
    return await boundStmt.all<T>();
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(
      `Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Execute a single row query
 */
export async function executeQueryFirst<T = unknown>(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<T | null> {
  try {
    const stmt = db.prepare(query);
    const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
    return await boundStmt.first<T>();
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(
      `Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Execute a write operation (INSERT, UPDATE, DELETE)
 */
export async function executeWrite(
  db: D1Database,
  query: string,
  params: unknown[] = []
): Promise<D1Result> {
  try {
    const stmt = db.prepare(query);
    const boundStmt = params.length > 0 ? stmt.bind(...params) : stmt;
    return await boundStmt.run();
  } catch (error) {
    console.error('Database write error:', error);
    throw new Error(
      `Database write failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Execute multiple queries in a batch transaction
 */
export async function executeBatch<T = unknown>(
  db: D1Database,
  queries: Array<{ query: string; params?: unknown[] }>
): Promise<D1Result<T>[]> {
  try {
    const statements = queries.map(({ query, params = [] }) => {
      const stmt = db.prepare(query);
      return params.length > 0 ? stmt.bind(...params) : stmt;
    });
    return await db.batch<T>(statements);
  } catch (error) {
    console.error('Database batch error:', error);
    throw new Error(
      `Database batch failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Check if database is accessible
 */
export async function checkDatabaseConnection(
  db: D1Database
): Promise<boolean> {
  try {
    const result = await executeQueryFirst<{ result: number }>(
      db,
      'SELECT 1 as result'
    );
    return result?.result === 1;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

/**
 * Get current schema version
 */
export async function getSchemaVersion(db: D1Database): Promise<number> {
  try {
    const result = await executeQueryFirst<{ version: number }>(
      db,
      'SELECT MAX(version) as version FROM schema_migrations'
    );
    return result?.version ?? 0;
  } catch (error) {
    console.error('Failed to get schema version:', error);
    return 0;
  }
}
