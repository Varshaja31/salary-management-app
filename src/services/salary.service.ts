import { EmployeeSalaryAssignments } from '../models/employee_salary_assignments.js';
import { EmployeeSalaryComponents } from '../models/employee_salary_components.js';
import { Employees } from '../models/employees.js';
import { SalaryComponents } from '../models/salary_components.model.js';
import { SalaryTemplateComponents } from '../models/salary_template_components.model.js';
import { SalaryTemplates } from '../models/salary_templates.model.js';

export class SalaryError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export interface ComponentRule {
  component_id: string;
  calculation_type: 'FIXED' | 'PERCENTAGE';
  amount: number;
}

export interface CalculatedComponent {
  component_id: string;
  code: string;
  description: string;
  calculation_type: string;
  amount: number; // the rule (percentage or fixed value)
  calculated_amount: number; // the final computed amount
}

export interface CalculationResult {
  employee_id: string;
  template_id: string;
  total_ctc: number;
  fixed_ctc: boolean;
  variable_pay: number;
  components: CalculatedComponent[];
}

export interface AssignmentResult {
  assignment: EmployeeSalaryAssignments;
  components: CalculatedComponent[];
}

// Shared helper: validate employee + template, verify components belong to template
async function validateAndResolve(
  employeeId: string,
  templateId: string,
  componentRules: ComponentRule[],
): Promise<{ components: Map<string, SalaryComponents> }> {
  // 1. Verify employee exists
  const employee = await Employees.findOne({ where: { id: employeeId } });
  if (!employee) {
    throw new SalaryError(404, 'Employee not found');
  }

  // 2. Verify template exists
  const template = await SalaryTemplates.findOne({ where: { id: templateId } });
  if (!template) {
    throw new SalaryError(404, 'Salary template not found');
  }

  // 3. Verify components belong to this template
  const templateComponents = await SalaryTemplateComponents.findAll({
    where: { template_id: templateId },
  });
  const validComponentIds = new Set(templateComponents.map((tc) => tc.component_id));

  for (const rule of componentRules) {
    if (!validComponentIds.has(rule.component_id)) {
      throw new SalaryError(400, `Component ${rule.component_id} does not belong to template ${templateId}`);
    }
  }

  // 4. Fetch component details
  const components = await SalaryComponents.findAll({
    where: { id: componentRules.map((r) => r.component_id) },
  });
  const componentMap = new Map(components.map((c) => [c.id, c]));

  return { components: componentMap };
}

// Shared helper: compute amounts from rules + CTC
function computeAmounts(
  rules: ComponentRule[],
  componentMap: Map<string, SalaryComponents>,
  totalCtc: number,
): CalculatedComponent[] {
  return rules.map((rule) => {
    const component = componentMap.get(rule.component_id);
    if (!component) {
      throw new SalaryError(400, `Component ${rule.component_id} not found`);
    }

    let calculatedAmount: number;
    if (rule.calculation_type === 'PERCENTAGE') {
      calculatedAmount = (rule.amount / 100) * totalCtc;
    } else {
      calculatedAmount = rule.amount;
    }

    return {
      component_id: component.id,
      code: component.code,
      description: component.description,
      calculation_type: rule.calculation_type,
      amount: rule.amount,
      calculated_amount: Math.round(calculatedAmount * 100) / 100,
    };
  });
}

// API 1: Calculate only — no save
export async function calculateSalary(data: {
  employee_id: string;
  template_id: string;
  total_ctc: number;
  fixed_ctc: boolean;
  variable_pay: number;
  components: ComponentRule[];
}): Promise<CalculationResult> {
  const { components: componentMap } = await validateAndResolve(
    data.employee_id,
    data.template_id,
    data.components,
  );

  const calculated = computeAmounts(data.components, componentMap, data.total_ctc);

  return {
    employee_id: data.employee_id,
    template_id: data.template_id,
    total_ctc: data.total_ctc,
    fixed_ctc: data.fixed_ctc,
    variable_pay: data.variable_pay,
    components: calculated,
  };
}

// API 2: Assign — save assignment + calculated components
export async function assignSalary(data: {
  employee_id: string;
  template_id: string;
  total_ctc: number;
  fixed_ctc: boolean;
  variable_pay: number;
  effective_from?: string;
  components: ComponentRule[];
}): Promise<AssignmentResult> {
  const { components: componentMap } = await validateAndResolve(
    data.employee_id,
    data.template_id,
    data.components,
  );

  const calculated = computeAmounts(data.components, componentMap, data.total_ctc);

  // 1. Create the assignment
  const assignment = await EmployeeSalaryAssignments.create({
    employee_id: data.employee_id,
    salary_structure_id: data.template_id,
    total_ctc: data.total_ctc,
    fixed_ctc: data.fixed_ctc,
    variable_pay: data.variable_pay,
    effective_from: data.effective_from ? new Date(data.effective_from) : new Date(),
    is_active: true,
    version: 1,
  });

  // 2. Save calculated components
  await EmployeeSalaryComponents.bulkCreate(
    calculated.map((c) => ({
      salary_assignment_id: assignment.id,
      component_id: c.component_id,
      amount: c.calculated_amount,
    })),
  );

  return {
    assignment,
    components: calculated,
  };
}

export interface TemplateWithComponents {
  id: string;
  name: string;
  description: string;
  country: string;
  currency: string;
  is_active: boolean;
  components: Array<{
    id: string;
    code: string;
    description: string;
    calculation_type: string;
    is_active: boolean;
  }>;
}

export async function listTemplates(): Promise<SalaryTemplates[]> {
  return SalaryTemplates.findAll({ where: { is_active: true } });
}

export async function getTemplateWithComponents(templateId: string): Promise<TemplateWithComponents> {
  const template = await SalaryTemplates.findOne({ where: { id: templateId } });
  if (!template) {
    throw new SalaryError(404, 'Template not found');
  }

  const templateComponents = await SalaryTemplateComponents.findAll({
    where: { template_id: templateId },
  });

  const componentIds = templateComponents.map((tc) => tc.component_id);
  const components = await SalaryComponents.findAll({
    where: { id: componentIds },
  });

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    country: template.country,
    currency: template.currency,
    is_active: template.is_active,
    components: components.map((c) => ({
      id: c.id,
      code: c.code,
      description: c.description,
      calculation_type: c.calculation_type,
      is_active: c.is_active,
    })),
  };
}
