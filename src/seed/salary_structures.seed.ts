import { SalaryComponents } from '../models/salary_components.model.js';
import { SalaryStructures } from '../models/salary_structures.model.js';
import { SalaryTemplates } from '../models/salary_templates.model.js';

/**
 * Seeds one sample salary structure so HR sees an example of how a
 * company-specific structure looks. HR can edit this or create new ones
 * from a template via the UI.
 *
 * This sample is based on the India template with a typical 40% basic
 * of CTC split.
 */
const SAMPLE_STRUCTURE_NAME = 'India Engineering Structure';
const SAMPLE_TEMPLATE_COUNTRY = 'IND';

const SAMPLE_COMPONENT_CALCULATIONS: Array<{
  code: string;
  calculation_type: 'FIXED' | 'PERCENTAGE';
  amount: number;
}> = [
  { code: 'BASIC_SALARY', calculation_type: 'PERCENTAGE', amount: 40 },
  { code: 'HOUSING_ALLOWANCE', calculation_type: 'PERCENTAGE', amount: 20 },
  { code: 'CONVEYANCE_ALLOWANCE', calculation_type: 'FIXED', amount: 1600 },
  { code: 'MEDICAL_ALLOWANCE', calculation_type: 'FIXED', amount: 1250 },
  { code: 'SPECIAL_ALLOWANCE', calculation_type: 'PERCENTAGE', amount: 10 },
  { code: 'EMPLOYER_PF', calculation_type: 'PERCENTAGE', amount: 12 },
  { code: 'EMPLOYER_ESI', calculation_type: 'PERCENTAGE', amount: 3.25 },
  { code: 'GRATUITY', calculation_type: 'PERCENTAGE', amount: 4.81 },
  { code: 'EMPLOYEE_PF', calculation_type: 'PERCENTAGE', amount: 12 },
  { code: 'EMPLOYEE_ESI', calculation_type: 'PERCENTAGE', amount: 0.75 },
  { code: 'PROFESSIONAL_TAX', calculation_type: 'FIXED', amount: 200 },
];

export async function seedSalaryStructures(): Promise<void> {
  if (await SalaryStructures.count() > 0) return;

  const template = await SalaryTemplates.findOne({
    where: { country: SAMPLE_TEMPLATE_COUNTRY },
  });
  if (!template) {
    throw new Error('No salary template found for sample structure; run salary template seeder first');
  }

  const components = await SalaryComponents.findAll();
  if (components.length === 0) {
    throw new Error('No salary components found; run salary components seeder first');
  }

  const componentByCode = new Map(components.map((c) => [c.code, c]));

  const rows: Array<{
    name: string;
    template_id: string;
    component_id: string;
    calculation_type: 'FIXED' | 'PERCENTAGE';
    amount: number;
  }> = [];

  for (const entry of SAMPLE_COMPONENT_CALCULATIONS) {
    const component = componentByCode.get(entry.code);
    if (!component) {
      throw new Error(`Salary component '${entry.code}' not found; run salary components seeder first`);
    }
    rows.push({
      name: SAMPLE_STRUCTURE_NAME,
      template_id: template.id,
      component_id: component.id,
      calculation_type: entry.calculation_type,
      amount: entry.amount,
    });
  }

  await SalaryStructures.bulkCreate(rows);
}
