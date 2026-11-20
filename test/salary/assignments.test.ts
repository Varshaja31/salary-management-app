import jwt from 'jsonwebtoken';
import request from 'supertest';

import { createApp } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { sequelize } from '../../src/config/sequelize.js';
import { initModels } from '../../src/models/index.js';
import { Roles } from '../../src/models/roles.model.js';
import { Permissions } from '../../src/models/permissions.model.js';
import { User } from '../../src/models/user.model.js';
import { UserPermissions } from '../../src/models/user_permissions.model.js';
import { Employees } from '../../src/models/employees.js';
import { SalaryTemplates } from '../../src/models/salary_templates.model.js';
import { SalaryComponents } from '../../src/models/salary_components.model.js';
import { SalaryTemplateComponents } from '../../src/models/salary_template_components.model.js';
import { EmployeeSalaryAssignments } from '../../src/models/employee_salary_assignments.js';
import { EmployeeSalaryComponents } from '../../src/models/employee_salary_components.js';

const app = createApp();

const TEST_EMAIL = 'testuser@salary.com';
const TEST_PASSWORD = 'TestPassword@123';
const TOTAL_CTC = 1614920;

async function syncDb(): Promise<void> {
  await sequelize.sync({ force: true });
}

async function seedRole(): Promise<Roles> {
  return Roles.create({ name: 'SUPERADMIN', description: 'Full access' });
}

async function seedPermissions(): Promise<Permissions[]> {
  return Permissions.bulkCreate([
    { name: 'SALARY_CREATE', description: 'Create salary' },
    { name: 'SALARY_VIEW', description: 'View salary' },
    { name: 'SALARY_UPDATE', description: 'Update salary' },
  ]);
}

async function createUser(email: string, password: string, roleId: string): Promise<User> {
  return User.scope('withPassword').create({
    name: 'Test User',
    email,
    password,
    role_id: roleId,
    is_active: true,
  });
}

async function grantPermissions(userId: string, perms: Permissions[]): Promise<void> {
  await UserPermissions.bulkCreate(
    perms.map((p) => ({ user_id: userId, permission_id: p.id })),
  );
}

