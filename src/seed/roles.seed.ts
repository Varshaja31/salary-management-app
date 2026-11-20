import { Roles } from '../models/roles.model.js';

const ROLE_SEEDS = [
  { name: 'SUPERADMIN', description: 'Full access to all resources' },
  { name: 'ADMIN', description: 'Administrative access with most permissions' },
  { name: 'USER', description: 'Standard user with limited access' },
] as const;

export async function seedRoles(): Promise<void> {
  if (await Roles.count() > 0) return;
  await Roles.bulkCreate(ROLE_SEEDS as never);
}
