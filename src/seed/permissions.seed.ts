import { Permissions } from '../models/permissions.model.js';

const PERMISSION_SEEDS = [
  { name: 'USER_VIEW', description: 'View users' },
  { name: 'USER_CREATE', description: 'Create users' },
  { name: 'USER_UPDATE', description: 'Update users' },
  { name: 'USER_DELETE', description: 'Delete users' },
  { name: 'ROLE_ASSIGN', description: 'Assign roles to users' },
  { name: 'EMPLOYEE_VIEW', description: 'View employees' },
  { name: 'EMPLOYEE_CREATE', description: 'Create employees' },
  { name: 'EMPLOYEE_UPDATE', description: 'Update employees' },
  { name: 'EMPLOYEE_DELETE', description: 'Delete employees' },
  { name: 'SALARY_TEMPLATE_VIEW', description: 'View salary templates' },
  { name: 'SALARY_TEMPLATE_CREATE', description: 'Create salary templates' },
  { name: 'SALARY_TEMPLATE_UPDATE', description: 'Update salary templates' },
  { name: 'SALARY_TEMPLATE_DELETE', description: 'Delete salary templates' },
  { name: 'SALARY_VIEW', description: 'View salaries' },
  { name: 'SALARY_CREATE', description: 'Create salaries' },
  { name: 'SALARY_UPDATE', description: 'Update salaries' },
  { name: 'SALARY_DELETE', description: 'Delete salaries' },
  { name: 'DASHBOARD_VIEW', description: 'View dashboard' },
  { name: 'EMPLOYEE_REPORT_VIEW', description: 'View employee reports' },
] as const;

export async function seedPermissions(): Promise<void> {
  if (await Permissions.count() > 0) return;
  await Permissions.bulkCreate(PERMISSION_SEEDS as never);
}
