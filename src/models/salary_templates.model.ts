import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';

import { sequelize } from '../config/sequelize.js';


export class SalaryTemplates
  extends Model<InferAttributes<SalaryTemplates>, InferCreationAttributes<SalaryTemplates>>
  implements InferAttributes<SalaryTemplates>
{
  declare id: CreationOptional<string>;
  declare name: string;
  declare description: string;
  declare country: string;
  declare currency: string;
  declare is_active: boolean;
  declare createdAt: CreationOptional<Date>;

}
// List of salary templates specified per country
SalaryTemplates.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        notEmpty: true,
      },
    },
    country: {
      type: DataTypes.ENUM('IND', 'USA', 'DUBAI'),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    currency: {
      type: DataTypes.ENUM('USD', 'INR', 'AED'),
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
    },
  },
  {
    sequelize,
    tableName: 'salary_templates',
    timestamps: true,
    updatedAt: false,
  },
);
