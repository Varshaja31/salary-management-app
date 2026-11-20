import { Router } from 'express';
import * as salaryController from '../../controllers/salary.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { checkPermission } from '../../middlewares/permission.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { salaryAssignmentSchema, salaryCalculationSchema } from '../../validations/salary.validation.js';

const salaryRouter = Router();

salaryRouter.get(
  '/templates',
  authMiddleware,
  checkPermission(['SALARY_VIEW']),
  salaryController.listTemplates,
);

salaryRouter.get(
  '/templates/:id',
  authMiddleware,
  checkPermission(['SALARY_VIEW']),
  salaryController.viewTemplate,
);

salaryRouter.post(
  '/calculate',
  validate(salaryCalculationSchema),
  authMiddleware,
  checkPermission(['SALARY_VIEW']),
  salaryController.calculate,
);

salaryRouter.post(
  '/assign',
  validate(salaryAssignmentSchema),
  authMiddleware,
  checkPermission(['SALARY_CREATE']),
  salaryController.assign,
);

export default salaryRouter;
