import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'email must be a valid email address' }),
  password: z.string().min(1, { message: 'password is required' }),
});

export type LoginBody = z.infer<typeof loginSchema>;
