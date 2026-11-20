/** @format */

import { Router } from 'express';

import authRouter from './auth.routes.js';
import employeesRouter from './employee.routes.js';

export const router = Router();

router.use('/auth', authRouter);
router.use('/employees', employeesRouter);

