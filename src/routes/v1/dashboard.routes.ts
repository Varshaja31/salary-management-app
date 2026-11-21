import { Router } from 'express';
import * as dashboardController from '../../controllers/dashboard.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { checkPermission } from '../../middlewares/permission.middleware.js';

const dashboardRouter = Router();

// Total employees count
dashboardRouter.get(
    '/employees/total',
    authMiddleware,
    checkPermission(['DASHBOARD_VIEW']),
    dashboardController.getTotalEmployees
);

// Employees with pending salary onboarding
dashboardRouter.get(
    '/employees/pending-onboarding',
    authMiddleware,
    checkPermission(['DASHBOARD_VIEW']),
    dashboardController.getPendingOnboardingEmployees
);

// Employees with active payrolls
dashboardRouter.get(
    '/employees/active-payroll',
    authMiddleware,
    checkPermission(['DASHBOARD_VIEW']),
    dashboardController.getActivePayrollEmployees
);

// Average CTC across employees
dashboardRouter.get(
    '/salary/average-ctc',
    authMiddleware,
    checkPermission(['DASHBOARD_VIEW']),
    dashboardController.getAverageEmployeeCtc
);

// CTC brackets (<5L, 5L-10L, >10L) average
dashboardRouter.post(
    '/salary/ctc-distribution-by-country',
    authMiddleware,
    checkPermission(['DASHBOARD_VIEW']),
    dashboardController.getCtcDistributionByCountry
);

// Employee count grouped by country
dashboardRouter.get(
    '/employees/by-country',
    authMiddleware,
    checkPermission(['DASHBOARD_VIEW']),
    dashboardController.getEmployeesByCountry
);

// Avg highsest salry countrywise by departments
dashboardRouter.post(
    '/salary/amount-by-country-by-departments',
    authMiddleware,
    checkPermission(['DASHBOARD_VIEW']),
    dashboardController.getSalaryAmountByCountryByDepartments
);



export default dashboardRouter;