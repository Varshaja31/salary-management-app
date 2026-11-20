import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';

import { sequelize } from '../config/sequelize.js';


export class UserPermissions
  extends Model<InferAttributes<UserPermissions>, InferCreationAttributes<UserPermissions>>
  implements InferAttributes<UserPermissions>
{
  declare id: CreationOptional<string>;
  declare user_id: string;
  declare permission_id: string;
  declare createdAt: CreationOptional<Date>;
}

UserPermissions.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      references: {
        model: 'users',
        key: 'id',
      },
    },
    permission_id: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      references: {
        model: 'permissions',
        key: 'id',
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
    tableName: 'user_permissions',
    timestamps: true,
    updatedAt: false,
  },
);
