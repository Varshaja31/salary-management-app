import { Permissions } from '../models/permissions.model.js';
import { User } from '../models/user.model.js';
import { UserPermissions } from '../models/user_permissions.model.js';
import { verifyPassword } from '../models/user.model.js';
import { signToken, verifyToken } from '../utils/jwt/index.js';

export interface LoginResult {
  token: string;
  user: { id: string; name: string; email: string; role_id: string };
  permissions: string[];
}

export interface RefreshResult {
  user: { id: string; name: string; email: string; role_id: string };
  permissions: string[];
}

export class LoginError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

const findUser = async (
  query: Record<string, unknown>,
  includePassword = false,
): Promise<User | null> => {
  const scope = includePassword ? 'withPassword' : 'defaultScope';
  return User.scope(scope).findOne({ where: { ...query } });
};

const getUserPermissions = async (
  query: Record<string, unknown>,
  include?: Array<{ model: any; as: string; attributes: string[] }>,
) => {
  return UserPermissions.findAll({
    where: query,
    include: include,
  });
};

export async function login(email: string, password: string): Promise<LoginResult> {
  const user = await findUser({ email }, true);
  if (!user) {
    throw new LoginError(404, 'User not found');
  }

  const isMatch = await verifyPassword(password, user.password);
  if (!isMatch) {
    throw new LoginError(401, 'Invalid credentials');
  }

  const userPerms = await getUserPermissions(
    { user_id: user.id }, 
    [
      { model: Permissions, as: 'permission', attributes: ['name'] },
    ]
  );

  const permissionNames = userPerms
    .map((up) => up.get('permission') as Permissions | undefined)
    .filter((p): p is Permissions => p !== null && p !== undefined)
    .map((p) => p.name);

  const token = signToken({ id: user.id, email: user.email });

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, role_id: user.role_id },
    permissions: permissionNames,
  };
}

export async function refresh(token: string): Promise<RefreshResult> {
  const decoded = verifyToken(token) as { id: string; email: string };

  const user = await findUser({ id: decoded.id });
  if (!user) {
    throw new LoginError(404, 'User not found');
  }

  const userPerms = await getUserPermissions(
    { user_id: user.id },
    [{ model: Permissions, as: 'permission', attributes: ['name'] }],
  );

  const permissionNames = userPerms
    .map((up) => up.get('permission') as Permissions | undefined)
    .filter((p): p is Permissions => p !== null && p !== undefined)
    .map((p) => p.name);

  return {
    user: { id: user.id, name: user.name, email: user.email, role_id: user.role_id },
    permissions: permissionNames,
  };
}
