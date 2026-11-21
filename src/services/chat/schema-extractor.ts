import { sequelize } from '../../config/sequelize.js';
import { QueryTypes, type QueryInterface } from 'sequelize';

export interface TableDocument {
  tableName: string;
  description: string;
  columns: Array<{ name: string; type: string; nullable: boolean; primaryKey: boolean }>;
  foreignKeys: Array<{ column: string; referencesTable: string; referencesColumn: string }>;
  text: string; // the document text used for embedding
}

// Human-friendly descriptions per table so the retriever can match
// business questions ("employees", "salary", "payroll") to schema docs.
const TABLE_DESCRIPTIONS: Record<string, string> = {
  employees: 'Stores employee master data — name, email, department, country, joining/resignation dates, active status.',
  employee_salary_assignments: 'Salary/payroll assignments per employee — total CTC, fixed CTC, variable pay, effective date, active flag, template reference (salary_structure_id = salary_templates.id).',
  employee_salary_components: 'Calculated salary component amounts for each salary assignment — links to salary_components via component_id.',
  salary_templates: 'Country-level salary templates (INDIA, USA, DUBAI) with name, country, currency.',
  salary_template_components: 'Join table mapping salary templates to the salary components available in that template.',
  salary_components: 'Master list of salary component codes — earnings (BASIC_SALARY), allowances (HOUSING_ALLOWANCE), deductions (EMPLOYEE_PF), employer contributions, benefits.',
  users: 'Application users who can log in — name, email, password, role.',
  roles: 'User roles such as SUPERADMIN.',
  permissions: 'Granular permission codes like EMPLOYEE_VIEW, SALARY_CREATE, DASHBOARD_VIEW.',
  user_permissions: 'Join table granting permissions to users.',
};

const queryInterface: QueryInterface = sequelize.getQueryInterface();

const VALUE_SAMPLE_LIMIT = 15;
const MAX_VALUE_LENGTH = 40;
// Never sample these — secrets/PII must not end up in LLM prompts.
const SKIP_VALUE_COLUMNS = /password|token|secret|email|hash/i;

function isTextColumn(type: string): boolean {
  return /^(var)?char|text|enum/i.test(type);
}

// Samples distinct values for low-cardinality text columns so the LLM
// sees real stored values (e.g. 'INDIA') instead of guessing ('INDIA').
async function getColumnValues(tableName: string, columnName: string): Promise<string[]> {
  try {
    const rows = (await sequelize.query(
      `SELECT DISTINCT "${columnName}" AS v FROM "${tableName}" WHERE "${columnName}" IS NOT NULL LIMIT ${VALUE_SAMPLE_LIMIT + 1}`,
      { type: QueryTypes.SELECT },
    )) as unknown as Array<{ v: unknown }>;

    if (rows.length === 0 || rows.length > VALUE_SAMPLE_LIMIT) return [];

    const values = rows.map((r) => String(r.v));
    return values.some((v) => v.length > MAX_VALUE_LENGTH) ? [] : values;
  } catch {
    return [];
  }
}

async function getForeignKeys(tableName: string) {
  const rows = (await queryInterface.sequelize.query(
    `PRAGMA foreign_key_list("${tableName}")`,
    { type: QueryTypes.SELECT },
  )) as unknown as Array<{ from: string; table: string; to: string }>;

  return rows.map((r) => ({
    column: r.from,
    referencesTable: r.table,
    referencesColumn: r.to,
  }));
}

function buildDocumentText(
  doc: Omit<TableDocument, 'text'>,
  values: Record<string, string[]>,
): string {
  const cols = doc.columns
    .map((c) => `  - ${c.name} (${c.type}${c.primaryKey ? ', PK' : ''}${c.nullable ? ', nullable' : ''})`)
    .join('\n');

  const fks = doc.foreignKeys
    .map((f) => `  - ${f.column} -> ${f.referencesTable}.${f.referencesColumn}`)
    .join('\n');

  const vals = Object.entries(values)
    .map(([col, list]) => `  - ${col}: ${list.join(', ')}`)
    .join('\n');

  return [
    `Table: ${doc.tableName}`,
    `Description: ${doc.description}`,
    'Columns:',
    cols,
    doc.foreignKeys.length > 0 ? `Relationships:\n${fks}` : '',
    vals ? `Stored values (use these exact values in WHERE clauses):\n${vals}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

// Extracts schema docs for every user table (skips sqlite internals).
export async function extractSchemaDocuments(): Promise<TableDocument[]> {
  const tables = await queryInterface.showAllTables();
  const docs: TableDocument[] = [];

  for (const tableName of tables as unknown as string[]) {
    if (tableName.startsWith('sqlite_') || tableName === 'SequelizeMeta') continue;

    const definition = await queryInterface.describeTable(tableName);
    const columns = Object.entries(definition).map(([name, def]) => ({
      name,
      type: def.type,
      nullable: def.allowNull,
      primaryKey: def.primaryKey ?? false,
    }));

    const foreignKeys = await getForeignKeys(tableName);
    const description = TABLE_DESCRIPTIONS[tableName] ?? `Database table ${tableName}.`;

    const values: Record<string, string[]> = {};
    for (const col of columns) {
      if (col.primaryKey || !isTextColumn(col.type) || SKIP_VALUE_COLUMNS.test(col.name)) {
        continue;
      }
      const sampled = await getColumnValues(tableName, col.name);
      if (sampled.length > 0) values[col.name] = sampled;
    }

    const doc = { tableName, description, columns, foreignKeys };
    docs.push({ ...doc, text: buildDocumentText(doc, values) });
  }

  return docs;
}
