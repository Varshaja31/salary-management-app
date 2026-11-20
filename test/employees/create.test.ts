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

const validEmployeePayload = {
  employee_id: 'EMP001',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@salary.com',
  date_of_birth: '1990-05-15',
  phone_number: '+1234567890',
  joined_date: '2024-01-15',
  department: 'ENGINEER',
  country: 'INDIA',
};

describe('POST /v1/employees', () => {
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

  // 1. No data provided → 400
  it('returns 400 when no required data is provided', async () => {
    const res = await request(app).post('/v1/employees').send({});
    expect(res.status).toBe(400);
  });

  // 2. No token → 401
  it('returns 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/v1/employees')
      .send(validEmployeePayload);
    expect(res.status).toBe(401);
  });

  // 3. Invalid token → 401
  it('returns 401 when an invalid token is provided', async () => {
    const res = await request(app)
      .post('/v1/employees')
      .set('Authorization', 'Bearer invalid-token')
      .send(validEmployeePayload);
    expect(res.status).toBe(401);
  });

  // 4. Valid token but no EMPLOYEE_CREATE permission → 403
  it('returns 403 when user does not have EMPLOYEE_CREATE permission', async () => {
    const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
    // No permissions granted
    const token = makeToken(user.id, user.email);

    const res = await request(app)
      .post('/v1/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(validEmployeePayload);
    expect(res.status).toBe(403);
  });

  // 5. Email already exists → 400
  it('returns 400 when employee email already exists', async () => {
    const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
    const createPerm = permissions.find((p) => p.name === 'EMPLOYEE_CREATE')!;
    await grantPermissions(user.id, [createPerm]);
    const token = makeToken(user.id, user.email);

    // Create first employee
    await request(app)
      .post('/v1/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(validEmployeePayload);

    // Try to create again with same email
    const res = await request(app)
      .post('/v1/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(validEmployeePayload);
    expect(res.status).toBe(400);
  });

  // 6. Valid token + permission + valid data → 200
  it('returns 200 when employee is created successfully', async () => {
    const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
    const createPerm = permissions.find((p) => p.name === 'EMPLOYEE_CREATE')!;
    await grantPermissions(user.id, [createPerm]);
    const token = makeToken(user.id, user.email);

    const res = await request(app)
      .post('/v1/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(validEmployeePayload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data.employee_id).toBe(validEmployeePayload.employee_id);
    expect(res.body.data.first_name).toBe(validEmployeePayload.first_name);
    expect(res.body.data.last_name).toBe(validEmployeePayload.last_name);
    expect(res.body.data.email).toBe(validEmployeePayload.email);
    expect(res.body.data.department).toBe(validEmployeePayload.department);
    expect(res.body.data.country).toBe(validEmployeePayload.country);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('createdAt');
  });
});
