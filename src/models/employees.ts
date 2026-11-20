import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';

import { sequelize } from '../config/sequelize.js';


// Employee models
export class Employees
  extends Model<InferAttributes<Employees>, InferCreationAttributes<Employees>>
  implements InferAttributes<Employees>
{
  declare id: CreationOptional<string>;
  declare employee_id: string;
  declare first_name: string;
  declare last_name: string;
  declare email: string;
  declare date_of_birth: Date;
  declare phone_number: string;
  declare joined_date: Date;
  declare resigned_at: CreationOptional<Date | null>;
  declare department: string;
  declare country: string;
  declare is_active: boolean;
  declare createdAt: CreationOptional<Date>;
}

Employees.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
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
    date_of_birth: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    joined_date: {
      type: DataTypes.DATE,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    resigned_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    department: {
      type: DataTypes.ENUM('ENGINEER', 'MANAGER', 'DIRECTOR', 'VP', 'CEO'),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    country: {
      type: DataTypes.ENUM('INDIA', 'USA', 'DUBAI', 'UK', 'CANADA'),
      allowNull: false,
      validate: {
        notEmpty: true,
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
    }
  },
  {
    sequelize,
    tableName: 'employees',
    timestamps: true,
    updatedAt: false,
  },
);



