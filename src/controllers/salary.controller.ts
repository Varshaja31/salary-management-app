import type { Request, Response } from 'express';
import * as salaryService from '../services/salary.service.js';
import { SalaryError } from '../services/salary.service.js';

const calculate = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await salaryService.calculateSalary(req.body);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof SalaryError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const assign = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await salaryService.assignSalary(req.body);
    res.status(200).json({
      message: 'Salary assigned successfully',
      data: result,
    });
  } catch (error) {
    if (error instanceof SalaryError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const listTemplates = async (_req: Request, res: Response): Promise<void> => {
  try {
    const templates = await salaryService.listTemplates();
    res.status(200).json({ data: templates });
  } catch (error) {
    if (error instanceof SalaryError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const viewTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const template = await salaryService.getTemplateWithComponents(id);
    res.status(200).json({ data: template });
  } catch (error) {
    if (error instanceof SalaryError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export { calculate, assign, listTemplates, viewTemplate };
