/** @format */

import { Router } from 'express';
import * as authController from '../../controllers/auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { loginSchema } from '../../validations/auth.validation.js';

const authRouter = Router();

authRouter.post(
  '/login',
  validate(loginSchema),
  authController.login
);

authRouter.get('/me', authController.refresh);

export default authRouter;