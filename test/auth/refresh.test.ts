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

function createToken(userId: string, email: string): string {
  return jwt.sign({ id: userId, email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

describe('GET /v1/auth/me', () => {
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

  // 1. No token provided → 401
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  // 2. Invalid token → 401
  it('returns 401 when an invalid token is provided', async () => {
    const res = await request(app)
      .get('/v1/auth/me')
      .set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  // 3. Valid token → 200 with user + permissions
  it('returns 200 with user details and permissions when a valid token is provided', async () => {
    const user = await createUser(TEST_EMAIL, TEST_PASSWORD, role.id);
    await grantPermissions(user.id, permissions);
    const token = createToken(user.id, user.email);

    const res = await request(app)
      .get('/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.id).toBe(user.id);
    expect(res.body.user.email).toBe(TEST_EMAIL);
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body).toHaveProperty('permissions');
    expect(Array.isArray(res.body.permissions)).toBe(true);
    expect(res.body.permissions).toHaveLength(2);
    expect(res.body.permissions).toContain('USER_VIEW');
    expect(res.body.permissions).toContain('USER_CREATE');
  });
});
