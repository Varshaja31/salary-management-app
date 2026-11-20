import bcrypt from 'bcrypt';
import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';

import { sequelize } from '../config/sequelize.js';
import { Roles } from './roles.model.js';

const BCRYPT_ROUNDS = 10;

// User model for authentication and authorization
export class User
  extends Model<InferAttributes<User>, InferCreationAttributes<User>>
  implements InferAttributes<User>
{
  declare id: CreationOptional<string>;
  declare name: string;
  declare email: string;
  declare password: string;
  declare role_id: string;
  declare is_active: boolean;
  declare createdAt: CreationOptional<Date>;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100],
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [8, 255],
      },
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Roles,
        key: 'id',
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    updatedAt: false,
    defaultScope: {
      attributes: { exclude: ['password'] },
    },
    scopes: {
      withPassword: {
        attributes: { include: ['password'] },
      },
    },
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
        }
      },
    },
  },
);


// A user belongs to a single role; a role can have many users.
User.belongsTo(Roles, { foreignKey: 'role_id', as: 'role' });
Roles.hasMany(User, { foreignKey: 'role_id', as: 'users' });


export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