function makeToken(userId: string, email: string): string {
  return jwt.sign({ id: userId, email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

async function seedEmployee(id: string, email: string, firstName: string) {
  return Employees.create({
    employee_id: id,
    first_name: firstName,
    last_name: 'Doe',
    email,
    date_of_birth: new Date('1990-05-15'),
    phone_number: '+1234567890',
    joined_date: new Date('2024-01-15'),
    department: 'ENGINEER',
    country: 'INDIA',
    is_active: true,
  });
}

async function seedTemplateWithComponents() {
  const template = await SalaryTemplates.create({
    name: 'India Standard',
    description: 'India salary template',
    country: 'IND',
    currency: 'INR',
    is_active: true,
  });

  const basic = await SalaryComponents.create({ code: 'BASIC_SALARY', description: 'Basic Salary', calculation_type: 'EARNING', is_active: true });
  const hra = await SalaryComponents.create({ code: 'HOUSING_ALLOWANCE', description: 'Housing Allowance', calculation_type: 'ALLOWANCE', is_active: true });
  const other = await SalaryComponents.create({ code: 'OTHER_ALLOWANCE', description: 'Other Allowance', calculation_type: 'ALLOWANCE', is_active: true });
  const pf = await SalaryComponents.create({ code: 'EMPLOYER_PF', description: 'Employer PF', calculation_type: 'EMPLOYER_CONTRIBUTION', is_active: true });
  const gratuity = await SalaryComponents.create({ code: 'GRATUITY', description: 'Gratuity', calculation_type: 'EMPLOYER_CONTRIBUTION', is_active: true });
  const term = await SalaryComponents.create({ code: 'TERM_INSURANCE', description: 'Term Insurance', calculation_type: 'EMPLOYER_CONTRIBUTION', is_active: true });

  await SalaryTemplateComponents.bulkCreate([
    { template_id: template.id, component_id: basic.id },
    { template_id: template.id, component_id: hra.id },
    { template_id: template.id, component_id: other.id },
    { template_id: template.id, component_id: pf.id },
    { template_id: template.id, component_id: gratuity.id },
    { template_id: template.id, component_id: term.id },
  ]);

  return { template, basic, hra, other, pf, gratuity, term };
}

async function seedAssignment(employeeId: string, templateId: string, components: Array<{ id: string; calculation_type: string; amount: number }>, totalCtc: number) {
  const assignment = await EmployeeSalaryAssignments.create({
    employee_id: employeeId,
    salary_structure_id: templateId,
    total_ctc: totalCtc,
    fixed_ctc: true,
    variable_pay: 0,
    effective_from: new Date(),
    is_active: true,
    version: 1,
  });

  const rows = components.map((c) => ({
    salary_assignment_id: assignment.id,
    component_id: c.id,
    amount: c.calculation_type === 'PERCENTAGE' ? Math.round((c.amount / 100) * totalCtc * 100) / 100 : c.amount,
  }));
  await EmployeeSalaryComponents.bulkCreate(rows);

  return assignment;
}

describe('Salary Assignment APIs', () => {
  let role: Roles;
  let permissions: Permissions[];
  let emp1: Employees;
  let emp2: Employees;
  let tpl: { template: SalaryTemplates; basic: SalaryComponents; hra: SalaryComponents; other: SalaryComponents; pf: SalaryComponents; gratuity: SalaryComponents; term: SalaryComponents };

  beforeAll(async () => {
    await initModels();
    await syncDb();
    role = await seedRole();
    permissions = await seedPermissions();
    emp1 = await seedEmployee('EMP001', 'john@salary.com', 'John');
    emp2 = await seedEmployee('EMP002', 'jane@salary.com', 'Jane');
    tpl = await seedTemplateWithComponents();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await UserPermissions.destroy({ where: {} });
    await User.destroy({ where: {} });
    await EmployeeSalaryComponents.destroy({ where: {} });
    await EmployeeSalaryAssignments.destroy({ where: {} });
  });

  const getComponentRules = () => [
    { id: tpl.basic.id, calculation_type: 'PERCENTAGE' as const, amount: 47.87 },
    { id: tpl.hra.id, calculation_type: 'PERCENTAGE' as const, amount: 23.93 },
    { id: tpl.other.id, calculation_type: 'PERCENTAGE' as const, amount: 14.40 },
    { id: tpl.pf.id, calculation_type: 'PERCENTAGE' as const, amount: 1.34 },
    { id: tpl.gratuity.id, calculation_type: 'PERCENTAGE' as const, amount: 2.30 },
    { id: tpl.term.id, calculation_type: 'FIXED' as const, amount: 720 },
  ];

  describe('GET /v1/salaries', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/v1/salaries');
      expect(res.status).toBe(401);
    });

    it('returns 403 when user does not have SALARY_VIEW permission', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get('/v1/salaries')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('returns 200 with empty list when no assignments exist', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const viewPerm = permissions.find((p) => p.name === 'SALARY_VIEW')!;
      await grantPermissions(user.id, [viewPerm]);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get('/v1/salaries')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.total).toBe(0);
      expect(res.body.limit).toBe(10);
      expect(res.body.offset).toBe(0);
    });

    it('returns 200 with assignments and employee details', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const viewPerm = permissions.find((p) => p.name === 'SALARY_VIEW')!;
      await grantPermissions(user.id, [viewPerm]);
      const token = makeToken(user.id, user.email);

      await seedAssignment(emp1.id, tpl.template.id, getComponentRules(), TOTAL_CTC);
      await seedAssignment(emp2.id, tpl.template.id, getComponentRules(), TOTAL_CTC);

      const res = await request(app)
        .get('/v1/salaries')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(2);
      expect(res.body.limit).toBe(10);
      expect(res.body.offset).toBe(0);

      const first = res.body.data[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('employee_id');
      expect(first).toHaveProperty('employee');
      expect(first.employee).toHaveProperty('employee_id');
      expect(first.employee).toHaveProperty('first_name');
      expect(first.employee).toHaveProperty('email');
      expect(first).toHaveProperty('template');
      expect(first.template).toHaveProperty('name');
      expect(first.template).toHaveProperty('country');
      expect(first).toHaveProperty('total_ctc');
      expect(first).toHaveProperty('components');
      expect(Array.isArray(first.components)).toBe(true);
      expect(first.components).toHaveLength(6);
      expect(first.components[0]).toHaveProperty('code');
      expect(first.components[0]).toHaveProperty('amount');
    });

    it('respects limit and offset query params', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const viewPerm = permissions.find((p) => p.name === 'SALARY_VIEW')!;
      await grantPermissions(user.id, [viewPerm]);
      const token = makeToken(user.id, user.email);

      await seedAssignment(emp1.id, tpl.template.id, getComponentRules(), TOTAL_CTC);
      await seedAssignment(emp2.id, tpl.template.id, getComponentRules(), TOTAL_CTC);

      const res = await request(app)
        .get('/v1/salaries?limit=1&offset=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(2);
      expect(res.body.limit).toBe(1);
      expect(res.body.offset).toBe(1);
    });
  });

  describe('GET /v1/salaries/:id', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/v1/salaries/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(401);
    });

    it('returns 404 when assignment does not exist', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const viewPerm = permissions.find((p) => p.name === 'SALARY_VIEW')!;
      await grantPermissions(user.id, [viewPerm]);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get('/v1/salaries/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('returns 200 with assignment details and components', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const viewPerm = permissions.find((p) => p.name === 'SALARY_VIEW')!;
      await grantPermissions(user.id, [viewPerm]);
      const token = makeToken(user.id, user.email);

      const assignment = await seedAssignment(emp1.id, tpl.template.id, getComponentRules(), TOTAL_CTC);

      const res = await request(app)
        .get(`/v1/salaries/${assignment.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(assignment.id);
      expect(res.body.data.employee.employee_id).toBe('EMP001');
      expect(res.body.data.employee.first_name).toBe('John');
      expect(res.body.data.template.name).toBe('India Standard');
      expect(res.body.data.template.country).toBe('IND');
      expect(res.body.data.template.currency).toBe('INR');
      expect(res.body.data.components).toHaveLength(6);

      const codes = res.body.data.components.map((c: any) => c.code);
      expect(codes).toContain('BASIC_SALARY');
      expect(codes).toContain('HOUSING_ALLOWANCE');
      expect(codes).toContain('OTHER_ALLOWANCE');
      expect(codes).toContain('EMPLOYER_PF');
      expect(codes).toContain('GRATUITY');
      expect(codes).toContain('TERM_INSURANCE');
    });
  });

  describe('PUT /v1/salaries/:id', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).put('/v1/salaries/00000000-0000-0000-0000-000000000000').send({});
      expect(res.status).toBe(401);
    });

    it('returns 403 when user does not have SALARY_UPDATE permission', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .put('/v1/salaries/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ total_ctc: 2000000 });
      expect(res.status).toBe(403);
    });

    it('returns 404 when assignment does not exist', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const updatePerm = permissions.find((p) => p.name === 'SALARY_UPDATE')!;
      await grantPermissions(user.id, [updatePerm]);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .put('/v1/salaries/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ total_ctc: 2000000 });
      expect(res.status).toBe(404);
    });

    it('returns 200 with updated total_ctc', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const updatePerm = permissions.find((p) => p.name === 'SALARY_UPDATE')!;
      await grantPermissions(user.id, [updatePerm]);
      const token = makeToken(user.id, user.email);

      const assignment = await seedAssignment(emp1.id, tpl.template.id, getComponentRules(), TOTAL_CTC);
      const newCtc = 2000000;

      const res = await request(app)
        .put(`/v1/salaries/${assignment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ total_ctc: newCtc });

      expect(res.status).toBe(200);
      expect(res.body.data.total_ctc).toBe(newCtc);
    });

    it('returns 200 with updated components when new CTC provided', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const updatePerm = permissions.find((p) => p.name === 'SALARY_UPDATE')!;
      await grantPermissions(user.id, [updatePerm]);
      const token = makeToken(user.id, user.email);

      const assignment = await seedAssignment(emp1.id, tpl.template.id, getComponentRules(), TOTAL_CTC);
      const newCtc = 2000000;

      const res = await request(app)
        .put(`/v1/salaries/${assignment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          total_ctc: newCtc,
          components: getComponentRules().map((c) => ({
            component_id: c.id,
            calculation_type: c.calculation_type,
            amount: c.amount,
          })),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.total_ctc).toBe(newCtc);
      expect(res.body.data.components).toHaveLength(6);

      // Verify new calculations: BASIC 47.87% of 20,00,000 = 9,57,400
      const basic = res.body.data.components.find((c: any) => c.code === 'BASIC_SALARY');
      expect(Number(basic.amount)).toBe(957400);

      const term = res.body.data.components.find((c: any) => c.code === 'TERM_INSURANCE');
      expect(Number(term.amount)).toBe(720);
    });
  });
});
