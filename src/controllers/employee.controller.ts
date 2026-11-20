import type { Request, Response } from 'express';
import * as employeeService from '../services/employee.service.js';
import { EmployeeError } from '../services/employee.service.js';

const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const { body } = req;
    const employee = await employeeService.createEmployee(body);
    res.status(200).json({
      message: 'Employee created successfully',
      data: employee,
    });
  } catch (error) {
    if (error instanceof EmployeeError) {
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
    const result = await employeeService.listEmployees({ limit, offset });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof EmployeeError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const view = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const employee = await employeeService.getEmployeeById(id);
    res.status(200).json({ data: employee });
  } catch (error) {
    if (error instanceof EmployeeError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { body } = req;
    const employee = await employeeService.updateEmployee(id, body);
    res.status(200).json({
      message: 'Employee updated successfully',
      data: employee,
    });
  } catch (error) {
    if (error instanceof EmployeeError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export { create, list, view, update };
