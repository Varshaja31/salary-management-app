import type { Request, Response } from 'express';
import * as salaryService from '../services/salary.service.js';
import { SalaryError } from '../services/salary.service.js';

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

const list = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const result = await salaryService.listAssignments({ limit, offset });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof SalaryError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const view = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await salaryService.getAssignmentById(id);
    res.status(200).json({ data: result });
  } catch (error) {
    if (error instanceof SalaryError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await salaryService.updateAssignment(id, req.body);
    res.status(200).json({
      message: 'Salary assignment updated successfully',
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

export { assign, listTemplates, viewTemplate, list, view, update };
