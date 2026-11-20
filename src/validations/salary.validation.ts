import { z } from 'zod';

export const componentRuleSchema = z.object({
  component_id: z.string().uuid({ message: 'component_id must be a valid UUID' }),
  calculation_type: z.enum(['FIXED', 'PERCENTAGE']),
  amount: z.number().min(0, { message: 'amount must be >= 0' }),
});

export const salaryCalculationSchema = z.object({
  employee_id: z.string().uuid({ message: 'employee_id must be a valid UUID' }),
  template_id: z.string().uuid({ message: 'template_id must be a valid UUID' }),
  total_ctc: z.number().positive({ message: 'total_ctc must be a positive number' }),
  fixed_ctc: z.boolean().default(true),
  variable_pay: z.number().min(0).default(0),
  components: z.array(componentRuleSchema).min(1, { message: 'at least one component is required' }),
});

export const salaryAssignmentSchema = salaryCalculationSchema.extend({
  effective_from: z.string().optional(),
});

export type SalaryCalculationBody = z.infer<typeof salaryCalculationSchema>;
export type SalaryAssignmentBody = z.infer<typeof salaryAssignmentSchema>;
