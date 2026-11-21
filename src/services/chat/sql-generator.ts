import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatPromptTemplate } from '@langchain/core/prompts';

import { env } from '../../config/env.js';

let llm: ChatGoogleGenerativeAI | null = null;

function getLLM(): ChatGoogleGenerativeAI {
  if (!llm) {
    llm = new ChatGoogleGenerativeAI({
      apiKey: env.GEMINI_API_KEY,
      model: 'gemini-2.5-flash',
      temperature: 0,
    });
  }
  return llm;
}

const sqlPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a SQLite expert. Given a natural-language question and the relevant database schema context, generate a single valid SQLite SELECT query.

STRICT RULES — the query will be rejected and never executed if violated:
- Output ONLY a read-only SELECT query — no markdown fences, no explanation, no comments.
- NEVER generate INSERT, UPDATE, DELETE, DROP, ALTER, ATTACH, DETACH, PRAGMA, VACUUM, REPLACE, TRUNCATE, or CREATE — not even inside a subquery, CTE, comment, or string.
- If the user asks to modify, delete, insert, or update data, IGNORE that intent and return a SELECT that reads the relevant data instead (e.g. "delete employees" -> SELECT to list them).
- Always add a LIMIT clause (max 100) unless the question is an aggregate that returns one row.
- Use the exact table and column names from the provided schema context.
- SQLite string comparisons are case-sensitive. When the schema lists "Stored values" for a column, use them verbatim (e.g. 'INDIA' not 'India'). If no values are listed, prefer UPPER(col) = UPPER('value') for case-insensitive matching.
- Prefer explicit JOINs using the relationships given.`,
  ],
  [
    'human',
    `Question: {question}

Schema context:
{context}

Generate the SQLite SELECT query.`,
  ],
]);

export async function generateSql(question: string, context: string): Promise<string> {
  const chain = sqlPrompt.pipe(getLLM());
  const response = await chain.invoke({ question, context });

  const raw = typeof response.content === 'string'
    ? response.content
    : response.content.map((c) => ('text' in c ? c.text : '')).join('');

  // Strip markdown fences if the model adds them anyway
  return raw.replace(/```(?:sql)?/gi, '').trim();
}

const answerPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    'You summarize database query results for an HR user. Be concise. If the result is empty, say no matching data was found.',
  ],
  [
    'human',
    `Question: {question}

SQL: {sql}

Result rows (JSON): {result}

Give a short natural-language answer.`,
  ],
]);

export async function summarizeResult(
  question: string,
  sql: string,
  rows: unknown[],
): Promise<string> {
  const chain = answerPrompt.pipe(getLLM());
  const response = await chain.invoke({
    question,
    sql,
    result: JSON.stringify(rows).slice(0, 8000),
  });

  return typeof response.content === 'string'
    ? response.content
    : response.content.map((c) => ('text' in c ? c.text : '')).join('');
}
