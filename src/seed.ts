import { sequelize } from './config/sequelize.js';
import { logger } from './logger/logger.js';
import { initModels } from './models/index.js';
import { seedPermissions } from './seed/permissions.seed.js';
import { seedRoles } from './seed/roles.seed.js';
import { seedEmployees } from './seed/employees.seed.js';
import { seedSalaryComponents } from './seed/salary_components.seed.js';
import { seedSalaryTemplateComponents } from './seed/salary_template_components.seed.js';
import { seedSalaryTemplates } from './seed/salary_templates.seed.js';
import { seedInitialUser } from './seed/users.seed.js';

/**
 * One-off script that creates tables (if missing) and inserts seed data.
 *
 * Run with: `npm run seed`
 *
 * Order matters: roles and permissions must exist before the superadmin,
 * which references both. Each seeder is idempotent, so re-running is safe.
 */
async function run(): Promise<void> {
  try {
    await initModels();
    logger.info('Database connected and models synced');

    await seedRoles();
    logger.info('Roles seeded');

    await seedPermissions();
    logger.info('Permissions seeded');

    await seedSalaryComponents();
    logger.info('Salary components seeded');
    
    await seedInitialUser();
    logger.info('Initial user seeded');

    await seedSalaryTemplates();
    logger.info('Salary templates seeded');

    await seedSalaryTemplateComponents();
    logger.info('Salary template components seeded');

    await seedEmployees();
    logger.info('Employees seeded');

    logger.info('Seed completed successfully');
  } catch (err) {
    logger.error({ err }, 'Seed failed');
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

void run();
