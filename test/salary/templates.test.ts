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
import { SalaryTemplates } from '../../src/models/salary_templates.model.js';
import { SalaryComponents } from '../../src/models/salary_components.model.js';
import { SalaryTemplateComponents } from '../../src/models/salary_template_components.model.js';

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
    { name: 'SALARY_VIEW', description: 'View salary' },
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

async function seedTemplates() {
  const india = await SalaryTemplates.create({
    name: 'India Standard',
    description: 'India salary template',
    country: 'IND',
    currency: 'INR',
    is_active: true,
  });
  const usa = await SalaryTemplates.create({
    name: 'USA Standard',
    description: 'USA salary template',
    country: 'USA',
    currency: 'USD',
    is_active: true,
  });

  const basic = await SalaryComponents.create({ code: 'BASIC_SALARY', description: 'Basic Salary', calculation_type: 'EARNING', is_active: true });
  const hra = await SalaryComponents.create({ code: 'HOUSING_ALLOWANCE', description: 'Housing Allowance', calculation_type: 'ALLOWANCE', is_active: true });
  const pf = await SalaryComponents.create({ code: 'EMPLOYER_PF', description: 'Employer PF', calculation_type: 'EMPLOYER_CONTRIBUTION', is_active: true });
  const term = await SalaryComponents.create({ code: 'TERM_INSURANCE', description: 'Term Insurance', calculation_type: 'EMPLOYER_CONTRIBUTION', is_active: true });

  await SalaryTemplateComponents.bulkCreate([
    { template_id: india.id, component_id: basic.id },
    { template_id: india.id, component_id: hra.id },
    { template_id: india.id, component_id: pf.id },
    { template_id: india.id, component_id: term.id },
    { template_id: usa.id, component_id: basic.id },
    { template_id: usa.id, component_id: pf.id },
  ]);

  return { india, usa, basic, hra, pf, term };
}

describe('Salary Template APIs', () => {
  let role: Roles;
  let permissions: Permissions[];
  let data: { india: SalaryTemplates; usa: SalaryTemplates; basic: SalaryComponents; hra: SalaryComponents; pf: SalaryComponents; term: SalaryComponents };

  beforeAll(async () => {
    await initModels();
    await syncDb();
    role = await seedRole();
    permissions = await seedPermissions();
    data = await seedTemplates();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await UserPermissions.destroy({ where: {} });
    await User.destroy({ where: {} });
  });

  describe('GET /v1/salaries/templates', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get('/v1/salaries/templates');
      expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await request(app)
        .get('/v1/salaries/templates')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('returns 403 when user does not have SALARY_VIEW permission', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get('/v1/salaries/templates')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('returns 200 with list of templates', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const viewPerm = permissions.find((p) => p.name === 'SALARY_VIEW')!;
      await grantPermissions(user.id, [viewPerm]);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get('/v1/salaries/templates')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('name');
      expect(res.body.data[0]).toHaveProperty('country');
      expect(res.body.data[0]).toHaveProperty('currency');
    });
  });

  describe('GET /v1/salaries/templates/:id', () => {
    it('returns 401 when no token is provided', async () => {
      const res = await request(app).get(`/v1/salaries/templates/${data.india.id}`);
      expect(res.status).toBe(401);
    });

    it('returns 401 when an invalid token is provided', async () => {
      const res = await request(app)
        .get(`/v1/salaries/templates/${data.india.id}`)
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(401);
    });

    it('returns 403 when user does not have SALARY_VIEW permission', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get(`/v1/salaries/templates/${data.india.id}`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(403);
    });

    it('returns 404 when template does not exist', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const viewPerm = permissions.find((p) => p.name === 'SALARY_VIEW')!;
      await grantPermissions(user.id, [viewPerm]);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get('/v1/salaries/templates/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    it('returns 200 with template details and its components', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const viewPerm = permissions.find((p) => p.name === 'SALARY_VIEW')!;
      await grantPermissions(user.id, [viewPerm]);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get(`/v1/salaries/templates/${data.india.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.id).toBe(data.india.id);
      expect(res.body.data.name).toBe('India Standard');
      expect(res.body.data.country).toBe('IND');
      expect(res.body.data.currency).toBe('INR');
      expect(res.body.data).toHaveProperty('components');
      expect(Array.isArray(res.body.data.components)).toBe(true);
      expect(res.body.data.components).toHaveLength(4);

      const codes = res.body.data.components.map((c: any) => c.code);
      expect(codes).toContain('BASIC_SALARY');
      expect(codes).toContain('HOUSING_ALLOWANCE');
      expect(codes).toContain('EMPLOYER_PF');
      expect(codes).toContain('TERM_INSURANCE');

      expect(res.body.data.components[0]).toHaveProperty('id');
      expect(res.body.data.components[0]).toHaveProperty('code');
      expect(res.body.data.components[0]).toHaveProperty('description');
      expect(res.body.data.components[0]).toHaveProperty('calculation_type');
    });

    it('returns 200 with USA template and its components', async () => {
      const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
      const viewPerm = permissions.find((p) => p.name === 'SALARY_VIEW')!;
      await grantPermissions(user.id, [viewPerm]);
      const token = makeToken(user.id, user.email);

      const res = await request(app)
        .get(`/v1/salaries/templates/${data.usa.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('USA Standard');
      expect(res.body.data.country).toBe('USA');
      expect(res.body.data.currency).toBe('USD');
      expect(res.body.data.components).toHaveLength(2);

      const codes = res.body.data.components.map((c: any) => c.code);
      expect(codes).toContain('BASIC_SALARY');
      expect(codes).toContain('EMPLOYER_PF');
    });
  });
});
