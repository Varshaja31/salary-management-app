import type { InferAttributes } from 'sequelize';

import { Employees } from '../models/employees.js';

export class EmployeeError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

const findOne = async (query: Record<string, unknown>) =>
  Employees.findOne({ where: { ...query } });

const findAll = async (query: Record<string, unknown> = {}) =>
  Employees.findAll({ where: { ...query } });

const create = async (data: Partial<InferAttributes<Employees>>) => Employees.create(data as never);

const update = async (
  data: Partial<InferAttributes<Employees>>,
  instance: Employees,
) => instance.update(data);


export async function createEmployee(data: {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  phone_number: string;
  joined_date: string;
  resigned_at?: string | null;
  department: string;
  country: string;
}) {
  const { employee_id } = data;
  const existing = await findOne({ employee_id });
  if (existing) {
    throw new EmployeeError(400, 'Employee ID already exists');
  }

  const existingEmail = await findOne({ email: data.email });
  if (existingEmail) {
    throw new EmployeeError(400, 'Employee with this email already exists');
  }

  const employee = await create({
    employee_id: data.employee_id,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    date_of_birth: new Date(data.date_of_birth),
    phone_number: data.phone_number,
    joined_date: new Date(data.joined_date),
    resigned_at: data.resigned_at ? new Date(data.resigned_at) : null,
    department: data.department,
    country: data.country,
  });

  return employee;
}

export async function listEmployees() {
  return findAll();
}

export async function getEmployeeById(id: string) {
  const employee = await findOne({ id });
  if (!employee) {
    throw new EmployeeError(404, 'Employee not found');
  }
  return employee;
}

export async function updateEmployee(
  id: string,
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    date_of_birth?: string;
    phone_number?: string;
    joined_date?: string;
    resigned_at?: string | null;
    department?: string;
    country?: string;
    is_active?: boolean;
  },
) {
  const employee = await findOne({ id });
  if (!employee) {
    throw new EmployeeError(404, 'Employee not found');
  }

  const updates: Partial<InferAttributes<Employees>> = {};
  if (data.first_name !== undefined) updates.first_name = data.first_name;
  if (data.last_name !== undefined) updates.last_name = data.last_name;
  if (data.email !== undefined) updates.email = data.email;
  if (data.date_of_birth !== undefined) updates.date_of_birth = new Date(data.date_of_birth);
  if (data.phone_number !== undefined) updates.phone_number = data.phone_number;
  if (data.joined_date !== undefined) updates.joined_date = new Date(data.joined_date);
  if (data.resigned_at !== undefined) updates.resigned_at = data.resigned_at ? new Date(data.resigned_at) : null;
  if (data.department !== undefined) updates.department = data.department;
  if (data.country !== undefined) updates.country = data.country;
  if (data.is_active !== undefined) updates.is_active = data.is_active;

  await update(updates, employee);
  return employee;
}
