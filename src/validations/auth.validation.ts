import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'email must be a valid email address' }),
  password: z.string().min(1, { message: 'password is required' }),
});

export const refreshSchema = z.object({
  token: z.string().min(1, { message: 'token is required' }),
});

export type LoginBody = z.infer<typeof loginSchema>;
export type RefreshBody = z.infer<typeof refreshSchema>;
