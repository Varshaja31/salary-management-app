import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';

import { sequelize } from '../config/sequelize.js';

// Roles model for user access.
export class Roles
  extends Model<InferAttributes<Roles>, InferCreationAttributes<Roles>>
  implements InferAttributes<Roles>
{
  declare id: CreationOptional<string>;
  declare name: string;
  declare description: string;
  declare createdAt: CreationOptional<Date>;
}

Roles.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.ENUM('SUPERADMIN', 'ADMIN', 'USER'),
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
    tableName: 'roles',
    timestamps: true,
    updatedAt: false,
  },
);
