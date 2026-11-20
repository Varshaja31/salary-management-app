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
    { name: 'EMPLOYEE_VIEW', description: 'View employees' },
    { name: 'EMPLOYEE_CREATE', description: 'Create employees' },
    { name: 'EMPLOYEE_UPDATE', description: 'Update employees' },
    { name: 'EMPLOYEE_DELETE', description: 'Delete employees' },
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

async function createEmployee(overrides: Partial<Record<string, unknown>> = {}) {
  const defaults = {
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
  };
  return Employees.create({ ...defaults, ...overrides });
}

describe('PUT /v1/employees/:id', () => {
  let role: Roles;
  let permissions: Permissions[];

  beforeAll(async () => {
    await initModels();
    await syncDb();
    role = await seedRole();
    permissions = await seedPermissions();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await UserPermissions.destroy({ where: {} });
    await User.destroy({ where: {} });
    await Employees.destroy({ where: {} });
  });

  // 1. No token → 401
  it('returns 401 when no token is provided', async () => {
    const employee = await createEmployee();
    const res = await request(app)
      .put(`/v1/employees/${employee.id}`)
      .send({ first_name: 'Updated' });
    expect(res.status).toBe(401);
  });

  // 2. Invalid token → 401
  it('returns 401 when an invalid token is provided', async () => {
    const employee = await createEmployee();
    const res = await request(app)
      .put(`/v1/employees/${employee.id}`)
      .set('Authorization', 'Bearer invalid-token')
      .send({ first_name: 'Updated' });
    expect(res.status).toBe(401);
  });

  // 3. Valid token but no EMPLOYEE_UPDATE permission → 403
  it('returns 403 when user does not have EMPLOYEE_UPDATE permission', async () => {
    const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
    const employee = await createEmployee();
    const token = makeToken(user.id, user.email);

    const res = await request(app)
      .put(`/v1/employees/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ first_name: 'Updated' });
    expect(res.status).toBe(403);
  });

  // 4. Employee not found → 404
  it('returns 404 when employee does not exist', async () => {
    const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
    const updatePerm = permissions.find((p) => p.name === 'EMPLOYEE_UPDATE')!;
    await grantPermissions(user.id, [updatePerm]);
    const token = makeToken(user.id, user.email);

    const res = await request(app)
      .put('/v1/employees/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ first_name: 'Updated' });
    expect(res.status).toBe(404);
  });

  // 5. Invalid data → 400
  it('returns 400 when updating with invalid data', async () => {
    const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
    const updatePerm = permissions.find((p) => p.name === 'EMPLOYEE_UPDATE')!;
    await grantPermissions(user.id, [updatePerm]);
    const token = makeToken(user.id, user.email);

    const employee = await createEmployee();

    const res = await request(app)
      .put(`/v1/employees/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ department: 'INVALID_DEPT' });
    expect(res.status).toBe(400);
  });

  // 6. Valid token + permission + valid data → 200
  it('returns 200 with updated employee data', async () => {
    const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
    const updatePerm = permissions.find((p) => p.name === 'EMPLOYEE_UPDATE')!;
    await grantPermissions(user.id, [updatePerm]);
    const token = makeToken(user.id, user.email);

    const employee = await createEmployee({ employee_id: 'EMP001', email: 'john@salary.com' });

    const res = await request(app)
      .put(`/v1/employees/${employee.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        first_name: 'UpdatedName',
        department: 'MANAGER',
        country: 'USA',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.first_name).toBe('UpdatedName');
    expect(res.body.data.department).toBe('MANAGER');
    expect(res.body.data.country).toBe('USA');
    // Unchanged fields should remain the same
    expect(res.body.data.email).toBe('john@salary.com');
    expect(res.body.data.employee_id).toBe('EMP001');
  });
});
