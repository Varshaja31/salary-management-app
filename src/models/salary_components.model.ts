import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional } from 'sequelize';

import { sequelize } from '../config/sequelize.js';


export class SalaryComponents
  extends Model<InferAttributes<SalaryComponents>, InferCreationAttributes<SalaryComponents>>
  implements InferAttributes<SalaryComponents>
{
  declare id: CreationOptional<string>;
  declare code: string;
  declare description: string;
  declare calculation_type: string;
  declare is_active: boolean;
  declare createdAt: CreationOptional<Date>;

}
// List of components per country
SalaryComponents.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    code: {
      type: DataTypes.ENUM(
        'BASIC_SALARY', 
        'GROSS_SALARY', 
        'OVERTIME_PAY', 
        'ATTENDANCE_ALLOWANCE', 
        'SHIFT_ALLOWANCE', 
        'NIGHT_SHIFT_ALLOWANCE', 
        'COMMISSION', 
        'INCENTIVE', 
        'SALES_INCENTIVE', 
        'HOUSING_ALLOWANCE', 
        'TRANSPORT_ALLOWANCE', 
        'CONVEYANCE_ALLOWANCE',
        'MEDICAL_ALLOWANCE',
        'FOOD_ALLOWANCE',
        'MEAL_ALLOWANCE',
        'UTILITY_ALLOWANCE',
        'COMMUNICATION_ALLOWANCE',
        'MOBILE_ALLOWANCE',
        'INTERNET_ALLOWANCE',
        'EDUCATION_ALLOWANCE',
        'LEAVE_TRAVEL_ALLOWANCE',
        'RELOCATION_ALLOWANCE',
        'TRAVEL_ALLOWANCE',
        'CAR_ALLOWANCE',
        'FUEL_ALLOWANCE',
        'DRIVER_ALLOWANCE',
        'SPECIAL_ALLOWANCE',
        'OTHER_ALLOWANCE',
        'PERFORMANCE_BONUS',
        'ANNUAL_BONUS',
        'FESTIVAL_BONUS',
        'SIGN_ON_BONUS',
        'RETENTION_BONUS',
        'REFERRAL_BONUS',
        'PROFIT_SHARING',
        'MEDICAL_REIMBURSEMENT',
        'TRAVEL_REIMBURSEMENT',
        'FUEL_REIMBURSEMENT',
        'INTERNET_REIMBURSEMENT',
        'TELEPHONE_REIMBURSEMENT',
        'RELOCATION_REIMBURSEMENT',
        'BUSINESS_EXPENSE_REIMBURSEMENT',
        'MEAL_REIMBURSEMENT',
        'EMPLOYER_PF',
        'EMPLOYER_ESI',
        'EMPLOYER_401K',
        'EMPLOYER_SOCIAL_SECURITY',
        'EMPLOYER_MEDICARE',
        'EMPLOYER_PENSION',
        'EMPLOYER_NPS',
        'EMPLOYER_INSURANCE',
        'EMPLOYER_HEALTH_INSURANCE',
        'TERM_INSURANCE',
        'GRATUITY',
        'SUPERANNUATION',
        'EMPLOYEE_PF',
        'EMPLOYEE_ESI',
        'PROFESSIONAL_TAX',
      ),
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
    calculation_type: {
      type: DataTypes.ENUM('EARNING', 'ALLOWANCE', 'BONUS', 'REIMBURSEMENT', 'EMPLOYER_CONTRIBUTION', 'EMPLOYEE_CONTRIBUTION', 'TAX', 'DEDUCTION'),
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
    tableName: 'salary_components',
    timestamps: true,
    updatedAt: false,
  },
);
