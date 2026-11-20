import { SalaryTemplates } from '../models/salary_templates.model.js';

const SALARY_TEMPLATE_SEEDS = [
  {
    name: 'India Standard',
    description: 'Default salary structure for India with standard components (Basic, HRA, allowances, PF, PT)',
    country: 'IND',
    currency: 'INR',
  },
  {
    name: 'USA Standard',
    description: 'Default salary structure for USA with standard components (401k, Social Security, Medicare)',
    country: 'USA',
    currency: 'USD',
  },
] as const;

export async function seedSalaryTemplates(): Promise<void> {
  if (await SalaryTemplates.count() > 0) return;
  await SalaryTemplates.bulkCreate(SALARY_TEMPLATE_SEEDS as never);
}
