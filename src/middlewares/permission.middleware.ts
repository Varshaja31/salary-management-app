import type { NextFunction, Request, Response } from 'express';

import { Permissions } from '../models/permissions.model.js';
import { UserPermissions } from '../models/user_permissions.model.js';


export function checkPermission(requiredPermissions: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const userPerms = await UserPermissions.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Permissions, as: 'permission', attributes: ['name'] }],
    });

    const permissionNames = userPerms
      .map((up) => up.get('permission') as Permissions | undefined)
      .filter((p): p is Permissions => p !== null && p !== undefined)
      .map((p) => p.name);

    if(!requiredPermissions.some((permission) => permissionNames.includes(permission))) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}
