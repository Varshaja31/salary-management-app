import { z } from 'zod';

export const employeeCreationSchema = z.object({
  employee_id: z.string().min(1, { message: 'Employee ID is required' }),
  first_name: z.string().min(1, { message: 'First name is required' }),
  last_name: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Email must be a valid email address' }),
  date_of_birth: z.string().min(1, { message: 'Date of birth is required' }),
  phone_number: z.string().min(1, { message: 'Phone number is required' }),
  joined_date: z.string().min(1, { message: 'Joined date is required' }),
  resigned_at: z.string().optional(),
  department: z.string().min(1, { message: 'Department is required' }),
  country: z.string().min(1, { message: 'Country is required' }),
  is_active: z.boolean().default(true),
});

export type EmployeeCreationBody = z.infer<typeof employeeCreationSchema>;

export const employeeUpdateSchema = z.object({
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  date_of_birth: z.string().optional(),
  phone_number: z.string().min(1).optional(),
  joined_date: z.string().optional(),
  resigned_at: z.string().optional().nullable(),
  department: z.enum(['ENGINEER', 'MANAGER', 'DIRECTOR', 'VP', 'CEO']).optional(),
  country: z.enum(['INDIA', 'USA', 'DUBAI', 'UK', 'CANADA']).optional(),
  is_active: z.boolean().optional(),
});

export type EmployeeUpdateBody = z.infer<typeof employeeUpdateSchema>;