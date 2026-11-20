import { Employees } from '../models/employees.js';

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan',
  'Krishna', 'Ishaan', 'Rohan', 'Karan', 'Rahul', 'Amit', 'Suresh', 'Deepak',
  'Priya', 'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Kiara', 'Pooja', 'Neha',
  'Riya', 'Sneha', 'Kavya', 'Meera', 'John', 'Michael', 'David', 'Chris',
  'James', 'Robert', 'Daniel', 'Matthew', 'Andrew', 'Sarah', 'Emily', 'Jessica',
  'Ashley', 'Amanda', 'Jennifer', 'Olivia', 'Sophia', 'Emma', 'Grace', 'Lily',
  'Aryan', 'Kabir', 'Dhruv', 'Reyansh', 'Arnav', 'Ved', 'Ayaan', 'Aditi',
  'Saanvi', 'Anika', 'Myra', 'Navya', 'Aanya', 'Ira', 'Sara', 'Zara',
  'William', 'Thomas', 'Charles', 'Joseph', 'Richard', 'Mark', 'Steven', 'Paul',
  'Kevin', 'Brian', 'George', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey',
  'Mary', 'Patricia', 'Linda', 'Barbara', 'Susan', 'Margaret', 'Dorothy', 'Beth',
  'Laura', 'Karen', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth', 'Sharon',
  'Mohammed', 'Ahmed', 'Omar', 'Yusuf', 'Ali', 'Hassan', 'Ibrahim', 'Khalid',
  'Fatima', 'Aisha', 'Maryam', 'Zainab', 'Hooria', 'Khadija', 'Sara', 'Layla',
  'Ravi', 'Kiran', 'Sanjay', 'Vijay', 'Anil', 'Mohan', 'Raj', 'Vikram',
  'Lakshmi', 'Geeta', 'Sita', 'Radha', 'Anjali', 'Bhavya', 'Charvi', 'Disha',
  'Alexander', 'Benjamin', 'Henry', 'Nathan', 'Samuel', 'Dylan', 'Owen', 'Lucas',
  'Isabella', 'Charlotte', 'Amelia', 'Mia', 'Harper', 'Evelyn', 'Abigail', 'Ella',
  'Wei', 'Jun', 'Hao', 'Min', 'Feng', 'Chen', 'Ling', 'Mei',
  'Yuki', 'Haruto', 'Sora', 'Ren', 'Aoi', 'Hina', 'Sakura', 'Kaito',
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Reddy', 'Nair',
  'Iyer', 'Menon', 'Joshi', 'Rao', 'Das', 'Bose', 'Khan', 'Sheikh',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
  'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen',
  'Mehta', 'Agarwal', 'Bansal', 'Chopra', 'Malhotra', 'Kapoor', 'Khanna', 'Sethi',
  'Naidu', 'Pillai', 'Shetty', 'Desai', 'Kulkarni', 'Pawar', 'Jain', 'Shah',
  'Al', 'Rashid', 'Mansoor', 'Farooq', 'Qureshi', 'Malik', 'Ansari', 'Baig',
  'Tanaka', 'Suzuki', 'Sato', 'Watanabe', 'Ito', 'Nakamura', 'Kobayashi', 'Yamamoto',
  'Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao',
  'Kim', 'Park', 'Choi', 'Jung', 'Kang', 'Lim', 'Shin', 'Han',
  'O\'Brien', 'Murphy', 'Walsh', 'Kelly', 'Sullivan', 'O\'Neill', 'Byrne', 'Daly',
  'Patel', 'Shah', 'Desai', 'Mehta', 'Khan', 'Singh', 'Reddy', 'Nair',
];

const DEPARTMENTS = ['ENGINEER', 'MANAGER', 'DIRECTOR', 'VP', 'CEO'] as const;
const COUNTRIES = ['INDIA', 'USA', 'DUBAI', 'UK', 'CANADA'] as const;

const TOTAL_EMPLOYEES = 10_000;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateBetween(start: Date, end: Date): Date {
  const ms = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(ms);
}

function randomPhoneNumber(): string {
  const n = () => Math.floor(Math.random() * 10);
  return `+1${n()}${n()}${n()}${n()}${n()}${n()}${n()}${n()}${n()}${n()}`;
}

export async function seedEmployees(): Promise<void> {
  if (await Employees.count() > 0) return;

  const rows: Array<{
    first_name: string;
    last_name: string;
    email: string;
    date_of_birth: Date;
    phone_number: string;
    joined_date: Date;
    resigned_at: Date | null;
    department: string;
    country: string;
    is_active: boolean;
  }> = [];

  const usedEmails = new Set<string>();

  for (let i = 0; i < TOTAL_EMPLOYEES; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);

    // Ensure unique emails by appending an index.
    let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    while (usedEmails.has(email)) {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}_${Math.random().toString(36).slice(2, 6)}@example.com`;
    }
    usedEmails.add(email);

    const isActive = Math.random() > 0.08; // ~92% active
    const joinedDate = randomDateBetween(new Date(2015, 0, 1), new Date(2025, 10, 30));

    rows.push({
      first_name: firstName,
      last_name: lastName,
      email,
      date_of_birth: randomDateBetween(new Date(1970, 0, 1), new Date(2002, 11, 31)),
      phone_number: randomPhoneNumber(),
      joined_date: joinedDate,
      resigned_at: isActive ? null : randomDateBetween(joinedDate, new Date(2025, 10, 30)),
      department: pick(DEPARTMENTS),
      country: pick(COUNTRIES),
      is_active: isActive,
    });
  }

  await Employees.bulkCreate(rows);
}
