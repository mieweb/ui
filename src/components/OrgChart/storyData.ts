import type { OrgChartNode } from './tree';

const person = (
  id: string,
  parentId: string | null,
  name: string,
  title: string,
  group?: string
): OrgChartNode => ({ id, parentId, name, title, group });

/** 25 people, 4 levels, 3 groups. */
export const orgPeople: OrgChartNode[] = [
  person('ceo', null, 'Avery Morgan', 'Chief Executive Officer'),
  person(
    'cto',
    'ceo',
    'Jordan Patel',
    'Chief Technology Officer',
    'Engineering'
  ),
  person('cro', 'ceo', 'Riley Chen', 'Chief Revenue Officer', 'Sales'),
  person(
    'coo',
    'ceo',
    'Samira Okafor',
    'Chief Operating Officer',
    'Operations'
  ),
  person(
    'eng-plat',
    'cto',
    'Diego Alvarez',
    'Director, Platform',
    'Engineering'
  ),
  person('eng-app', 'cto', 'Hana Kim', 'Director, Applications', 'Engineering'),
  person('eng-1', 'eng-plat', 'Noah Fischer', 'Staff Engineer', 'Engineering'),
  person('eng-2', 'eng-plat', 'Priya Raman', 'Senior Engineer', 'Engineering'),
  person(
    'eng-3',
    'eng-plat',
    'Liam O’Brien',
    'Site Reliability Engineer',
    'Engineering'
  ),
  person('eng-4', 'eng-app', 'Mei Tanaka', 'Senior Engineer', 'Engineering'),
  person('eng-5', 'eng-app', 'Omar Haddad', 'Engineer', 'Engineering'),
  person('eng-6', 'eng-app', 'Sofia Rossi', 'Product Designer', 'Engineering'),
  person('sales-na', 'cro', 'Marcus Reed', 'VP, North America', 'Sales'),
  person('sales-intl', 'cro', 'Elena Petrova', 'VP, International', 'Sales'),
  person('sales-1', 'sales-na', 'Grace Liu', 'Account Executive', 'Sales'),
  person('sales-2', 'sales-na', 'Tyler Brooks', 'Account Executive', 'Sales'),
  person('sales-3', 'sales-na', 'Aisha Bello', 'Sales Engineer', 'Sales'),
  person('sales-4', 'sales-intl', 'Lucas Martin', 'Account Executive', 'Sales'),
  person('sales-5', 'sales-intl', 'Yuki Sato', 'Partner Manager', 'Sales'),
  person(
    'ops-cx',
    'coo',
    'Daniel Novak',
    'Director, Customer Success',
    'Operations'
  ),
  person(
    'ops-impl',
    'coo',
    'Fatima Zahra',
    'Director, Implementation',
    'Operations'
  ),
  person(
    'ops-1',
    'ops-cx',
    'Chloe Dubois',
    'Customer Success Manager',
    'Operations'
  ),
  person('ops-2', 'ops-cx', 'Ethan Walker', 'Support Lead', 'Operations'),
  person(
    'ops-3',
    'ops-impl',
    'Isabel Cruz',
    'Implementation Manager',
    'Operations'
  ),
  person(
    'ops-4',
    'ops-impl',
    'Kwame Mensah',
    'Integration Specialist',
    'Operations'
  ),
];

/** A clinic network: network → regions → clinics. */
export const orgLocations: OrgChartNode[] = [
  {
    id: 'net',
    parentId: null,
    name: 'Lakeshore Occupational Health',
    subtitle: 'Network',
  },
  {
    id: 'r-north',
    parentId: 'net',
    name: 'North Region',
    subtitle: '4 clinics',
    group: 'North',
  },
  {
    id: 'r-south',
    parentId: 'net',
    name: 'South Region',
    subtitle: '3 clinics',
    group: 'South',
  },
  {
    id: 'r-west',
    parentId: 'net',
    name: 'West Region',
    subtitle: '3 clinics',
    group: 'West',
  },
  {
    id: 'c-1',
    parentId: 'r-north',
    name: 'Fort Wayne Clinic',
    subtitle: 'Fort Wayne, IN',
    group: 'North',
  },
  {
    id: 'c-2',
    parentId: 'r-north',
    name: 'South Bend Clinic',
    subtitle: 'South Bend, IN',
    group: 'North',
  },
  {
    id: 'c-3',
    parentId: 'r-north',
    name: 'Toledo Clinic',
    subtitle: 'Toledo, OH',
    group: 'North',
  },
  {
    id: 'c-4',
    parentId: 'r-north',
    name: 'Kalamazoo Clinic',
    subtitle: 'Kalamazoo, MI',
    group: 'North',
  },
  {
    id: 'c-5',
    parentId: 'r-south',
    name: 'Indianapolis Clinic',
    subtitle: 'Indianapolis, IN',
    group: 'South',
  },
  {
    id: 'c-6',
    parentId: 'r-south',
    name: 'Louisville Clinic',
    subtitle: 'Louisville, KY',
    group: 'South',
  },
  {
    id: 'c-7',
    parentId: 'r-south',
    name: 'Evansville Clinic',
    subtitle: 'Evansville, IN',
    group: 'South',
  },
  {
    id: 'c-8',
    parentId: 'r-west',
    name: 'Peoria Clinic',
    subtitle: 'Peoria, IL',
    group: 'West',
  },
  {
    id: 'c-9',
    parentId: 'r-west',
    name: 'Rockford Clinic',
    subtitle: 'Rockford, IL',
    group: 'West',
  },
  {
    id: 'c-10',
    parentId: 'r-west',
    name: 'Davenport Clinic',
    subtitle: 'Davenport, IA',
    group: 'West',
  },
];
