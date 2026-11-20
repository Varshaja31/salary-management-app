import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';

import { sequelize } from '../config/sequelize.js';
import { SalaryTemplates } from './salary_templates.model.js';
import { SalaryComponents } from './salary_components.model.js';


export class SalaryTemplateComponents
  extends Model<InferAttributes<SalaryTemplateComponents>, InferCreationAttributes<SalaryTemplateComponents>>
  implements InferAttributes<SalaryTemplateComponents>
{
  declare id: CreationOptional<string>;
  declare template_id: string;
  declare component_id: string;
  declare createdAt: CreationOptional<Date>;

}
// Templates supporting each country
SalaryTemplateComponents.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
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
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'salary_template_components',
    timestamps: true,
    updatedAt: false,
  },
);
