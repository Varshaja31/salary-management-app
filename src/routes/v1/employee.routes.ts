import { Router } from 'express';
import * as employeeController from '../../controllers/employee.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { checkPermission } from '../../middlewares/permission.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { employeeCreationSchema, employeeUpdateSchema } from '../../validations/employee.validation.js';

const employeeRouter = Router();

employeeRouter.post(
  '/',
  validate(employeeCreationSchema),
  authMiddleware,
  checkPermission(['EMPLOYEE_CREATE']),
  employeeController.create,
);

employeeRouter.get(
  '/',
  authMiddleware,
  checkPermission(['EMPLOYEE_VIEW']),
  employeeController.list,
);

employeeRouter.get(
  '/:id',
  authMiddleware,
  checkPermission(['EMPLOYEE_VIEW']),
  employeeController.view,
);

employeeRouter.put(
  '/:id',
  validate(employeeUpdateSchema),
  authMiddleware,
  checkPermission(['EMPLOYEE_UPDATE']),
  employeeController.update,
);

export default employeeRouter;
