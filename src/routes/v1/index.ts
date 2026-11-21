/** @format */

import { Router } from 'express';

import authRouter from './auth.routes.js';
import employeesRouter from './employee.routes.js';
import salaryRouter from './salary.routes.js';
import dashboardRouter from './dashboard.routes.js';
import chatRouter from './chat.routes.js';

export const router = Router();

router.use('/auth', authRouter);
router.use('/employees', employeesRouter);
router.use('/salaries', salaryRouter);
router.use('/dashboard', dashboardRouter);
router.use('/chat', chatRouter);

