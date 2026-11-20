import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

/**
 * Generic validation middleware. Validates req.body against the given Zod
 * schema and returns 400 with the first error message if validation fails.
 * If validation passes, the parsed body is assigned back to req.body.
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstError = result.error.issues[0];
      res.status(400).json({ error: firstError?.message ?? 'Invalid request body' });
      return;
    }
    req.body = result.data;
    next();
  };
}
