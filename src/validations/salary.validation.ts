import { z } from 'zod';

export const componentRuleSchema = z.object({
  component_id: z.string().uuid({ message: 'component_id must be a valid UUID' }),
  calculation_type: z.enum(['FIXED', 'PERCENTAGE']),
  amount: z.number().min(0, { message: 'amount must be >= 0' }),
});

export const salaryAssignmentSchema = z.object({
  employee_id: z.string().uuid({ message: 'employee_id must be a valid UUID' }),
  template_id: z.string().uuid({ message: 'template_id must be a valid UUID' }),
  total_ctc: z.number().positive({ message: 'total_ctc must be a positive number' }),
  fixed_ctc: z.boolean().default(true),
  variable_pay: z.number().min(0).default(0),
  effective_from: z.string().optional(),
  components: z.array(componentRuleSchema).min(1, { message: 'at least one component is required' }),
});

export const salaryUpdateSchema = z.object({
  total_ctc: z.number().positive().optional(),
  fixed_ctc: z.boolean().optional(),
  variable_pay: z.number().min(0).optional(),
  effective_from: z.string().optional(),
  is_active: z.boolean().optional(),
  components: z.array(componentRuleSchema).optional(),
});

export type SalaryAssignmentBody = z.infer<typeof salaryAssignmentSchema>;
export type SalaryUpdateBody = z.infer<typeof salaryUpdateSchema>;
