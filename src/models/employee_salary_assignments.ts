import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';

import { sequelize } from '../config/sequelize.js';


export class EmployeeSalaryAssignments
  extends Model<InferAttributes<EmployeeSalaryAssignments>, InferCreationAttributes<EmployeeSalaryAssignments>>
  implements InferAttributes<EmployeeSalaryAssignments>
{
  declare id: CreationOptional<string>;
  declare employee_id: string;
  declare salary_structure_id: string;
  declare total_ctc: number;
  declare fixed_ctc: boolean;
  declare variable_pay: number;
  declare effective_from: Date;
  declare is_active: boolean;
  declare version: number;
  declare createdAt: CreationOptional<Date>;
}

EmployeeSalaryAssignments.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      references: {
        model: 'employees',
        key: 'id',
      },
    },
    salary_structure_id: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      references: {
        model: 'salary_templates',
        key: 'id',
      },
    },
    total_ctc: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    fixed_ctc: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    variable_pay: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    effective_from: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'employee_salary_assignments',
    timestamps: true,
    updatedAt: false,
  },
);
