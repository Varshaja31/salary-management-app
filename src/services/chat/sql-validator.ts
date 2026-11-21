import { Parser } from 'node-sql-parser';

import { extractSchemaDocuments } from './schema-extractor.js';
import { ChatError } from './chat.errors.js';

const parser = new Parser();

const MAX_LIMIT = 100;

// Auth internals are not chat-queryable — password hashes and permission
// grants must never reach an LLM prompt or chat response.
const DENIED_TABLES = new Set(['users', 'user_permissions']);
const DENIED_COLUMNS = /\b(password|token|secret|api_?key)\b/i;

interface AstNode {
  type: string;
  from?: Array<{ table?: string }> | null;
  limit?: { value?: Array<{ value?: number }> } | null;
  [key: string]: unknown;
}

let allowedTables: Set<string> | null = null;

async function getAllowedTables(): Promise<Set<string>> {
  if (!allowedTables) {
    const docs = await extractSchemaDocuments();
    allowedTables = new Set(docs.map((d) => d.tableName));
  }
  return allowedTables;
}

export function resetTableCache(): void {
  allowedTables = null;
}

function collectTables(node: AstNode, tables: Set<string>): void {
  if (!node || typeof node !== 'object') return;

  if (Array.isArray(node.from)) {
    for (const f of node.from) {
      if (f?.table) tables.add(f.table);
    }
  }
  for (const value of Object.values(node)) {
    if (value && typeof value === 'object') {
      collectTables(value as AstNode, tables);
    }
  }
}

function enforceLimit(sql: string): string {
  // Ensure the query has a LIMIT; append one if missing.
  if (!/limit\s+\d+/i.test(sql)) {
    return `${sql.replace(/;\s*$/, '')} LIMIT ${MAX_LIMIT}`;
  }
  return sql;
}

// Validates that SQL is a single safe SELECT on known tables.
// Returns the (possibly limit-annotated) SQL string.
export async function validateSql(sql: string): Promise<string> {
  const trimmed = sql.trim().replace(/;\s*$/, '');

  if (!trimmed) {
    throw new ChatError(400, 'Generated SQL is empty');
  }

  let ast: AstNode;
  try {
    const parsed = parser.astify(trimmed, { database: 'Sqlite' });
    if (Array.isArray(parsed)) {
      throw new ChatError(400, 'Multiple SQL statements are not allowed');
    }
    ast = parsed as unknown as AstNode;
  } catch (err) {
    if (err instanceof ChatError) throw err;
    throw new ChatError(400, 'Generated SQL could not be parsed');
  }

  if (ast.type !== 'select') {
    throw new ChatError(400, 'Only SELECT queries are allowed');
  }

  const tables = new Set<string>();
  collectTables(ast, tables);

  const allowed = await getAllowedTables();
  for (const table of tables) {
    if (DENIED_TABLES.has(table)) {
      throw new ChatError(400, `Table "${table}" is not queryable via chat`);
    }
    if (!allowed.has(table)) {
      throw new ChatError(400, `Query references unknown table: ${table}`);
    }
  }

  if (DENIED_COLUMNS.test(trimmed)) {
    throw new ChatError(400, 'Query touches a restricted column');
  }

  // Hard block on dangerous keywords even inside comments/strings
  const dangerous = /\b(insert|update|delete|drop|alter|attach|detach|pragma|vacuum|reindex|truncate|replace|create)\b/i;
  if (dangerous.test(trimmed)) {
    throw new ChatError(400, 'Query contains a disallowed operation');
  }

  return enforceLimit(trimmed);
}
