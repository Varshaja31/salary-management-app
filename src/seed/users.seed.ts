import { randomUUID } from 'crypto';

import { User } from '../models/user.model.js';
import { UserPermissions } from '../models/user_permissions.model.js';
import { Roles } from '../models/roles.model.js';
import { Permissions } from '../models/permissions.model.js';

const SUPERADMIN_EMAIL = 'superadmin@salary.com';
const SUPERADMIN_PASSWORD = 'Superadmin@123';

export async function seedInitialUser(): Promise<void> {
  if (await User.count() > 0) return;

  const superadminRole = await Roles.findOne({ where: { name: 'SUPERADMIN' } });
  if (!superadminRole) {
    throw new Error('SUPERADMIN role not found; run role seeder first');
  }

  const user = await User.scope('withPassword').create({
    id: randomUUID(),
    name: 'Super Admin',
    email: SUPERADMIN_EMAIL,
    password: SUPERADMIN_PASSWORD,
    role_id: superadminRole.id,
    is_active: true,
  });

  // Grant the superadmin every permission.
  const allPermissions = await Permissions.findAll();
  if (allPermissions.length === 0) {
    throw new Error('No permissions found; run permission seeder first');
  }
  await UserPermissions.bulkCreate(
    allPermissions.map((p) => ({
      user_id: user.id,
      permission_id: p.id,
    })),
  );
}
