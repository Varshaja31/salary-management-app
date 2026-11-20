import { Router } from 'express';
import * as salaryController from '../../controllers/salary.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { checkPermission } from '../../middlewares/permission.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { salaryAssignmentSchema, salaryUpdateSchema } from '../../validations/salary.validation.js';

const salaryRouter = Router();

// List all templates
salaryRouter.get(
  '/templates',
  authMiddleware,
  checkPermission(['SALARY_VIEW']),
  salaryController.listTemplates,
);

// View a single template with its components
salaryRouter.get(
  '/templates/:id',
  authMiddleware,
  checkPermission(['SALARY_VIEW']),
  salaryController.viewTemplate,
);

// List all salary assignments with pagination
salaryRouter.get(
  '/',
  authMiddleware,
  checkPermission(['SALARY_VIEW']),
  salaryController.list,
);

// View a single salary assignment
salaryRouter.get(
  '/:id',
  authMiddleware,
  checkPermission(['SALARY_VIEW']),
  salaryController.view,
);

salaryRouter.put(
  '/:id',
  validate(salaryUpdateSchema),
  authMiddleware,
  checkPermission(['SALARY_UPDATE']),
  salaryController.update,
);

salaryRouter.post(
  '/assign',
  validate(salaryAssignmentSchema),
  authMiddleware,
  checkPermission(['SALARY_CREATE']),
  salaryController.assign,
);

export default salaryRouter;
