import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';

import { sequelize } from '../config/sequelize.js';
import { SalaryTemplates } from './salary_templates.model.js';
import { SalaryComponents } from './salary_components.model.js';


export class SalaryStructures
  extends Model<InferAttributes<SalaryStructures>, InferCreationAttributes<SalaryStructures>>
  implements InferAttributes<SalaryStructures>
{
  declare id: CreationOptional<string>;
  declare name: string;
  declare template_id: string;
  declare component_id: string;
  declare calculation_type: string;
  declare amount: number;
  declare createdAt: CreationOptional<Date>;

}
// Salary structures for each template
SalaryStructures.init(
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
    template_id: {
      type: DataTypes.UUID,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      references: {
        model: SalaryTemplates,
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
        model: SalaryComponents,
        key: 'id',
      },
    },
    calculation_type: {
      type: DataTypes.ENUM('FIXED', 'PERCENTAGE'),
      allowNull: false,
      validate: {
        notEmpty: true,
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
    tableName: 'salary_structures',
    timestamps: true,
    updatedAt: false,
  },
);
