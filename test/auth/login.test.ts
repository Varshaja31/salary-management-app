import request from 'supertest';

import { createApp } from '../../src/app.js';
import { sequelize } from '../../src/config/sequelize.js';
import { initModels } from '../../src/models/index.js';
import { Roles } from '../../src/models/roles.model.js';
import { Permissions } from '../../src/models/permissions.model.js';
import { User } from '../../src/models/user.model.js';
import { UserPermissions } from '../../src/models/user_permissions.model.js';

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
    { name: 'USER_VIEW', description: 'View users' },
    { name: 'USER_CREATE', description: 'Create users' },
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

describe('POST /v1/auth/login', () => {
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
  });

  // 1. Missing email or password → 400
  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/v1/auth/login').send({ password: TEST_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when password is missing', async () => {
    const res = await request(app).post('/v1/auth/login').send({ email: TEST_EMAIL });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 2. Invalid email format → 400
  it('returns 400 when email is not a valid email', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'not-an-email', password: TEST_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // 3. User not found → 404
  it('returns 404 when email does not exist in DB', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: 'nobody@salary.com', password: TEST_PASSWORD });
    expect(res.status).toBe(404);
  });

  // 4. Email found but wrong password → 401
  it('returns 401 when password is incorrect', async () => {
    await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: TEST_EMAIL, password: 'WrongPassword@999' });
    expect(res.status).toBe(401);
  });

  // 5. Valid credentials but no permissions → 200 with permissions []
  it('returns 200 with empty permissions array when user has no permissions', async () => {
    const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.id).toBe(user.id);
    expect(Array.isArray(res.body.permissions)).toBe(true);
    expect(res.body.permissions).toHaveLength(0);
  });

  // 6. Valid credentials + permissions → 200 with token, permissions, user
  it('returns 200 with token, permissions, and user details on success', async () => {
    const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
    await grantPermissions(user.id, permissions);

    const res = await request(app)
      .post('/v1/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body).toHaveProperty('permissions');
    expect(Array.isArray(res.body.permissions)).toBe(true);
    expect(res.body.permissions).toHaveLength(2);
    expect(res.body.permissions).toContain('USER_VIEW');
    expect(res.body.permissions).toContain('USER_CREATE');
    expect(res.body.user).not.toHaveProperty('password');
  });
});
