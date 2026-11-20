import { SalaryComponents } from '../models/salary_components.model.js';
import { SalaryTemplateComponents } from '../models/salary_template_components.model.js';
import { SalaryTemplates } from '../models/salary_templates.model.js';

/**
 * Maps each country to the salary component codes that should be linked
 * to its template. This only defines *which* components are available in
 * each template — the company-specific calculation values live in the
 * `salary_structures` table, which HR creates from a template.
 */
const TEMPLATE_COMPONENT_MAP: Record<string, string[]> = {
  IND: [
    'BASIC_SALARY',
    'HOUSING_ALLOWANCE',
    'CONVEYANCE_ALLOWANCE',
    'MEDICAL_ALLOWANCE',
    'SPECIAL_ALLOWANCE',
    'OTHER_ALLOWANCE',
    'EMPLOYER_PF',
    'EMPLOYER_ESI',
    'EMPLOYER_HEALTH_INSURANCE',
    'TERM_INSURANCE',
    'GRATUITY',
    'EMPLOYEE_PF',
    'EMPLOYEE_ESI',
    'PROFESSIONAL_TAX',
  ],
  USA: [
    'BASIC_SALARY',
    'HOUSING_ALLOWANCE',
    'EMPLOYER_401K',
    'EMPLOYER_SOCIAL_SECURITY',
    'EMPLOYER_MEDICARE',
    'EMPLOYER_HEALTH_INSURANCE',
    'TERM_INSURANCE',
  ],
  DUBAI: [
    'BASIC_SALARY',
    'HOUSING_ALLOWANCE',
    'FUEL_ALLOWANCE',
    'DRIVER_ALLOWANCE',
    'MEDICAL_ALLOWANCE',
    'SPECIAL_ALLOWANCE',
    'OTHER_ALLOWANCE',
    'EMPLOYER_HEALTH_INSURANCE',
    'TERM_INSURANCE',
    'GRATUITY',
  ],
};

export async function seedSalaryTemplateComponents(): Promise<void> {
  if (await SalaryTemplateComponents.count() > 0) return;

  const templates = await SalaryTemplates.findAll();
  if (templates.length === 0) {
    throw new Error('No salary templates found; run salary template seeder first');
  }

  const components = await SalaryComponents.findAll();
  if (components.length === 0) {
    throw new Error('No salary components found; run salary components seeder first');
  }

  const componentByCode = new Map(components.map((c) => [c.code, c]));

  const rows: Array<{ template_id: string; component_id: string }> = [];

  for (const template of templates) {
    const codes = TEMPLATE_COMPONENT_MAP[template.country];
    if (!codes) continue;

    for (const code of codes) {
      const component = componentByCode.get(code);
      if (!component) {
        throw new Error(`Salary component '${code}' not found; run salary components seeder first`);
      }
      rows.push({
        template_id: template.id,
        component_id: component.id,
      });
    }
  }

  await SalaryTemplateComponents.bulkCreate(rows);
}
