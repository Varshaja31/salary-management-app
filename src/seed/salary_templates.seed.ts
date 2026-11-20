import { SalaryTemplates } from '../models/salary_templates.model.js';

const SALARY_TEMPLATE_SEEDS = [
  {
    name: 'India Standard',
    description: 'Default salary structure for India with standard components (Basic, HRA, allowances, PF, ESI, PT, Gratuity)',
    country: 'IND',
    currency: 'INR',
  },
  {
    name: 'USA Standard',
    description: 'Default salary structure for USA with standard components (401k, Social Security, Medicare, Health Insurance)',
    country: 'USA',
    currency: 'USD',
  },
  {
    name: 'Dubai Standard',
    description: 'Default salary structure for Dubai with standard components (Basic, Housing, Transport, End of Service Gratuity)',
    country: 'DUBAI',
    currency: 'AED',
  },
] as const;

export async function seedSalaryTemplates(): Promise<void> {
  if (await SalaryTemplates.count() > 0) return;
  await SalaryTemplates.bulkCreate(SALARY_TEMPLATE_SEEDS as never);
}
