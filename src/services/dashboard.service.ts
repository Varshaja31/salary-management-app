import { Op } from 'sequelize';

import { Employees } from '../models/employees.js';
import { EmployeeSalaryAssignments } from '../models/employee_salary_assignments.js';
import { sequelize } from '../config/sequelize.js';

export class DashboardError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
  }
}

export async function getTotalEmployees(): Promise<{ total: number }> {
  const total = await Employees.count();
  return { total };
}

export async function getPendingOnboardingEmployees(): Promise<{ count: number }> {
  // Count of active employees with NO active salary assignment
  const assignedIds = (
    await EmployeeSalaryAssignments.findAll({
      attributes: ['employee_id'],
      where: { is_active: true },
      group: ['employee_id'],
    })
  ).map((a) => a.employee_id);

  const count = await Employees.count({
    where: {
      is_active: true,
      ...(assignedIds.length > 0 ? { id: { [Op.notIn]: assignedIds } } : {}),
    },
  });

  return { count };
}

export async function getActivePayrollEmployees(): Promise<{ count: number }> {
  const assignedIds = (
    await EmployeeSalaryAssignments.findAll({
      attributes: ['employee_id'],
      where: { is_active: true },
      group: ['employee_id'],
    })
  ).map((a) => a.employee_id);

  if (assignedIds.length === 0) return { count: 0 };

  const count = await Employees.count({
    where: { id: { [Op.in]: assignedIds } },
  });

  return { count };
}

export async function getAverageEmployeeCtc(): Promise<{ average_ctc: number }> {
  const result = await EmployeeSalaryAssignments.findOne({
    attributes: [[sequelize.fn('AVG', sequelize.col('total_ctc')), 'average_ctc']],
    where: { is_active: true },
    raw: true,
  });

  const avg = result ? Number((result as unknown as { average_ctc: string }).average_ctc) : 0;
  return { average_ctc: Math.round(avg * 100) / 100 };
}

export async function getCtcDistributionByCountry(): Promise<
  Array<{ country: string; '<5L': number; '5L-10L': number; '>10L': number }>
> {
  const assignments = await EmployeeSalaryAssignments.findAll({
    where: { is_active: true },
    attributes: ['employee_id', 'total_ctc'],
  });

  const employeeIds = assignments.map((a) => a.employee_id);
  const employees = await Employees.findAll({
    where: { id: { [Op.in]: employeeIds } },
    attributes: ['id', 'country'],
  });
  const countryMap = new Map(employees.map((e) => [e.id, e.country]));

  const distribution = new Map<string, { '<5L': number; '5L-10L': number; '>10L': number }>();

  for (const a of assignments) {
    const country = countryMap.get(a.employee_id) ?? 'UNKNOWN';
    if (!distribution.has(country)) {
      distribution.set(country, { '<5L': 0, '5L-10L': 0, '>10L': 0 });
    }
    const bucket = distribution.get(country)!;
    if (a.total_ctc < 500000) {
      bucket['<5L']++;
    } else if (a.total_ctc <= 1000000) {
      bucket['5L-10L']++;
    } else {
      bucket['>10L']++;
    }
  }

  return Array.from(distribution.entries()).map(([country, brackets]) => ({
    country,
    ...brackets,
  }));
}

export async function getEmployeesByCountry(): Promise<Array<{ country: string; count: number }>> {
  const results = await Employees.findAll({
    attributes: ['country', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['country'],
    raw: true,
  });

  return (results as unknown as Array<{ country: string; count: string }>).map((r) => ({
    country: r.country,
    count: Number(r.count),
  }));
}

export async function getSalaryAmountByCountryByDepartments(): Promise<
  Array<{ country: string; department: string; average_ctc: number; highest_ctc: number; employee_count: number }>
> {
  const assignments = await EmployeeSalaryAssignments.findAll({
    where: { is_active: true },
    attributes: ['employee_id', 'total_ctc'],
  });

  const employeeIds = assignments.map((a) => a.employee_id);
  const employees = await Employees.findAll({
    where: { id: { [Op.in]: employeeIds } },
    attributes: ['id', 'country', 'department'],
  });
  const empMap = new Map(employees.map((e) => [e.id, { country: e.country, department: e.department }]));

  const groups = new Map<string, { total: number; max: number; count: number }>();

  for (const a of assignments) {
    const emp = empMap.get(a.employee_id);
    if (!emp) continue;

    const key = `${emp.country}|${emp.department}`;
    if (!groups.has(key)) {
      groups.set(key, { total: 0, max: 0, count: 0 });
    }
    const g = groups.get(key)!;
    g.total += a.total_ctc;
    g.max = Math.max(g.max, a.total_ctc);
    g.count++;
  }

  return Array.from(groups.entries()).map(([key, g]) => {
    const [country, department] = key.split('|');
    return {
      country,
      department,
      average_ctc: Math.round((g.total / g.count) * 100) / 100,
      highest_ctc: g.max,
      employee_count: g.count,
    };
  });
}
