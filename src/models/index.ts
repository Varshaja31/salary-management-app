import { sequelize } from '../config/sequelize.js';

import './roles.model.js';
import './permissions.model.js';
import './user.model.js';
import './user_permissions.model.js';
import './salary_components.model.js';
import './salary_templates.model.js';
import './salary_template_components.model.js';
import './salary_structures.model.js';
import './employee_salary_assignments.js';
import './employee_salary_components.js';
import './employees.js';

export async function initModels(): Promise<void> {
  await sequelize.authenticate();
  await sequelize.sync({ force: false });
}
