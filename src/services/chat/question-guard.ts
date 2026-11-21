import { ChatError } from './chat.errors.js';

// Cheap input-side guardrail: rejects obvious prompt-injection attempts and
// raw mutation SQL embedded in the question BEFORE we spend an LLM call.
// The AST validator remains the real enforcement layer — this just fails fast.
const INJECTION_PATTERNS: RegExp[] = [
  /\bignore\b[\w\s]{0,25}\b(instructions?|rules?|prompts?)/i,
  /\bforget\b[\w\s]{0,25}\b(instructions?|rules?)/i,
  /\bdisregard\b[\w\s]{0,25}\b(instructions?|rules?|prompts?)/i,
  /system\s+prompt/i,
  /you\s+are\s+now\b/i,
  /\b(insert\s+into|delete\s+from|drop\s+table|alter\s+table|truncate\s+table|update\s+\S+\s+set)\b/i,
];

export function guardQuestion(question: string): void {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(question)) {
      throw new ChatError(400, 'This question cannot be answered');
    }
  }
}
