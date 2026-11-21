import { QueryTypes } from 'sequelize';

import { sequelize } from '../../config/sequelize.js';
import { retrieveRelevantSchema } from './vector-store.js';
import { generateSql, summarizeResult } from './sql-generator.js';
import { validateSql } from './sql-validator.js';
import { guardQuestion } from './question-guard.js';
import { ChatError } from './chat.errors.js';

export interface ChatResult {
  question: string;
  sql: string;
  rows: unknown[];
  answer: string;
}

// Pipeline: question -> input guardrail -> retrieve schema docs ->
// generate SQL -> validate -> execute -> summarize.
export async function askQuestion(question: string): Promise<ChatResult> {
  guardQuestion(question);

  const docs = await retrieveRelevantSchema(question);
  if (docs.length === 0) {
    throw new ChatError(500, 'No schema context available for retrieval');
  }
  const context = docs.map((d) => d.pageContent).join('\n\n');

  const sql = await generateSql(question, context);
  const safeSql = await validateSql(sql);

  // Final hard gate before execution — even if validation regresses,
  // nothing but SELECT reaches the database.
  if (!/^\s*select\b/i.test(safeSql)) {
    throw new ChatError(400, 'Only SELECT queries may be executed');
  }

  let rows: unknown[];
  try {
    rows = await sequelize.query(safeSql, { type: QueryTypes.SELECT });
  } catch {
    throw new ChatError(400, 'Generated SQL failed to execute');
  }

  const answer = await summarizeResult(question, safeSql, rows);

  return { question, sql: safeSql, rows, answer };
}
