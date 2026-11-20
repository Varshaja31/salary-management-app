import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';

import { sequelize } from '../config/sequelize.js';


export class EmployeeSalaryComponents
  extends Model<InferAttributes<EmployeeSalaryComponents>, InferCreationAttributes<EmployeeSalaryComponents>>
  implements InferAttributes<EmployeeSalaryComponents>
{
  declare id: CreationOptional<string>;
  declare salary_assignment_id: string;
  declare component_id: string;
  declare amount: string;
  declare createdAt: CreationOptional<Date>;
}

EmployeeSalaryComponents.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    salary_assignment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      references: {
        model: 'employee_salary_assignments',
        key: 'id',
      },
    },
    component_id: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      references: {
        model: 'salary_components',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
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
    tableName: 'employee_salary_components',
    timestamps: true,
    updatedAt: false,
  },
);
