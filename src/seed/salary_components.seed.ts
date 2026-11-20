import { SalaryComponents } from '../models/salary_components.model.js';

const SALARY_COMPONENT_SEEDS = [
  // EARNINGS
  { code: 'BASIC_SALARY', description: 'Base fixed salary paid to the employee', calculation_type: 'EARNING' },
  { code: 'GROSS_SALARY', description: 'Total earnings before any deductions', calculation_type: 'EARNING' },
  { code: 'OVERTIME_PAY', description: 'Compensation for hours worked beyond the regular schedule', calculation_type: 'EARNING' },
  { code: 'COMMISSION', description: 'Earnings based on sales or deals closed', calculation_type: 'EARNING' },

  // ALLOWANCES
  { code: 'ATTENDANCE_ALLOWANCE', description: 'Allowance for meeting attendance targets', calculation_type: 'ALLOWANCE' },
  { code: 'SHIFT_ALLOWANCE', description: 'Allowance for working non-standard shifts', calculation_type: 'ALLOWANCE' },
  { code: 'NIGHT_SHIFT_ALLOWANCE', description: 'Allowance for working night shifts', calculation_type: 'ALLOWANCE' },
  { code: 'INCENTIVE', description: 'Performance-linked incentive payment', calculation_type: 'ALLOWANCE' },
  { code: 'SALES_INCENTIVE', description: 'Incentive based on sales achievement', calculation_type: 'ALLOWANCE' },
  { code: 'HOUSING_ALLOWANCE', description: 'Allowance towards housing/rent expenses', calculation_type: 'ALLOWANCE' },
  { code: 'TRANSPORT_ALLOWANCE', description: 'Allowance for commuting expenses', calculation_type: 'ALLOWANCE' },
  { code: 'CONVEYANCE_ALLOWANCE', description: 'Allowance for daily travel costs', calculation_type: 'ALLOWANCE' },
  { code: 'MEDICAL_ALLOWANCE', description: 'Fixed allowance for medical expenses', calculation_type: 'ALLOWANCE' },
  { code: 'FOOD_ALLOWANCE', description: 'Allowance for food expenses', calculation_type: 'ALLOWANCE' },
  { code: 'MEAL_ALLOWANCE', description: 'Allowance for meals during work', calculation_type: 'ALLOWANCE' },
  { code: 'UTILITY_ALLOWANCE', description: 'Allowance for utility bills', calculation_type: 'ALLOWANCE' },
  { code: 'COMMUNICATION_ALLOWANCE', description: 'Allowance for communication expenses', calculation_type: 'ALLOWANCE' },
  { code: 'MOBILE_ALLOWANCE', description: 'Allowance for mobile phone usage', calculation_type: 'ALLOWANCE' },
  { code: 'INTERNET_ALLOWANCE', description: 'Allowance for internet connectivity', calculation_type: 'ALLOWANCE' },
  { code: 'EDUCATION_ALLOWANCE', description: 'Allowance for children education', calculation_type: 'ALLOWANCE' },
  { code: 'LEAVE_TRAVEL_ALLOWANCE', description: 'Allowance for travel during leave', calculation_type: 'ALLOWANCE' },
  { code: 'RELOCATION_ALLOWANCE', description: 'Allowance for relocation expenses', calculation_type: 'ALLOWANCE' },
  { code: 'TRAVEL_ALLOWANCE', description: 'Allowance for business travel', calculation_type: 'ALLOWANCE' },
  { code: 'CAR_ALLOWANCE', description: 'Allowance for car maintenance and fuel', calculation_type: 'ALLOWANCE' },
  { code: 'FUEL_ALLOWANCE', description: 'Allowance for fuel expenses', calculation_type: 'ALLOWANCE' },
  { code: 'DRIVER_ALLOWANCE', description: 'Allowance for driver salary', calculation_type: 'ALLOWANCE' },
  { code: 'SPECIAL_ALLOWANCE', description: 'Miscellaneous special allowance', calculation_type: 'ALLOWANCE' },

  // BONUSES
  { code: 'PERFORMANCE_BONUS', description: 'Bonus based on performance appraisal', calculation_type: 'BONUS' },
  { code: 'ANNUAL_BONUS', description: 'Year-end bonus payment', calculation_type: 'BONUS' },
  { code: 'FESTIVAL_BONUS', description: 'Bonus paid during festivals', calculation_type: 'BONUS' },
  { code: 'SIGN_ON_BONUS', description: 'Bonus paid at the time of joining', calculation_type: 'BONUS' },
  { code: 'RETENTION_BONUS', description: 'Bonus to retain the employee', calculation_type: 'BONUS' },
  { code: 'REFERRAL_BONUS', description: 'Bonus for successful employee referrals', calculation_type: 'BONUS' },
  { code: 'PROFIT_SHARING', description: 'Share of company profits distributed to employee', calculation_type: 'BONUS' },

  // REIMBURSEMENTS
  { code: 'MEDICAL_REIMBURSEMENT', description: 'Reimbursement of medical bills', calculation_type: 'REIMBURSEMENT' },
  { code: 'TRAVEL_REIMBURSEMENT', description: 'Reimbursement of business travel expenses', calculation_type: 'REIMBURSEMENT' },
  { code: 'FUEL_REIMBURSEMENT', description: 'Reimbursement of fuel bills', calculation_type: 'REIMBURSEMENT' },
  { code: 'INTERNET_REIMBURSEMENT', description: 'Reimbursement of internet bills', calculation_type: 'REIMBURSEMENT' },
  { code: 'TELEPHONE_REIMBURSEMENT', description: 'Reimbursement of telephone bills', calculation_type: 'REIMBURSEMENT' },
  { code: 'RELOCATION_REIMBURSEMENT', description: 'Reimbursement of relocation expenses', calculation_type: 'REIMBURSEMENT' },
  { code: 'BUSINESS_EXPENSE_REIMBURSEMENT', description: 'Reimbursement of business expenses', calculation_type: 'REIMBURSEMENT' },
  { code: 'MEAL_REIMBURSEMENT', description: 'Reimbursement of meal expenses', calculation_type: 'REIMBURSEMENT' },

  // EMPLOYER CONTRIBUTIONS
  { code: 'EMPLOYER_PF', description: 'Employer contribution to Provident Fund', calculation_type: 'EMPLOYER_CONTRIBUTION' },
  { code: 'EMPLOYER_ESI', description: 'Employer contribution to ESI', calculation_type: 'EMPLOYER_CONTRIBUTION' },
  { code: 'EMPLOYER_401K', description: 'Employer contribution to 401(k)', calculation_type: 'EMPLOYER_CONTRIBUTION' },
  { code: 'EMPLOYER_SOCIAL_SECURITY', description: 'Employer social security contribution', calculation_type: 'EMPLOYER_CONTRIBUTION' },
  { code: 'EMPLOYER_MEDICARE', description: 'Employer Medicare contribution', calculation_type: 'EMPLOYER_CONTRIBUTION' },
  { code: 'EMPLOYER_PENSION', description: 'Employer pension contribution', calculation_type: 'EMPLOYER_CONTRIBUTION' },
  { code: 'EMPLOYER_NPS', description: 'Employer contribution to National Pension System', calculation_type: 'EMPLOYER_CONTRIBUTION' },
  { code: 'EMPLOYER_INSURANCE', description: 'Employer-paid insurance premium', calculation_type: 'EMPLOYER_CONTRIBUTION' },
  { code: 'EMPLOYER_HEALTH_INSURANCE', description: 'Employer-paid health insurance premium', calculation_type: 'EMPLOYER_CONTRIBUTION' },
  { code: 'GRATUITY', description: 'Gratuity payable by the employer', calculation_type: 'EMPLOYER_CONTRIBUTION' },
  { code: 'SUPERANNUATION', description: 'Employer contribution to superannuation fund', calculation_type: 'EMPLOYER_CONTRIBUTION' },

  // EMPLOYEE CONTRIBUTIONS
  { code: 'EMPLOYEE_PF', description: 'Employee contribution to Provident Fund', calculation_type: 'EMPLOYEE_CONTRIBUTION' },
  { code: 'EMPLOYEE_ESI', description: 'Employee contribution to ESI', calculation_type: 'EMPLOYEE_CONTRIBUTION' },

  // TAXES
  { code: 'PROFESSIONAL_TAX', description: 'Professional tax deducted from salary', calculation_type: 'TAX' },
] as const;

export async function seedSalaryComponents(): Promise<void> {
  if (await SalaryComponents.count() > 0) return;
  await SalaryComponents.bulkCreate(SALARY_COMPONENT_SEEDS as never);
}
