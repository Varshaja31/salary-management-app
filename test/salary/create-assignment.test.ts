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
  ]);
}

async function createUser(
  email: string,
  password: string,
  roleId: string,
): Promise<User> {
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

async function seedEmployee() {
  return Employees.create({
    employee_id: 'EMP001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@salary.com',
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
  const employerPf = await SalaryComponents.create({ code: 'EMPLOYER_PF', description: 'Employer PF', calculation_type: 'EMPLOYER_CONTRIBUTION', is_active: true });
  const gratuity = await SalaryComponents.create({ code: 'GRATUITY', description: 'Gratuity', calculation_type: 'EMPLOYER_CONTRIBUTION', is_active: true });
  const termInsurance = await SalaryComponents.create({ code: 'TERM_INSURANCE', description: 'Term Insurance', calculation_type: 'EMPLOYER_CONTRIBUTION', is_active: true });

  await SalaryTemplateComponents.bulkCreate([
    { template_id: template.id, component_id: basic.id },
    { template_id: template.id, component_id: hra.id },
    { template_id: template.id, component_id: other.id },
    { template_id: template.id, component_id: employerPf.id },
    { template_id: template.id, component_id: gratuity.id },
    { template_id: template.id, component_id: termInsurance.id },
  ]);

  return { template, basic, hra, other, employerPf, gratuity, termInsurance };
}

function buildPayload(employeeId: string, templateId: string, components: Array<{ id: string; calculation_type: 'FIXED' | 'PERCENTAGE'; amount: number }>) {
  return {
    employee_id: employeeId,
    template_id: templateId,
    total_ctc: TOTAL_CTC,
    fixed_ctc: true,
    variable_pay: 0,
    components: components.map((c) => ({
      component_id: c.id,
      calculation_type: c.calculation_type,
      amount: c.amount,
    })),
  };
}

describe('Salary APIs', () => {
  let role: Roles;
  let permissions: Permissions[];
  let employee: Employees;
  let tpl: { template: SalaryTemplates; basic: SalaryComponents; hra: SalaryComponents; other: SalaryComponents; employerPf: SalaryComponents; gratuity: SalaryComponents; termInsurance: SalaryComponents };

  beforeAll(async () => {
    await initModels();
    await syncDb();
    role = await seedRole();
    permissions = await seedPermissions();
    employee = await seedEmployee();
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

  // BASIC 47.87%, HRA 23.93%, OTHER 14.40%, EMPLOYER_PF 1.34%, GRATUITY 2.30%, TERM_INSURANCE FIXED 720
  const getComponentRules = () => [
    { id: tpl.basic.id, calculation_type: 'PERCENTAGE' as const, amount: 47.87 },
    { id: tpl.hra.id, calculation_type: 'PERCENTAGE' as const, amount: 23.93 },
    { id: tpl.other.id, calculation_type: 'PERCENTAGE' as const, amount: 14.40 },
    { id: tpl.employerPf.id, calculation_type: 'PERCENTAGE' as const, amount: 1.34 },
    { id: tpl.gratuity.id, calculation_type: 'PERCENTAGE' as const, amount: 2.30 },
    { id: tpl.termInsurance.id, calculation_type: 'FIXED' as const, amount: 720 },
  ];

  describe('POST /v1/salaries/calculate', () => {
    it('returns 400 when no data is provided', async () => {
      const res = await request(app).post('/v1/salaries/calculate').send({});
      expect(res.status).toBe(400);
    });

    it('returns 401 when no token is provided', async () => {
      const res = await request(app)
        .post('/v1/salaries/calculate')
        .send(buildPayload(employee.id, tpl.template.id, getComponentRules()));
      expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await request(app)
        .post('/v1/salaries/calculate')
        .set('Authorization', 'Bearer invalid-token')
        .send(buildPayload(employee.id, tpl.template.id, getComponentRules()));
      expect(res.status).toBe(401);
    });

    it('returns 403 when user does not have SALARY_VIEW permission', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .post('/v1/salaries/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send(buildPayload(employee.id, tpl.template.id, getComponentRules()));
      expect(res.status).toBe(403);
    });

    it('returns 404 when employee does not exist', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const viewPerm = permissions.find((p) => p.name === 'SALARY_VIEW')!;
      await grantPermissions(user.id, [viewPerm]);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .post('/v1/salaries/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send(buildPayload('00000000-0000-0000-0000-000000000000', tpl.template.id, getComponentRules()));
      expect(res.status).toBe(404);
    });

    it('returns 404 when template does not exist', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const viewPerm = permissions.find((p) => p.name === 'SALARY_VIEW')!;
      await grantPermissions(user.id, [viewPerm]);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .post('/v1/salaries/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send(buildPayload(employee.id, '00000000-0000-0000-0000-000000000000', getComponentRules()));
      expect(res.status).toBe(404);
    });

    it('returns 400 when component does not belong to template', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const viewPerm = permissions.find((p) => p.name === 'SALARY_VIEW')!;
      await grantPermissions(user.id, [viewPerm]);
      const token = makeToken(user.id, user.email);

      const rogue = await SalaryComponents.create({ code: 'SPECIAL_ALLOWANCE', description: 'Special', calculation_type: 'ALLOWANCE', is_active: true });

      const res = await request(app)
        .post('/v1/salaries/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send(buildPayload(employee.id, tpl.template.id, [
          ...getComponentRules(),
          { id: rogue.id, calculation_type: 'PERCENTAGE', amount: 10 },
        ]));
      expect(res.status).toBe(400);
    });

    it('returns 200 with calculated components and does not save', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const viewPerm = permissions.find((p) => p.name === 'SALARY_VIEW')!;
      await grantPermissions(user.id, [viewPerm]);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .post('/v1/salaries/calculate')
        .set('Authorization', `Bearer ${token}`)
        .send(buildPayload(employee.id, tpl.template.id, getComponentRules()));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('components');
      expect(Array.isArray(res.body.data.components)).toBe(true);
      expect(res.body.data.components).toHaveLength(6);

      // CTC = 16,14,920
      // BASIC: 47.87% → 7,73,062.20
      // HRA: 23.93% → 3,86,450.36
      // OTHER: 14.40% → 2,32,548.48
      // EMPLOYER_PF: 1.34% → 21,639.93
      // GRATUITY: 2.30% → 37,143.16
      // TERM_INSURANCE: FIXED 720

      const basicComp = res.body.data.components.find((c: any) => c.code === 'BASIC_SALARY');
      expect(basicComp).toBeDefined();
      expect(Number(basicComp.calculated_amount)).toBe(773062.20);

      const hraComp = res.body.data.components.find((c: any) => c.code === 'HOUSING_ALLOWANCE');
      expect(hraComp).toBeDefined();
      expect(Number(hraComp.calculated_amount)).toBe(386450.36);

      const otherComp = res.body.data.components.find((c: any) => c.code === 'OTHER_ALLOWANCE');
      expect(otherComp).toBeDefined();
      expect(Number(otherComp.calculated_amount)).toBe(232548.48);

      const pfComp = res.body.data.components.find((c: any) => c.code === 'EMPLOYER_PF');
      expect(pfComp).toBeDefined();
      expect(Number(pfComp.calculated_amount)).toBe(21639.93);

      const gratuityComp = res.body.data.components.find((c: any) => c.code === 'GRATUITY');
      expect(gratuityComp).toBeDefined();
      expect(Number(gratuityComp.calculated_amount)).toBe(37143.16);

      const termComp = res.body.data.components.find((c: any) => c.code === 'TERM_INSURANCE');
      expect(termComp).toBeDefined();
      expect(Number(termComp.calculated_amount)).toBe(720);

      // Verify nothing was saved
      expect(await EmployeeSalaryAssignments.count()).toBe(0);
      expect(await EmployeeSalaryComponents.count()).toBe(0);
    });
  });

  describe('POST /v1/salaries/assign', () => {
    it('returns 400 when no data is provided', async () => {
      const res = await request(app).post('/v1/salaries/assign').send({});
      expect(res.status).toBe(400);
    });

    it('returns 401 when no token is provided', async () => {
      const res = await request(app)
        .post('/v1/salaries/assign')
        .send(buildPayload(employee.id, tpl.template.id, getComponentRules()));
      expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await request(app)
        .post('/v1/salaries/assign')
        .set('Authorization', 'Bearer invalid-token')
        .send(buildPayload(employee.id, tpl.template.id, getComponentRules()));
      expect(res.status).toBe(401);
    });

    it('returns 403 when user does not have SALARY_CREATE permission', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .post('/v1/salaries/assign')
        .set('Authorization', `Bearer ${token}`)
        .send(buildPayload(employee.id, tpl.template.id, getComponentRules()));
      expect(res.status).toBe(403);
    });

    it('returns 404 when employee does not exist', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const createPerm = permissions.find((p) => p.name === 'SALARY_CREATE')!;
      await grantPermissions(user.id, [createPerm]);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .post('/v1/salaries/assign')
        .set('Authorization', `Bearer ${token}`)
        .send(buildPayload('00000000-0000-0000-0000-000000000000', tpl.template.id, getComponentRules()));
      expect(res.status).toBe(404);
    });

    it('returns 404 when template does not exist', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const createPerm = permissions.find((p) => p.name === 'SALARY_CREATE')!;
      await grantPermissions(user.id, [createPerm]);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .post('/v1/salaries/assign')
        .set('Authorization', `Bearer ${token}`)
        .send(buildPayload(employee.id, '00000000-0000-0000-0000-000000000000', getComponentRules()));
      expect(res.status).toBe(404);
    });

    it('returns 200 with saved assignment and calculated components', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const createPerm = permissions.find((p) => p.name === 'SALARY_CREATE')!;
      await grantPermissions(user.id, [createPerm]);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .post('/v1/salaries/assign')
        .set('Authorization', `Bearer ${token}`)
        .send(buildPayload(employee.id, tpl.template.id, getComponentRules()));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('assignment');
      expect(res.body.data).toHaveProperty('components');
      expect(Array.isArray(res.body.data.components)).toBe(true);
      expect(res.body.data.components).toHaveLength(6);

      // Verify BASIC calculation
      const basicComp = res.body.data.components.find((c: any) => c.code === 'BASIC_SALARY');
      expect(basicComp).toBeDefined();
      expect(Number(basicComp.calculated_amount)).toBe(773062.20);

      // Verify TERM_INSURANCE (fixed)
      const termComp = res.body.data.components.find((c: any) => c.code === 'TERM_INSURANCE');
      expect(termComp).toBeDefined();
      expect(Number(termComp.calculated_amount)).toBe(720);

      // Verify saved to DB
      expect(await EmployeeSalaryAssignments.count()).toBe(1);
      expect(await EmployeeSalaryComponents.count()).toBe(6);
    });
  });
});
