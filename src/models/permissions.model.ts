import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';

import { sequelize } from '../config/sequelize.js';

// Permissions model for role-based access control.
export class Permissions
  extends Model<InferAttributes<Permissions>, InferCreationAttributes<Permissions>>
  implements InferAttributes<Permissions>
{
  declare id: CreationOptional<string>;
  declare name: string;
  declare description: string;
  declare createdAt: CreationOptional<Date>;
}

Permissions.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.ENUM(
        'USER_VIEW',
        'USER_CREATE',
        'USER_UPDATE',
        'USER_DELETE',
        'ROLE_ASSIGN',
        'EMPLOYEE_VIEW',
        'EMPLOYEE_CREATE',
        'EMPLOYEE_UPDATE',
        'EMPLOYEE_DELETE',
        'SALARY_TEMPLATE_VIEW',
        'SALARY_TEMPLATE_CREATE',
        'SALARY_TEMPLATE_UPDATE',
        'SALARY_TEMPLATE_DELETE',
        'SALARY_VIEW',
        'SALARY_CREATE',
        'SALARY_UPDATE',
        'SALARY_DELETE',
        'DASHBOARD_VIEW',
        'EMPLOYEE_REPORT_VIEW'
      ),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'permissions',
    timestamps: true,
    updatedAt: false,
  },
);
