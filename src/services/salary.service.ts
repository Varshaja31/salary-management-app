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

// Assign — save assignment + calculated components
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

export interface AssignmentWithDetails {
  id: string;
  employee_id: string;
  employee: {
    employee_id: string;
    first_name: string;
    last_name: string;
    email: string;
    department: string;
    country: string;
  };
  template: {
    id: string;
    name: string;
    country: string;
    currency: string;
  };
  total_ctc: number;
  fixed_ctc: boolean;
  variable_pay: number;
  effective_from: Date;
  is_active: boolean;
  version: number;
  components: Array<{
    component_id: string;
    code: string;
    description: string;
    amount: number;
  }>;
}

export async function listAssignments(options?: { limit?: number; offset?: number }) {
  const limit = options?.limit ?? 10;
  const offset = options?.offset ?? 0;

  const { rows, count } = await EmployeeSalaryAssignments.findAndCountAll({
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  // Fetch all related data
  const employeeIds = rows.map((a) => a.employee_id);
  const employees = await Employees.findAll({ where: { id: employeeIds } });
  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  const templateIds = rows.map((a) => a.salary_structure_id);
  const templates = await SalaryTemplates.findAll({ where: { id: templateIds } });
  const templateMap = new Map(templates.map((t) => [t.id, t]));

  const assignmentIds = rows.map((a) => a.id);
  const allComponents = await EmployeeSalaryComponents.findAll({
    where: { salary_assignment_id: assignmentIds },
  });
  const componentDetails = await SalaryComponents.findAll({
    where: { id: allComponents.map((c) => c.component_id) },
  });
  const componentDetailMap = new Map(componentDetails.map((c) => [c.id, c]));

  const componentsByAssignment = new Map<string, Array<{ component_id: string; code: string; description: string; amount: number }>>();
  for (const ec of allComponents) {
    const detail = componentDetailMap.get(ec.component_id);
    const entry = {
      component_id: ec.component_id,
      code: detail?.code ?? 'UNKNOWN',
      description: detail?.description ?? '',
      amount: ec.amount,
    };
    if (!componentsByAssignment.has(ec.salary_assignment_id)) {
      componentsByAssignment.set(ec.salary_assignment_id, []);
    }
    componentsByAssignment.get(ec.salary_assignment_id)!.push(entry);
  }

  const data: AssignmentWithDetails[] = rows.map((a) => {
    const emp = employeeMap.get(a.employee_id);
    const tpl = templateMap.get(a.salary_structure_id);
    return {
      id: a.id,
      employee_id: a.employee_id,
      employee: {
        employee_id: emp?.employee_id ?? '',
        first_name: emp?.first_name ?? '',
        last_name: emp?.last_name ?? '',
        email: emp?.email ?? '',
        department: emp?.department ?? '',
        country: emp?.country ?? '',
      },
      template: {
        id: tpl?.id ?? '',
        name: tpl?.name ?? '',
        country: tpl?.country ?? '',
        currency: tpl?.currency ?? '',
      },
      total_ctc: a.total_ctc,
      fixed_ctc: a.fixed_ctc,
      variable_pay: a.variable_pay,
      effective_from: a.effective_from,
      is_active: a.is_active,
      version: a.version,
      components: componentsByAssignment.get(a.id) ?? [],
    };
  });

  return { data, total: count, limit, offset };
}

export async function getAssignmentById(id: string): Promise<AssignmentWithDetails> {
  const assignment = await EmployeeSalaryAssignments.findOne({ where: { id } });
  if (!assignment) {
    throw new SalaryError(404, 'Salary assignment not found');
  }

  const employee = await Employees.findOne({ where: { id: assignment.employee_id } });
  const template = await SalaryTemplates.findOne({ where: { id: assignment.salary_structure_id } });

  const components = await EmployeeSalaryComponents.findAll({
    where: { salary_assignment_id: assignment.id },
  });
  const componentDetails = await SalaryComponents.findAll({
    where: { id: components.map((c) => c.component_id) },
  });
  const detailMap = new Map(componentDetails.map((c) => [c.id, c]));

  return {
    id: assignment.id,
    employee_id: assignment.employee_id,
    employee: {
      employee_id: employee?.employee_id ?? '',
      first_name: employee?.first_name ?? '',
      last_name: employee?.last_name ?? '',
      email: employee?.email ?? '',
      department: employee?.department ?? '',
      country: employee?.country ?? '',
    },
    template: {
      id: template?.id ?? '',
      name: template?.name ?? '',
      country: template?.country ?? '',
      currency: template?.currency ?? '',
    },
    total_ctc: assignment.total_ctc,
    fixed_ctc: assignment.fixed_ctc,
    variable_pay: assignment.variable_pay,
    effective_from: assignment.effective_from,
    is_active: assignment.is_active,
    version: assignment.version,
    components: components.map((ec) => {
      const detail = detailMap.get(ec.component_id);
      return {
        component_id: ec.component_id,
        code: detail?.code ?? 'UNKNOWN',
        description: detail?.description ?? '',
        amount: ec.amount,
      };
    }),
  };
}

export async function updateAssignment(
  id: string,
  data: {
    total_ctc?: number;
    fixed_ctc?: boolean;
    variable_pay?: number;
    effective_from?: string;
    is_active?: boolean;
    components?: ComponentRule[];
  },
): Promise<AssignmentWithDetails> {
  const assignment = await EmployeeSalaryAssignments.findOne({ where: { id } });
  if (!assignment) {
    throw new SalaryError(404, 'Salary assignment not found');
  }

  // Update basic fields
  const updates: Partial<{
    total_ctc: number;
    fixed_ctc: boolean;
    variable_pay: number;
    effective_from: Date;
    is_active: boolean;
  }> = {};

  if (data.total_ctc !== undefined) updates.total_ctc = data.total_ctc;
  if (data.fixed_ctc !== undefined) updates.fixed_ctc = data.fixed_ctc;
  if (data.variable_pay !== undefined) updates.variable_pay = data.variable_pay;
  if (data.effective_from !== undefined) updates.effective_from = new Date(data.effective_from);
  if (data.is_active !== undefined) updates.is_active = data.is_active;

  await assignment.update(updates as never);

  // If components provided, recalculate and replace
  if (data.components && data.components.length > 0) {
    const templateId = assignment.salary_structure_id;
    const totalCtc = data.total_ctc ?? assignment.total_ctc;

    // Validate components belong to the template
    const templateComponents = await SalaryTemplateComponents.findAll({
      where: { template_id: templateId },
    });
    const validIds = new Set(templateComponents.map((tc) => tc.component_id));

    for (const rule of data.components) {
      if (!validIds.has(rule.component_id)) {
        throw new SalaryError(400, `Component ${rule.component_id} does not belong to template ${templateId}`);
      }
    }

    const componentDetails = await SalaryComponents.findAll({
      where: { id: data.components.map((r) => r.component_id) },
    });
    const compMap = new Map(componentDetails.map((c) => [c.id, c]));
    const calculated = computeAmounts(data.components, compMap, totalCtc);

    // Delete old components and create new ones
    await EmployeeSalaryComponents.destroy({ where: { salary_assignment_id: id } });
    await EmployeeSalaryComponents.bulkCreate(
      calculated.map((c) => ({
        salary_assignment_id: id,
        component_id: c.component_id,
        amount: c.calculated_amount,
      })),
    );
  }

  return getAssignmentById(id);
}
