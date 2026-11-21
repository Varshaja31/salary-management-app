import { z } from 'zod';

export const chatQuestionSchema = z.object({
  question: z.string().min(1, { message: 'question is required' }).max(2000),
});

export type ChatQuestionBody = z.infer<typeof chatQuestionSchema>;
