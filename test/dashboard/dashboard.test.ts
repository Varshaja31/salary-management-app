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
import { EmployeeSalaryAssignments } from '../../src/models/employee_salary_assignments.js';

const app = createApp();

const TEST_EMAIL = 'testuser@salary.com';
const TEST_PASSWORD = 'TestPassword@123';

async function syncDb(): Promise<void> {
  await sequelize.sync({ force: true });
}

async function seedRole(): Promise<Roles> {
  return Roles.create({ name: 'SUPERADMIN', description: 'Full access' });
}

async function seedPermissions(): Promise<Permissions[]> {
  return Permissions.bulkCreate([
    { name: 'DASHBOARD_VIEW', description: 'View dashboard' },
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

async function seedEmployee(overrides: Partial<Record<string, unknown>> = {}) {
  const defaults = {
    employee_id: `EMP${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`,
    first_name: 'John',
    last_name: 'Doe',
    email: `emp${Math.floor(Math.random() * 100000)}@salary.com`,
    date_of_birth: new Date('1990-05-15'),
    phone_number: '+1234567890',
    joined_date: new Date('2024-01-15'),
    department: 'ENGINEER',
    country: 'INDIA',
    is_active: true,
  };
  return Employees.create({ ...defaults, ...overrides });
}

async function seedTemplate() {
  return SalaryTemplates.create({
    name: 'India Standard',
    description: 'India salary template',
    country: 'IND',
    currency: 'INR',
    is_active: true,
  });
}

async function seedAssignment(employeeId: string, templateId: string, totalCtc: number, isActive = true) {
  return EmployeeSalaryAssignments.create({
    employee_id: employeeId,
    salary_structure_id: templateId,
    total_ctc: totalCtc,
    fixed_ctc: true,
    variable_pay: 0,
    effective_from: new Date(),
    is_active: isActive,
    version: 1,
  });
}

describe('Dashboard APIs', () => {
  let role: Roles;
  let permissions: Permissions[];
  let template: SalaryTemplates;

  beforeAll(async () => {
    await initModels();
    await syncDb();
    role = await seedRole();
    permissions = await seedPermissions();
    template = await seedTemplate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await UserPermissions.destroy({ where: {} });
    await User.destroy({ where: {} });
    await EmployeeSalaryAssignments.destroy({ where: {} });
    await Employees.destroy({ where: {} });
  });

  describe('GET /v1/dashboard/employees/total', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/v1/dashboard/employees/total');
      expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await request(app)
        .get('/v1/dashboard/employees/total')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('returns 403 when user does not have DASHBOARD_VIEW permission', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get('/v1/dashboard/employees/total')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('returns 200 with total count of all employees', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const perm = permissions.find((p) => p.name === 'DASHBOARD_VIEW')!;
      await grantPermissions(user.id, [perm]);
      const token = makeToken(user.id, user.email);

      await seedEmployee({ country: 'INDIA' });
      await seedEmployee({ country: 'USA' });
      await seedEmployee({ country: 'DUBAI' });

      const res = await request(app)
        .get('/v1/dashboard/employees/total')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(3);
    });

    it('returns 0 when no employees exist', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const perm = permissions.find((p) => p.name === 'DASHBOARD_VIEW')!;
      await grantPermissions(user.id, [perm]);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get('/v1/dashboard/employees/total')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total).toBe(0);
    });
  });

  describe('GET /v1/dashboard/employees/pending-onboarding', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/v1/dashboard/employees/pending-onboarding');
      expect(res.status).toBe(401);
    });

    it('returns 403 when user does not have DASHBOARD_VIEW permission', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get('/v1/dashboard/employees/pending-onboarding')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('returns count of active employees with no salary assignment', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const perm = permissions.find((p) => p.name === 'DASHBOARD_VIEW')!;
      await grantPermissions(user.id, [perm]);
      const token = makeToken(user.id, user.email);

      // 3 active employees: 1 has assignment, 2 don't
      const onboarded = await seedEmployee({ employee_id: 'EMP001', email: 'o@salary.com' });
      await seedEmployee({ employee_id: 'EMP002', email: 'p1@salary.com' });
      await seedEmployee({ employee_id: 'EMP003', email: 'p2@salary.com' });
      await seedAssignment(onboarded.id, template.id, 1000000);

      const res = await request(app)
        .get('/v1/dashboard/employees/pending-onboarding')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(2);
    });

    it('excludes inactive employees from pending count', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const perm = permissions.find((p) => p.name === 'DASHBOARD_VIEW')!;
      await grantPermissions(user.id, [perm]);
      const token = makeToken(user.id, user.email);

      // 1 active without assignment, 1 inactive without assignment
      await seedEmployee({ employee_id: 'EMP001', email: 'a@salary.com', is_active: true });
      await seedEmployee({ employee_id: 'EMP002', email: 'i@salary.com', is_active: false, resigned_at: new Date() });

      const res = await request(app)
        .get('/v1/dashboard/employees/pending-onboarding')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(1);
    });
  });

  describe('GET /v1/dashboard/employees/active-payroll', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/v1/dashboard/employees/active-payroll');
      expect(res.status).toBe(401);
    });

    it('returns 403 when user does not have DASHBOARD_VIEW permission', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get('/v1/dashboard/employees/active-payroll')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('returns count of employees with an active salary assignment', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const perm = permissions.find((p) => p.name === 'DASHBOARD_VIEW')!;
      await grantPermissions(user.id, [perm]);
      const token = makeToken(user.id, user.email);

      const emp1 = await seedEmployee({ employee_id: 'EMP001', email: 'a@salary.com' });
      const emp2 = await seedEmployee({ employee_id: 'EMP002', email: 'b@salary.com' });
      await seedEmployee({ employee_id: 'EMP003', email: 'c@salary.com' });

      await seedAssignment(emp1.id, template.id, 1000000, true);
      await seedAssignment(emp2.id, template.id, 1000000, true);

      const res = await request(app)
        .get('/v1/dashboard/employees/active-payroll')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(2);
    });

    it('does not count employees with inactive assignments', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const perm = permissions.find((p) => p.name === 'DASHBOARD_VIEW')!;
      await grantPermissions(user.id, [perm]);
      const token = makeToken(user.id, user.email);

      const emp = await seedEmployee({ employee_id: 'EMP001', email: 'a@salary.com' });
      await seedAssignment(emp.id, template.id, 1000000, false);

      const res = await request(app)
        .get('/v1/dashboard/employees/active-payroll')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.count).toBe(0);
    });
  });

  describe('GET /v1/dashboard/salary/average-ctc', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/v1/dashboard/salary/average-ctc');
      expect(res.status).toBe(401);
    });

    it('returns 403 when user does not have DASHBOARD_VIEW permission', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get('/v1/dashboard/salary/average-ctc')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('returns average CTC of all active assignments', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const perm = permissions.find((p) => p.name === 'DASHBOARD_VIEW')!;
      await grantPermissions(user.id, [perm]);
      const token = makeToken(user.id, user.email);

      const e1 = await seedEmployee({ employee_id: 'EMP001', email: 'a@salary.com' });
      const e2 = await seedEmployee({ employee_id: 'EMP002', email: 'b@salary.com' });
      await seedAssignment(e1.id, template.id, 1000000);
      await seedAssignment(e2.id, template.id, 2000000);

      const res = await request(app)
        .get('/v1/dashboard/salary/average-ctc')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Number(res.body.data.average_ctc)).toBe(1500000);
    });

    it('returns 0 when no active assignments exist', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const perm = permissions.find((p) => p.name === 'DASHBOARD_VIEW')!;
      await grantPermissions(user.id, [perm]);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get('/v1/dashboard/salary/average-ctc')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Number(res.body.data.average_ctc)).toBe(0);
    });
  });

  describe('POST /v1/dashboard/salary/ctc-distribution-by-country', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app)
        .post('/v1/dashboard/salary/ctc-distribution-by-country')
        .send({});
      expect(res.status).toBe(401);
    });

    it('returns 403 when user does not have DASHBOARD_VIEW permission', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .post('/v1/dashboard/salary/ctc-distribution-by-country')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it('returns CTC distribution counts grouped by country', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const perm = permissions.find((p) => p.name === 'DASHBOARD_VIEW')!;
      await grantPermissions(user.id, [perm]);
      const token = makeToken(user.id, user.email);

      // INDIA: <5L, 5L-10L, >10L — 1 each
      const e1 = await seedEmployee({ employee_id: 'EMP001', email: 'i1@salary.com', country: 'INDIA' });
      const e2 = await seedEmployee({ employee_id: 'EMP002', email: 'i2@salary.com', country: 'INDIA' });
      const e3 = await seedEmployee({ employee_id: 'EMP003', email: 'i3@salary.com', country: 'INDIA' });
      await seedAssignment(e1.id, template.id, 400000);
      await seedAssignment(e2.id, template.id, 700000);
      await seedAssignment(e3.id, template.id, 1500000);

      // USA: 1 in 5L-10L
      const e4 = await seedEmployee({ employee_id: 'EMP004', email: 'u1@salary.com', country: 'USA' });
      await seedAssignment(e4.id, template.id, 700000);

      const res = await request(app)
        .post('/v1/dashboard/salary/ctc-distribution-by-country')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const india = res.body.data.find((r: any) => r.country === 'INDIA');
      expect(india).toBeDefined();
      expect(india['<5L']).toBe(1);
      expect(india['5L-10L']).toBe(1);
      expect(india['>10L']).toBe(1);

      const usa = res.body.data.find((r: any) => r.country === 'USA');
      expect(usa).toBeDefined();
      expect(usa['<5L']).toBe(0);
      expect(usa['5L-10L']).toBe(1);
      expect(usa['>10L']).toBe(0);
    });
  });

  describe('GET /v1/dashboard/employees/by-country', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/v1/dashboard/employees/by-country');
      expect(res.status).toBe(401);
    });

    it('returns 403 when user does not have DASHBOARD_VIEW permission', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get('/v1/dashboard/employees/by-country')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('returns count of employees per country', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const perm = permissions.find((p) => p.name === 'DASHBOARD_VIEW')!;
      await grantPermissions(user.id, [perm]);
      const token = makeToken(user.id, user.email);

      await seedEmployee({ country: 'INDIA' });
      await seedEmployee({ country: 'INDIA' });
      await seedEmployee({ country: 'INDIA' });
      await seedEmployee({ country: 'USA' });
      await seedEmployee({ country: 'DUBAI' });

      const res = await request(app)
        .get('/v1/dashboard/employees/by-country')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const india = res.body.data.find((r: any) => r.country === 'INDIA');
      expect(india.count).toBe(3);

      const usa = res.body.data.find((r: any) => r.country === 'USA');
      expect(usa.count).toBe(1);

      const dubai = res.body.data.find((r: any) => r.country === 'DUBAI');
      expect(dubai.count).toBe(1);
    });
  });

  describe('POST /v1/dashboard/salary/amount-by-country-by-departments', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app)
        .post('/v1/dashboard/salary/amount-by-country-by-departments')
        .send({});
      expect(res.status).toBe(401);
    });

    it('returns 403 when user does not have DASHBOARD_VIEW permission', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .post('/v1/dashboard/salary/amount-by-country-by-departments')
        .set('Authorization', `Bearer ${token}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it('returns average and highest salary grouped by country and department', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const perm = permissions.find((p) => p.name === 'DASHBOARD_VIEW')!;
      await grantPermissions(user.id, [perm]);
      const token = makeToken(user.id, user.email);

      const e1 = await seedEmployee({ employee_id: 'EMP001', email: 'a@salary.com', country: 'INDIA', department: 'ENGINEER' });
      const e2 = await seedEmployee({ employee_id: 'EMP002', email: 'b@salary.com', country: 'INDIA', department: 'ENGINEER' });
      const e3 = await seedEmployee({ employee_id: 'EMP003', email: 'c@salary.com', country: 'INDIA', department: 'MANAGER' });
      const e4 = await seedEmployee({ employee_id: 'EMP004', email: 'd@salary.com', country: 'USA', department: 'ENGINEER' });

      await seedAssignment(e1.id, template.id, 1000000);
      await seedAssignment(e2.id, template.id, 2000000);
      await seedAssignment(e3.id, template.id, 3000000);
      await seedAssignment(e4.id, template.id, 4000000);

      const res = await request(app)
        .post('/v1/dashboard/salary/amount-by-country-by-departments')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);

      const indiaEng = res.body.data.find(
        (r: any) => r.country === 'INDIA' && r.department === 'ENGINEER',
      );
      expect(indiaEng).toBeDefined();
      expect(Number(indiaEng.average_ctc)).toBe(1500000);
      expect(Number(indiaEng.highest_ctc)).toBe(2000000);
      expect(indiaEng.employee_count).toBe(2);

      const indiaMgr = res.body.data.find(
        (r: any) => r.country === 'INDIA' && r.department === 'MANAGER',
      );
      expect(indiaMgr).toBeDefined();
      expect(Number(indiaMgr.average_ctc)).toBe(3000000);
      expect(indiaMgr.employee_count).toBe(1);

      const usaEng = res.body.data.find(
        (r: any) => r.country === 'USA' && r.department === 'ENGINEER',
      );
      expect(usaEng).toBeDefined();
      expect(Number(usaEng.average_ctc)).toBe(4000000);
      expect(usaEng.employee_count).toBe(1);
    });
  });
});
