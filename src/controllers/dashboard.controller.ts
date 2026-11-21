import type { Request, Response } from 'express';

import * as dashboardService from '../services/dashboard.service.js';
import { DashboardError } from '../services/dashboard.service.js';

const getTotalEmployees = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await dashboardService.getTotalEmployees();
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof DashboardError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getPendingOnboardingEmployees = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await dashboardService.getPendingOnboardingEmployees();
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof DashboardError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getActivePayrollEmployees = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await dashboardService.getActivePayrollEmployees();
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof DashboardError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getAverageEmployeeCtc = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await dashboardService.getAverageEmployeeCtc();
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof DashboardError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getCtcDistributionByCountry = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await dashboardService.getCtcDistributionByCountry();
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof DashboardError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getEmployeesByCountry = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await dashboardService.getEmployeesByCountry();
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof DashboardError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getSalaryAmountByCountryByDepartments = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await dashboardService.getSalaryAmountByCountryByDepartments();
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof DashboardError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export {
  getTotalEmployees,
  getPendingOnboardingEmployees,
  getActivePayrollEmployees,
  getAverageEmployeeCtc,
  getCtcDistributionByCountry,
  getEmployeesByCountry,
  getSalaryAmountByCountryByDepartments,
};
