/**
 * Sample data for the UI. Each export mirrors a future API resource
 * (GET /api/<resource>) backed by a Prisma model of the same shape.
 */
import type { Category } from '@/lib/pricing';

export const TODAY = '12 Nov 2026';

/* ───────────── Collection centers ───────────── */

export type Region = 'North Central' | 'North Western' | 'Central' | 'Eastern' | 'Uva';
export const regions: Region[] = ['North Central', 'North Western', 'Central', 'Eastern', 'Uva'];

export interface Center {
  id: string;
  name: string;
  region: Region;
  district: string;
  gps: string;
  capacity: number;
  chillers: number;
  hours: string;
  fms: string[];
  farmers: number;
  todayLitres: number;
  fat: number;
  snf: number;
  rejected: number;
  status: 'Open' | 'Closed' | 'Over capacity' | 'Quality alert';
  supervisor: string;
  x: number;
  y: number;
}

export const centers: Center[] = [
  { id: 'CC-HNG', name: 'Hingurakgoda CC', region: 'North Central', district: 'Polonnaruwa', gps: '8.0412, 80.9512', capacity: 22000, chillers: 2, hours: '05:30–09:00 · 16:00–19:00', fms: ['Yaya 1', 'Yaya 3', 'Yaya 4'], farmers: 1204, todayLitres: 18420, fat: 3.81, snf: 8.32, rejected: 410, status: 'Quality alert', supervisor: 'K. Dissanayake', x: 62, y: 30 },
  { id: 'CC-KUR', name: 'Kurunegala CC', region: 'North Western', district: 'Kurunegala', gps: '7.4863, 80.3647', capacity: 18000, chillers: 2, hours: '05:30–09:00 · 16:00–19:00', fms: ['Wariyapola', 'Mawathagama'], farmers: 986, todayLitres: 15960, fat: 3.95, snf: 8.44, rejected: 120, status: 'Open', supervisor: 'P. Wickrama', x: 22, y: 58 },
  { id: 'CC-NUW', name: 'Nuwara Eliya CC', region: 'Central', district: 'Nuwara Eliya', gps: '6.9497, 80.7891', capacity: 16000, chillers: 1, hours: '06:00–09:30', fms: ['Ambewela', 'Pattipola'], farmers: 842, todayLitres: 14210, fat: 4.1, snf: 8.61, rejected: 0, status: 'Closed', supervisor: 'S. Herath', x: 48, y: 78 },
  { id: 'CC-ANU', name: 'Anuradhapura CC', region: 'North Central', district: 'Anuradhapura', gps: '8.3114, 80.4037', capacity: 20000, chillers: 2, hours: '05:30–09:00 · 16:00–19:00', fms: ['Thambuttegama', 'Galnewa'], farmers: 1118, todayLitres: 17035, fat: 3.88, snf: 8.37, rejected: 260, status: 'Open', supervisor: 'R. Abeysekara', x: 30, y: 16 },
  { id: 'CC-AMP', name: 'Ampara CC', region: 'Eastern', district: 'Ampara', gps: '7.2975, 81.6820', capacity: 11000, chillers: 1, hours: '05:30–09:00', fms: ['Uhana', 'Damana'], farmers: 764, todayLitres: 11880, fat: 3.79, snf: 8.29, rejected: 95, status: 'Over capacity', supervisor: 'M. Ismail', x: 86, y: 62 },
  { id: 'CC-BAD', name: 'Badulla CC', region: 'Uva', district: 'Badulla', gps: '6.9934, 81.0550', capacity: 9000, chillers: 1, hours: '06:00–09:30', fms: ['Welimada', 'Bandarawela'], farmers: 512, todayLitres: 7420, fat: 4.02, snf: 8.52, rejected: 40, status: 'Open', supervisor: 'T. Karunaratne', x: 66, y: 82 },
];

export const centerById = (id: string) => centers.find((c) => c.id === id)!;

/* ───────────── Farmers ───────────── */

export interface Farmer {
  id: string;
  name: string;
  fullName: string;
  nic: string;
  mobile: string;
  centerId: string;
  center: string;
  region: Region;
  route: string;
  category: Category;
  status: 'Active' | 'Pending' | 'Suspended';
  milkingCows: number;
  totalCattle: number;
  avgLitres: number;
  capacity: number;
  fat: number;
  snf: number;
  qualityScore: number;
  reliability: number;
  contractEnd: string;
  contractStatus: 'Valid' | 'Expiring' | 'Expired';
  erpVendor: string | null;
  since: number;
  balance: number;
  landAcres: number;
  breed: string;
  gps: string;
  bank: string;
  address: string;
  language: 'Sinhala' | 'Tamil' | 'English';
}

type FarmerSeed = [
  id: string, name: string, fullName: string, centerId: string, route: string, category: Category,
  milking: number, avgLitres: number, fat: number, snf: number, score: number, reliability: number,
  contractEnd: string, contractStatus: Farmer['contractStatus'], erpVendor: string | null, since: number,
  address: string, language: Farmer['language'], status?: Farmer['status'],
];

const seeds: FarmerSeed[] = [
  ['MF-004812', 'W. M. Sunil Bandara', 'Wijesinghe Mudiyanselage Sunil Bandara', 'CC-HNG', 'R-07', 'Gold', 9, 86.4, 4.12, 8.58, 92, 98, '31 Mar 2027', 'Valid', 'V-10482', 2014, 'No. 42, Yaya 4, Hingurakgoda', 'Sinhala'],
  ['MF-004813', 'K. Chandrika Kumari', 'Kumarage Chandrika Kumari', 'CC-HNG', 'R-07', 'Silver', 5, 41.0, 3.92, 8.4, 84, 95, '28 Nov 2026', 'Expiring', 'V-10483', 2017, 'Yaya 3, Hingurakgoda', 'Sinhala'],
  ['MF-007120', 'R. Sivakumar', 'Rasaiah Sivakumar', 'CC-AMP', 'R-21', 'Standard', 3, 22.5, 3.79, 8.29, 71, 88, '30 Jun 2027', 'Valid', 'V-11930', 2019, 'Uhana Road, Ampara', 'Tamil'],
  ['MF-002931', 'H. P. Jayasinghe', 'Herath Pedige Jayasinghe', 'CC-NUW', 'R-11', 'Platinum', 22, 240.8, 4.31, 8.66, 96, 99, '31 Jan 2028', 'Valid', 'V-10021', 2009, 'Ambewela Farm Road, Nuwara Eliya', 'Sinhala'],
  ['MF-005544', 'A. M. Fathima Rizna', 'Abdul Majeed Fathima Rizna', 'CC-KUR', 'R-03', 'Silver', 6, 48.2, 3.96, 8.42, 80, 91, '30 Sep 2027', 'Valid', 'V-10877', 2018, 'Wariyapola, Kurunegala', 'Tamil'],
  ['MF-006001', 'D. Nimal Rathnayake', 'Dissanayake Nimal Rathnayake', 'CC-ANU', 'R-14', 'Standard', 4, 29.9, 3.61, 8.12, 63, 79, '02 Nov 2026', 'Expired', 'V-11204', 2016, 'Galnewa, Anuradhapura', 'Sinhala'],
  ['MF-008410', 'S. Tharshini', 'Sivanesan Tharshini', 'CC-AMP', 'R-21', 'Standard', 2, 14.6, 3.84, 8.33, 77, 93, '31 Aug 2027', 'Valid', null, 2026, 'Damana, Ampara', 'Tamil', 'Pending'],
  ['MF-003377', 'G. Lalith Premasiri', 'Gamage Lalith Premasiri', 'CC-KUR', 'R-03', 'Gold', 11, 102.3, 4.05, 8.52, 89, 97, '05 Dec 2026', 'Expiring', 'V-10302', 2012, 'Mawathagama, Kurunegala', 'Sinhala'],
  ['MF-004901', 'R. M. Piyasena', 'Rathnayake Mudiyanselage Piyasena', 'CC-HNG', 'R-07', 'Standard', 4, 31.0, 3.42, 8.05, 58, 82, '31 Jul 2027', 'Valid', 'V-10511', 2015, 'Yaya 1, Hingurakgoda', 'Sinhala', 'Suspended'],
  ['MF-009120', 'T. Karunaratne', 'Thilak Karunaratne', 'CC-BAD', 'R-18', 'Gold', 8, 74.5, 4.21, 8.61, 90, 96, '30 Apr 2027', 'Valid', 'V-12040', 2013, 'Welimada, Badulla', 'Sinhala'],
  ['MF-005678', 'N. Herath', 'Nilanthi Herath', 'CC-HNG', 'R-07', 'Silver', 4, 27.0, 3.71, 8.24, 74, 90, '15 Feb 2027', 'Valid', 'V-10555', 2020, 'Yaya 3, Hingurakgoda', 'Sinhala'],
  ['MF-006240', 'P. Dilani', 'Pathirana Dilani', 'CC-HNG', 'R-07', 'Standard', 3, 18.0, 3.88, 8.36, 0, 0, '—', 'Valid', null, 2026, 'Yaya 4, Hingurakgoda', 'Sinhala', 'Pending'],
];

export const farmers: Farmer[] = seeds.map((s, i) => {
  const [id, name, fullName, centerId, route, category, milking, avgLitres, fat, snf, score, reliability, contractEnd, contractStatus, erpVendor, since, address, language, status] = s;
  const c = centerById(centerId);
  return {
    id, name, fullName, centerId, center: c.name, region: c.region, route, category,
    status: status ?? 'Active',
    milkingCows: milking,
    totalCattle: milking + Math.ceil(milking * 0.6),
    avgLitres,
    capacity: Math.round(avgLitres * 1.15),
    fat, snf, qualityScore: score, reliability,
    contractEnd, contractStatus, erpVendor, since,
    balance: Math.round(avgLitres * 12 * 138),
    landAcres: Math.round((1 + milking * 0.3) * 10) / 10,
    breed: i % 3 === 0 ? 'Jersey cross' : i % 3 === 1 ? 'Friesian cross' : 'Sahiwal cross',
    gps: `${(7 + (i % 5) * 0.27).toFixed(4)}, ${(80.4 + (i % 7) * 0.18).toFixed(4)}`,
    bank: ['Bank of Ceylon ****4471', "People's Bank ****2290", 'HNB ****8812', 'Sampath ****0193'][i % 4],
    nic: `19${78 + (i % 20)}${String(10234567 + i * 7919).slice(0, 8)}`,
    mobile: `+94 7${(i % 8) + 1} ${String(234 + i * 37).padStart(3, '0')} ${String(5678 + i * 113).slice(0, 4)}`,
    address, language,
  };
});

export const farmerById = (id?: string) => farmers.find((f) => f.id === id);

/* ───────────── Deliveries (today) ───────────── */

export interface Delivery {
  id: string;
  time: string;
  shift: 'AM' | 'PM';
  farmerId: string;
  farmerName: string;
  litres: number;
  fat: number;
  snf: number;
  temp: number;
  alcohol: 'Pass' | 'Fail';
  adulteration: string;
  result: 'Accepted' | 'Rejected' | 'Flagged';
  by: string;
  value: number;
}

export const deliveries: Delivery[] = [
  { id: 'D-1012', time: '06:42', shift: 'AM', farmerId: 'MF-004812', farmerName: 'W. M. Sunil Bandara', litres: 44.0, fat: 4.1, snf: 8.6, temp: 6.8, alcohol: 'Pass', adulteration: 'None found', result: 'Accepted', by: 'Mobile · K.D.', value: 6710 },
  { id: 'D-1011', time: '06:40', shift: 'AM', farmerId: 'MF-004813', farmerName: 'K. Chandrika Kumari', litres: 20.5, fat: 3.92, snf: 8.4, temp: 7.4, alcohol: 'Pass', adulteration: 'None found', result: 'Accepted', by: 'Counter 1', value: 2900 },
  { id: 'D-1010', time: '06:38', shift: 'AM', farmerId: 'MF-004901', farmerName: 'R. M. Piyasena', litres: 31.0, fat: 2.85, snf: 7.62, temp: 9.1, alcohol: 'Pass', adulteration: 'Water', result: 'Rejected', by: 'Counter 2', value: 0 },
  { id: 'D-1009', time: '06:37', shift: 'AM', farmerId: 'MF-005678', farmerName: 'N. Herath', litres: 18.0, fat: 3.7, snf: 8.21, temp: 12.3, alcohol: 'Pass', adulteration: 'None found', result: 'Flagged', by: 'Counter 1', value: 2522 },
  { id: 'D-1008', time: '06:35', shift: 'AM', farmerId: 'MF-006240', farmerName: 'P. Dilani', litres: 16.5, fat: 3.88, snf: 8.36, temp: 6.1, alcohol: 'Pass', adulteration: 'None found', result: 'Accepted', by: 'Counter 2', value: 2302 },
  { id: 'D-1007', time: '06:33', shift: 'AM', farmerId: 'MF-005678', farmerName: 'N. Herath', litres: 12.0, fat: 3.55, snf: 8.1, temp: 8.0, alcohol: 'Fail', adulteration: 'None found', result: 'Rejected', by: 'Counter 1', value: 0 },
  { id: 'D-1006', time: '06:31', shift: 'AM', farmerId: 'MF-004812', farmerName: 'W. M. Sunil Bandara', litres: 2.5, fat: 4.05, snf: 8.55, temp: 7.0, alcohol: 'Pass', adulteration: 'None found', result: 'Accepted', by: 'Mobile · K.D.', value: 371 },
  { id: 'D-1005', time: '06:30', shift: 'AM', farmerId: 'SOC-0090', farmerName: 'Yaya Dairy Society (bulk)', litres: 612.0, fat: 3.79, snf: 8.3, temp: 5.2, alcohol: 'Pass', adulteration: 'None found', result: 'Accepted', by: 'Counter 3', value: 85374 },
];

/* ───────────── Collection trend (30 days, litres by region) ───────────── */

export const collectionTrend = Array.from({ length: 30 }, (_, i) => {
  const d = new Date(2026, 9, 14 + i);
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const wave = (k: number) => 1 + 0.06 * Math.sin((i + k) / 3) + 0.002 * i;
  return {
    date: label,
    'North Central': Math.round(35400 * wave(0)),
    'North Western': Math.round(15900 * wave(1)),
    Central: Math.round(14200 * wave(2)),
    Eastern: Math.round(11800 * wave(3)),
    Uva: Math.round(7400 * wave(4)),
    fat: Math.round((3.86 + 0.06 * Math.sin(i / 4)) * 100) / 100,
  };
});

/* ───────────── Tankers & routes ───────────── */

export interface RouteStop {
  name: string;
  litres?: number;
  status: 'Done' | 'Next' | 'Pending';
  eta?: string;
}

export interface Tanker {
  id: string;
  plate: string;
  capacity: number;
  driver: string;
  phone: string;
  route: string;
  departed: string;
  eta: string;
  loaded: number;
  temp: number;
  status: 'On time' | 'Delayed' | 'At plant' | 'Unassigned';
  delayMin?: number;
  x: number;
  y: number;
  stops: RouteStop[];
}

export const tankers: Tanker[] = [
  {
    id: 'TK-14', plate: 'NP-LK 4521', capacity: 10000, driver: 'M. Ajith Kumara', phone: '+94 77 410 2201', route: 'R-07', departed: '05:10', eta: '09:30', loaded: 6240, temp: 4.2, status: 'Delayed', delayMin: 45, x: 58, y: 36,
    stops: [
      { name: 'Yaya 1 FMS', litres: 1820, status: 'Done' },
      { name: 'Yaya 3 FMS', litres: 2410, status: 'Done' },
      { name: 'Yaya 4 FMS', litres: 2010, status: 'Done' },
      { name: 'Hingurakgoda CC', status: 'Next', eta: '08:05' },
      { name: 'Polonnaruwa plant', status: 'Pending', eta: '09:30' },
    ],
  },
  {
    id: 'TK-03', plate: 'NP-LH 2290', capacity: 12000, driver: 'S. Bandara', phone: '+94 71 882 1104', route: 'R-03', departed: '05:00', eta: '08:40', loaded: 11050, temp: 3.9, status: 'On time', x: 28, y: 54,
    stops: [
      { name: 'Wariyapola FMS', litres: 3120, status: 'Done' },
      { name: 'Mawathagama FMS', litres: 2860, status: 'Done' },
      { name: 'Kurunegala CC', litres: 5070, status: 'Done' },
      { name: 'Kurunegala plant', status: 'Next', eta: '08:40' },
    ],
  },
  {
    id: 'TK-11', plate: 'NC-KA 7713', capacity: 8000, driver: 'R. Fernando', phone: '+94 76 223 9087', route: 'R-11', departed: '05:30', eta: '08:55', loaded: 4880, temp: 4.0, status: 'On time', x: 45, y: 70,
    stops: [
      { name: 'Ambewela FMS', litres: 2440, status: 'Done' },
      { name: 'Pattipola FMS', litres: 2440, status: 'Done' },
      { name: 'Nuwara Eliya CC', status: 'Next', eta: '07:50' },
      { name: 'Ambewela plant', status: 'Pending', eta: '08:55' },
    ],
  },
  {
    id: 'TK-21', plate: 'EP-LJ 0418', capacity: 10000, driver: 'A. Rahuman', phone: '+94 75 610 4432', route: 'R-21', departed: '04:50', eta: 'Arrived', loaded: 9640, temp: 4.4, status: 'At plant', x: 82, y: 56,
    stops: [
      { name: 'Uhana FMS', litres: 3010, status: 'Done' },
      { name: 'Damana FMS', litres: 2750, status: 'Done' },
      { name: 'Ampara CC', litres: 3880, status: 'Done' },
      { name: 'Ampara plant', litres: 9640, status: 'Done' },
    ],
  },
  {
    id: 'TK-18', plate: 'UP-LC 3390', capacity: 6000, driver: 'K. Wijeratne', phone: '+94 70 145 6650', route: 'R-18', departed: '05:40', eta: '09:10', loaded: 2650, temp: 4.6, status: 'Delayed', delayMin: 32, x: 70, y: 76,
    stops: [
      { name: 'Welimada FMS', litres: 2650, status: 'Done' },
      { name: 'Bandarawela FMS', status: 'Next', eta: '07:55' },
      { name: 'Badulla CC', status: 'Pending', eta: '08:30' },
    ],
  },
  {
    id: 'TK-09', plate: 'NW-LB 6604', capacity: 6000, driver: '', phone: '', route: 'R-14', departed: '—', eta: '—', loaded: 0, temp: 0, status: 'Unassigned', x: 32, y: 22,
    stops: [
      { name: 'Thambuttegama FMS', status: 'Pending' },
      { name: 'Galnewa FMS', status: 'Pending' },
      { name: 'Anuradhapura CC', status: 'Pending' },
    ],
  },
];

export const routes = [
  { id: 'R-03', name: 'Kurunegala North', centerId: 'CC-KUR', stops: 3, distanceKm: 64, farmers: 612, tanker: 'NP-LH 2290' },
  { id: 'R-07', name: 'Yaya 1–6', centerId: 'CC-HNG', stops: 4, distanceKm: 48, farmers: 845, tanker: 'NP-LK 4521' },
  { id: 'R-11', name: 'Ambewela – Pattipola', centerId: 'CC-NUW', stops: 3, distanceKm: 37, farmers: 520, tanker: 'NC-KA 7713' },
  { id: 'R-14', name: 'Anuradhapura West', centerId: 'CC-ANU', stops: 3, distanceKm: 71, farmers: 704, tanker: '—' },
  { id: 'R-18', name: 'Welimada – Badulla', centerId: 'CC-BAD', stops: 3, distanceKm: 52, farmers: 388, tanker: 'UP-LC 3390' },
  { id: 'R-21', name: 'Uhana – Damana', centerId: 'CC-AMP', stops: 3, distanceKm: 58, farmers: 541, tanker: 'EP-LJ 0418' },
];

/* ───────────── Contracts ───────────── */

export interface Contract {
  id: string;
  party: string;
  farmerId?: string;
  type: 'Individual' | 'Society';
  template: string;
  category: Category;
  validFrom: string;
  validTo: string;
  status: 'Active' | 'Expiring' | 'Expired' | 'Draft';
  minLitres: number;
}

export const contracts: Contract[] = [
  { id: 'CT-2026-0412', party: 'W. M. Sunil Bandara', farmerId: 'MF-004812', type: 'Individual', template: 'Gold · North Central 2026', category: 'Gold', validFrom: '01 Apr 2026', validTo: '31 Mar 2027', status: 'Active', minLitres: 60 },
  { id: 'CT-2026-0388', party: 'K. Chandrika Kumari', farmerId: 'MF-004813', type: 'Individual', template: 'Silver · North Central 2026', category: 'Silver', validFrom: '29 Nov 2025', validTo: '28 Nov 2026', status: 'Expiring', minLitres: 30 },
  { id: 'CT-2025-1902', party: 'D. Nimal Rathnayake', farmerId: 'MF-006001', type: 'Individual', template: 'Standard · North Central 2025', category: 'Standard', validFrom: '03 Nov 2025', validTo: '02 Nov 2026', status: 'Expired', minLitres: 20 },
  { id: 'CT-2026-0090', party: 'Yaya Dairy Society (42 farmers)', type: 'Society', template: 'Society bulk · 2026', category: 'Silver', validFrom: '01 Jan 2026', validTo: '31 Dec 2027', status: 'Active', minLitres: 550 },
  { id: 'CT-2026-0501', party: 'H. P. Jayasinghe', farmerId: 'MF-002931', type: 'Individual', template: 'Platinum · Central 2026', category: 'Platinum', validFrom: '01 Feb 2026', validTo: '31 Jan 2028', status: 'Active', minLitres: 180 },
  { id: 'CT-2026-0533', party: 'P. Dilani', farmerId: 'MF-006240', type: 'Individual', template: 'Standard · North Central 2026', category: 'Standard', validFrom: '—', validTo: '—', status: 'Draft', minLitres: 15 },
  { id: 'CT-2026-0377', party: 'G. Lalith Premasiri', farmerId: 'MF-003377', type: 'Individual', template: 'Gold · North Western 2026', category: 'Gold', validFrom: '06 Dec 2025', validTo: '05 Dec 2026', status: 'Expiring', minLitres: 80 },
];

export const contractRules = [
  { rule: 'Category premium', condition: 'All accepted litres', amount: '+ Rs 4.00 / L', source: 'Category' },
  { rule: 'Chilled milk bonus', condition: 'Temperature ≤ 8 °C at receipt', amount: '+ Rs 2.50 / L', source: 'Contract' },
  { rule: 'Volume slab', condition: 'More than 1,500 L in the period', amount: '+ Rs 1.50 / L', source: 'Incentive scheme' },
  { rule: 'Late delivery', condition: 'After center cut-off time', amount: '− Rs 3.00 / L', source: 'Contract' },
  { rule: 'Transport charge', condition: 'Route R-07', amount: '− Rs 1.00 / L', source: 'Route' },
];

/* ───────────── Quality exceptions & disputes ───────────── */

export interface ExceptionItem {
  id: string;
  date: string;
  center: string;
  subject: string;
  type: 'Rejected' | 'Quality' | 'Quantity';
  detail: string;
  litres: number;
  action: string;
  status: 'Open' | 'Closed' | 'Disputed';
}

export const exceptions: ExceptionItem[] = [
  { id: 'EX-26-11-0418', date: '12 Nov', center: 'Hingurakgoda CC', subject: 'MF-004901 R. M. Piyasena', type: 'Rejected', detail: 'FAT 2.85, SNF 7.62, water suspected', litres: 31, action: 'Returned to farmer, SMS sent', status: 'Disputed' },
  { id: 'EX-26-11-0417', date: '12 Nov', center: 'Hingurakgoda CC', subject: 'MF-005678 N. Herath', type: 'Rejected', detail: 'Alcohol test failed', litres: 12, action: 'Discarded', status: 'Closed' },
  { id: 'EX-26-11-0409', date: '12 Nov', center: 'Hingurakgoda CC', subject: 'MF-005678 N. Herath', type: 'Quality', detail: 'Temperature 12.3 °C at receipt', litres: 18, action: 'Accepted without chill bonus', status: 'Closed' },
  { id: 'EX-26-11-0388', date: '11 Nov', center: 'Plant intake', subject: 'Tanker NP-LH 2290', type: 'Quantity', detail: 'Plant weight 142 L below loaded quantity', litres: 142, action: 'Investigation opened', status: 'Open' },
  { id: 'EX-26-11-0371', date: '10 Nov', center: 'Ampara CC', subject: 'MF-007120 R. Sivakumar', type: 'Quality', detail: 'SNF 7.84, below contract band', litres: 22.5, action: 'Paid at lower band', status: 'Closed' },
  { id: 'EX-26-11-0355', date: '10 Nov', center: 'Anuradhapura CC', subject: 'MF-006001 D. Nimal Rathnayake', type: 'Rejected', detail: 'Starch detected', litres: 26, action: 'Returned, field officer visit booked', status: 'Open' },
];

export interface Dispute {
  id: string;
  farmer: string;
  farmerId: string;
  /** Dispute = disagreement about a delivery or payment amount. Complaint = service issue (pickup, staff, equipment). */
  kind?: 'Dispute' | 'Complaint';
  category: 'Quality' | 'Payment' | 'Delivery' | 'Service';
  raised: string;
  owner: string;
  slaHours: number;
  status: 'New' | 'Investigating' | 'Waiting farmer' | 'In approval' | 'Retest booked' | 'Resolved';
  summary: string;
  value: number;
  linked: string;
  /** Number of photos / documents attached */
  attachments?: number;
  timeline: { time: string; who: string; text: string }[];
}

export const disputes: Dispute[] = [
  {
    id: 'DSP-2026-0318', farmer: 'R. M. Piyasena', farmerId: 'MF-004901', category: 'Quality', raised: '12 Nov', owner: 'QA · L. Silva', slaHours: -6, status: 'Investigating', value: 3968, linked: 'EX-26-11-0418',
    summary: 'Farmer says the 31 L delivered on 12 Nov (morning) was not watered and asks for a retest of the retained sample.',
    timeline: [
      { time: '12 Nov 06:38', who: 'Counter 2', text: 'Delivery rejected: FAT 2.85, SNF 7.62, low density.' },
      { time: '12 Nov 08:10', who: 'Farmer portal', text: 'Dispute raised with a photo of the can.' },
      { time: '12 Nov 09:02', who: 'QA officer', text: 'Retained sample found. Lab retest requested.' },
    ],
  },
  {
    id: 'DSP-2026-0315', farmer: 'K. Chandrika Kumari', farmerId: 'MF-004813', category: 'Payment', raised: '11 Nov', owner: 'Finance · R. Peiris', slaHours: 41, status: 'Waiting farmer', value: 2150, linked: 'PR-2026-10B',
    summary: 'Chill bonus missing for 6 deliveries in the 16–31 Oct period.',
    timeline: [
      { time: '11 Nov 10:20', who: 'Call center', text: 'Complaint logged by phone.' },
      { time: '11 Nov 14:05', who: 'Finance', text: 'Temperatures checked: 4 of 6 were above 8 °C. Asked farmer to confirm dates.' },
    ],
  },
  {
    id: 'DSP-2026-0311', farmer: 'Yaya Dairy Society', farmerId: 'SOC-0090', category: 'Delivery', raised: '10 Nov', owner: 'Logistics · S. Jaya', slaHours: 18, status: 'In approval', value: 18400, linked: 'EX-26-11-0388',
    summary: 'Society claims 142 L short-weighed between pickup and plant intake.',
    timeline: [
      { time: '10 Nov 09:40', who: 'Society secretary', text: 'Dispute raised at Hingurakgoda CC.' },
      { time: '11 Nov 11:15', who: 'Logistics', text: 'Tanker valve leak confirmed. Credit of Rs 18,400 proposed.' },
    ],
  },
  {
    id: 'DSP-2026-0307', farmer: 'S. Tharshini', farmerId: 'MF-008410', category: 'Payment', raised: '09 Nov', owner: 'Finance · R. Peiris', slaHours: 52, status: 'Investigating', value: 28908, linked: 'PR-2026-11A',
    summary: 'Payment held because no ERP vendor exists for the farmer.',
    timeline: [{ time: '09 Nov 16:00', who: 'Field officer', text: 'Raised on behalf of the farmer.' }],
  },
  {
    id: 'DSP-2026-0302', farmer: 'N. Herath', farmerId: 'MF-005678', category: 'Quality', raised: '08 Nov', owner: 'QA · L. Silva', slaHours: 30, status: 'Retest booked', value: 1702, linked: 'EX-26-11-0417',
    summary: 'Farmer disputes the alcohol test failure.',
    timeline: [{ time: '08 Nov 07:30', who: 'Farmer portal', text: 'Dispute raised.' }],
  },
  {
    id: 'DSP-2026-0309', farmer: 'W. M. Sunil Bandara', farmerId: 'MF-004812', category: 'Payment', raised: '09 Nov', owner: 'Finance · R. Peiris', slaHours: 20, status: 'In approval', value: 6450, linked: 'PR-2026-10B',
    summary: 'Gold category premium (Rs 5 / L) was not applied for 16–31 Oct; the farmer asks for the difference on 1,290 L.',
    timeline: [
      { time: '09 Nov 10:12', who: 'Farmer portal', text: 'Dispute raised with the payment slip.' },
      { time: '10 Nov 14:30', who: 'Finance', text: 'Confirmed: category upgrade was approved on 15 Oct but the price template was not updated.' },
      { time: '11 Nov 09:05', who: 'Finance', text: 'Adjustment of Rs 6,450 sent to the Regional Manager for approval.' },
    ],
  },
  {
    id: 'DSP-2026-0244', farmer: 'W. M. Sunil Bandara', farmerId: 'MF-004812', category: 'Quality', raised: '03 Oct', owner: 'QA · L. Silva', slaHours: 0, status: 'Resolved', value: 2380, linked: 'EX-26-10-0122',
    summary: 'Evening delivery on 3 Oct rejected for a high SNF reading; the farmer disputed the result.',
    timeline: [
      { time: '03 Oct 17:20', who: 'Counter 1', text: 'Delivery rejected: SNF 9.4, analyser flagged.' },
      { time: '03 Oct 18:05', who: 'Field officer', text: 'Dispute raised on behalf of the farmer.' },
      { time: '04 Oct 11:40', who: 'QA officer', text: 'Analyser calibration error found on Counter 1. Rejection reversed.' },
      { time: '05 Oct 08:00', who: 'Finance', text: 'Rs 2,380 paid in the 1–15 Oct run. Closed.' },
    ],
  },
];

/* ───────────── Payment run ───────────── */

export interface PaymentLine {
  farmerId: string;
  name: string;
  category: Category;
  litres: number;
  fat: number;
  snf: number;
  milkValue: number;
  premium: number;
  chillBonus: number;
  loyalty: number;
  seasonal: number;
  transport: number;
  feed: number;
  cans: number;
  vet: number;
  loans: number;
  advances: number;
  status: 'Ready' | 'Disputed' | 'Below zero' | 'No ERP vendor' | 'On hold';
}

export const incentiveTotal = (l: PaymentLine) => l.premium + l.chillBonus + l.loyalty + l.seasonal;
export const deductionTotal = (l: PaymentLine) => l.transport + l.feed + l.cans + l.vet + l.loans + l.advances;
export const netOf = (l: PaymentLine) => l.milkValue + incentiveTotal(l) - deductionTotal(l);

export const paymentLines: PaymentLine[] = [
  { farmerId: 'MF-004812', name: 'W. M. Sunil Bandara', category: 'Gold', litres: 1296, fat: 4.12, snf: 8.58, milkValue: 184032, premium: 5184, chillBonus: 2950, loyalty: 1500, seasonal: 0, transport: 1296, feed: 6000, cans: 1900, vet: 0, loans: 0, advances: 5000, status: 'Ready' },
  { farmerId: 'MF-004813', name: 'K. Chandrika Kumari', category: 'Silver', litres: 615, fat: 3.92, snf: 8.4, milkValue: 84870, premium: 1230, chillBonus: 0, loyalty: 0, seasonal: 0, transport: 615, feed: 3400, cans: 0, vet: 0, loans: 0, advances: 0, status: 'Disputed' },
  { farmerId: 'MF-007120', name: 'R. Sivakumar', category: 'Standard', litres: 337.5, fat: 3.79, snf: 8.29, milkValue: 44888, premium: 0, chillBonus: 0, loyalty: 0, seasonal: 0, transport: 338, feed: 9000, cans: 3000, vet: 0, loans: 10000, advances: 0, status: 'Ready' },
  { farmerId: 'MF-002931', name: 'H. P. Jayasinghe', category: 'Platinum', litres: 3612, fat: 4.31, snf: 8.66, milkValue: 527352, premium: 21672, chillBonus: 9030, loyalty: 1500, seasonal: 306, transport: 0, feed: 18500, cans: 0, vet: 0, loans: 0, advances: 0, status: 'Ready' },
  { farmerId: 'MF-006001', name: 'D. Nimal Rathnayake', category: 'Standard', litres: 448.5, fat: 3.61, snf: 8.12, milkValue: 59650, premium: 0, chillBonus: 0, loyalty: 0, seasonal: 0, transport: 449, feed: 42000, cans: 3800, vet: 2200, loans: 20000, advances: 0, status: 'Below zero' },
  { farmerId: 'MF-008410', name: 'S. Tharshini', category: 'Standard', litres: 219, fat: 3.84, snf: 8.33, milkValue: 29127, premium: 0, chillBonus: 0, loyalty: 0, seasonal: 0, transport: 219, feed: 0, cans: 0, vet: 0, loans: 0, advances: 0, status: 'No ERP vendor' },
  { farmerId: 'MF-003377', name: 'G. Lalith Premasiri', category: 'Gold', litres: 1534.5, fat: 4.05, snf: 8.52, milkValue: 217899, premium: 6138, chillBonus: 3104, loyalty: 1500, seasonal: 0, transport: 1535, feed: 6250, cans: 0, vet: 0, loans: 0, advances: 0, status: 'Ready' },
  { farmerId: 'MF-009120', name: 'T. Karunaratne', category: 'Gold', litres: 1117.5, fat: 4.21, snf: 8.61, milkValue: 163155, premium: 4470, chillBonus: 2794, loyalty: 1500, seasonal: 0, transport: 1118, feed: 0, cans: 1900, vet: 1250, loans: 0, advances: 0, status: 'Ready' },
  { farmerId: 'MF-005678', name: 'N. Herath', category: 'Silver', litres: 405, fat: 3.71, snf: 8.24, milkValue: 53865, premium: 810, chillBonus: 0, loyalty: 0, seasonal: 0, transport: 405, feed: 0, cans: 0, vet: 0, loans: 0, advances: 0, status: 'On hold' },
];

export const incentiveSchemes = [
  { name: 'Category premium (Silver to Platinum)', basis: 'Rs per litre by category', total: 8.9e6 },
  { name: 'Chilled milk bonus', basis: 'Rs 2.50 / L at ≤ 8 °C', total: 3.1e6 },
  { name: 'Loyalty bonus, 10+ years', basis: 'Rs 1,500 per period', total: 1.4e6 },
  { name: 'Yala season volume bonus', basis: 'Above 1,500 L in period', total: 0.8e6 },
];

/* ───────────── Approvals ───────────── */

export interface ApprovalStep {
  role: string;
  who: string;
  status: 'Submitted' | 'Approved' | 'Waiting' | 'Not started' | 'Rejected' | 'Returned';
  at?: string;
}

export interface Approval {
  id: string;
  type: 'Payment run' | 'Contract change' | 'Onboarding' | 'Advance' | 'Dispute' | 'Collection edit' | 'Write-off';
  title: string;
  summary: string;
  requestedBy: string;
  age: string;
  amount?: number;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Returned';
  link: string;
  details: [string, string][];
  chain: ApprovalStep[];
}

export const approvals: Approval[] = [
  {
    id: 'AP-0981', type: 'Payment run', title: 'PR-2026-11A · 1–15 Nov 2026', age: '2 h', amount: 363005050, status: 'Pending', link: '/payments', requestedBy: 'R. Peiris (Finance)',
    summary: 'Net Rs 363.0 M for 11,906 farmers. 18 farmers below zero are carried forward to the next period.',
    details: [['Farmers', '11,906'], ['Milk value', 'Rs 382,412,600'], ['Incentives', 'Rs 14,203,900'], ['Deductions', '−Rs 33,611,450'], ['Net payable', 'Rs 363,005,050'], ['Change vs previous period', '+3.8%']],
    chain: [
      { role: 'Prepared', who: 'R. Peiris, Finance officer', status: 'Submitted', at: '10:12' },
      { role: 'Level 1', who: 'Regional managers (3)', status: 'Approved', at: '11:40' },
      { role: 'Level 2', who: 'Finance manager', status: 'Waiting' },
      { role: 'Level 3', who: 'General manager (over Rs 250 M)', status: 'Not started' },
    ],
  },
  {
    id: 'AP-0979', type: 'Contract change', title: 'Gold template · North Central price update', age: '5 h', status: 'Pending', link: '/contracts', requestedBy: 'S. Jaya (Procurement)',
    summary: '+Rs 2.00 / L in FAT 4.0–4.49 bands from 16 Nov. Affects 2,940 Gold farmers.',
    details: [['Template', 'Gold · North Central 2026'], ['Change', '+Rs 2.00 / L, FAT 4.0–4.49'], ['Effective', '16 Nov 2026'], ['Estimated cost per period', 'Rs 1.9 M']],
    chain: [
      { role: 'Prepared', who: 'S. Jaya, Procurement', status: 'Submitted', at: '07:30' },
      { role: 'Level 1', who: 'Finance manager', status: 'Waiting' },
      { role: 'Level 2', who: 'General manager', status: 'Not started' },
    ],
  },
  {
    id: 'AP-0975', type: 'Onboarding', title: 'P. Dilani · Hingurakgoda CC', age: '1 d', status: 'Pending', link: '/onboarding', requestedBy: 'K. Dissanayake (Field officer)',
    summary: 'All documents verified and the first milk sample passed. Approval creates the ERP vendor record.',
    details: [['Farmer', 'P. Dilani (MF-006240)'], ['Center / route', 'Hingurakgoda CC · R-07'], ['Herd', '5 cattle, 3 milking'], ['Expected supply', '18 L / day']],
    chain: [
      { role: 'Prepared', who: 'K. Dissanayake, Field officer', status: 'Submitted', at: 'Yesterday 15:10' },
      { role: 'Level 1', who: 'Regional manager', status: 'Waiting' },
    ],
  },
  {
    id: 'AP-0972', type: 'Advance', title: 'Cash advance Rs 25,000 · MF-005544', age: '1 d', amount: 25000, status: 'Pending', link: '/farmers/MF-005544', requestedBy: 'Center manager, Kurunegala',
    summary: 'Recover over 5 periods. Farmer reliability 91%, no open advances.',
    details: [['Farmer', 'A. M. Fathima Rizna'], ['Amount', 'Rs 25,000'], ['Recovery', 'Rs 5,000 × 5 periods'], ['Category limit', 'Rs 25,000 (Silver)']],
    chain: [
      { role: 'Prepared', who: 'Center manager, Kurunegala', status: 'Submitted', at: 'Yesterday 11:02' },
      { role: 'Level 1', who: 'Regional manager', status: 'Waiting' },
    ],
  },
  {
    id: 'AP-0970', type: 'Dispute', title: 'DSP-2026-0311 · Yaya Dairy Society', age: '1 d', amount: 18400, status: 'Pending', link: '/quality', requestedBy: 'S. Jaya (Logistics)',
    summary: 'Proposed credit of Rs 18,400 for the short-weighed delivery on 10 Nov.',
    details: [['Dispute', 'DSP-2026-0311'], ['Credit', 'Rs 18,400'], ['Cause', 'Tanker valve leak, NP-LH 2290']],
    chain: [
      { role: 'Prepared', who: 'S. Jaya, Logistics', status: 'Submitted', at: 'Yesterday 11:15' },
      { role: 'Level 1', who: 'Finance manager', status: 'Waiting' },
    ],
  },
  {
    id: 'AP-0966', type: 'Collection edit', title: 'Edit after close · Ampara CC, 10 Nov PM', age: '2 d', status: 'Pending', link: '/collection', requestedBy: 'Center supervisor, Ampara',
    summary: 'Litres changed 22.5 → 25.0 for MF-007120. Scale ticket attached.',
    details: [['Farmer', 'R. Sivakumar (MF-007120)'], ['Before', '22.5 L'], ['After', '25.0 L'], ['Reason', 'Scale ticket mis-keyed']],
    chain: [
      { role: 'Prepared', who: 'Center supervisor, Ampara', status: 'Submitted', at: '10 Nov 19:40' },
      { role: 'Level 1', who: 'Regional manager', status: 'Waiting' },
    ],
  },
  {
    id: 'AP-0961', type: 'Write-off', title: 'Rejected milk write-off · week 45', age: '3 d', status: 'Pending', link: '/quality', requestedBy: 'QA · L. Silva',
    summary: '1,230 L of rejected milk across 6 centers. No payment to farmers.',
    details: [['Litres', '1,230 L'], ['Centers', '6'], ['Value to farmers', 'Rs 0']],
    chain: [
      { role: 'Prepared', who: 'L. Silva, QA', status: 'Submitted', at: '09 Nov 17:00' },
      { role: 'Level 1', who: 'Finance manager', status: 'Waiting' },
    ],
  },
];

/* ───────────── Users & roles ───────────── */

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  scope: string;
  signIn: 'SSO' | 'Password' | 'Mobile OTP';
  mfa: 'On' | 'Off' | 'OTP';
  device: string;
  lastActive: string;
  status: 'Active' | 'Invited' | 'Locked';
}

export const users: AppUser[] = [
  { id: 'U-001', name: 'Nadeesha Perera', email: 'n.perera@milco.lk', role: 'Finance manager', scope: 'All regions', signIn: 'SSO', mfa: 'On', device: '—', lastActive: '2 min ago', status: 'Active' },
  { id: 'U-002', name: 'Sampath Jayawardena', email: 's.jayawardena@milco.lk', role: 'Regional manager', scope: 'North Central', signIn: 'SSO', mfa: 'On', device: '—', lastActive: '1 h ago', status: 'Active' },
  { id: 'U-003', name: 'K. Dissanayake', email: 'k.dissanayake@milco.lk', role: 'Field officer', scope: 'Hingurakgoda CC', signIn: 'Mobile OTP', mfa: 'OTP', device: 'Samsung A15 · bound', lastActive: '06:42', status: 'Active' },
  { id: 'U-004', name: 'M. Ajith Kumara', email: '—', role: 'Tanker driver', scope: 'Route R-07', signIn: 'Mobile OTP', mfa: 'OTP', device: 'Redmi 13C · bound', lastActive: '09:20', status: 'Active' },
  { id: 'U-005', name: 'Lakmini Silva', email: 'l.silva@milco.lk', role: 'QA officer', scope: 'North Central', signIn: 'Password', mfa: 'Off', device: '—', lastActive: 'Yesterday', status: 'Invited' },
  { id: 'U-006', name: 'Ruwan Peiris', email: 'r.peiris@milco.lk', role: 'Finance officer', scope: 'All regions', signIn: 'Password', mfa: 'On', device: '—', lastActive: '3 days ago', status: 'Locked' },
  { id: 'U-007', name: 'Suresh Jaya', email: 's.jaya@milco.lk', role: 'Procurement officer', scope: 'All regions', signIn: 'SSO', mfa: 'On', device: '—', lastActive: '20 min ago', status: 'Active' },
  { id: 'U-008', name: 'Admin Service', email: 'it-admin@milco.lk', role: 'System admin', scope: 'All', signIn: 'SSO', mfa: 'On', device: '—', lastActive: 'Today', status: 'Active' },
];

export const permissionModules = [
  'Farmers & onboarding', 'Contracts & pricing', 'Daily collection', 'Centers & tankers', 'Quality exceptions',
  'Disputes', 'Payment runs', 'Deductions & advances', 'Reports', 'ERP connectors & mapping', 'Users & settings',
] as const;
export const permissionActions = ['View', 'Create', 'Edit', 'Delete', 'Approve', 'Export'] as const;
export type PermissionMatrix = Record<string, Record<string, boolean>>;

const matrix = (rows: string[]): PermissionMatrix =>
  Object.fromEntries(
    permissionModules.map((m, i) => [
      m,
      Object.fromEntries(permissionActions.map((a, j) => [a, rows[i]?.[j] === '1'])),
    ]),
  );

export const roles: { name: string; users: number; scope: string; limit: string; perms: PermissionMatrix }[] = [
  { name: 'System admin', users: 3, scope: 'All', limit: '—', perms: matrix(Array(11).fill('111101')) },
  { name: 'General manager', users: 2, scope: 'All regions', limit: 'No limit', perms: matrix(Array(11).fill('100011')) },
  { name: 'Finance manager', users: 4, scope: 'All regions', limit: 'Rs 250,000,000', perms: matrix(['100001', '100011', '100001', '100001', '100001', '111011', '111011', '111011', '100001', '100000', '000000']) },
  { name: 'Regional manager', users: 9, scope: 'Own region', limit: 'Rs 5,000,000', perms: matrix(['111011', '111011', '111011', '111001', '111011', '111011', '100011', '111011', '100001', '000000', '000000']) },
  { name: 'Center supervisor', users: 38, scope: 'Own center', limit: 'Rs 50,000', perms: matrix(['111000', '100000', '111010', '100000', '111000', '110000', '100000', '110000', '100001', '000000', '000000']) },
  { name: 'Field officer', users: 112, scope: 'Own routes', limit: '—', perms: matrix(['110000', '100000', '110000', '100000', '110000', '110000', '000000', '000000', '000000', '000000', '000000']) },
  { name: 'Tanker driver', users: 31, scope: 'Own route', limit: '—', perms: matrix(['000000', '000000', '100000', '100000', '000000', '000000', '000000', '000000', '000000', '000000', '000000']) },
  { name: 'QA officer', users: 8, scope: 'Own region', limit: '—', perms: matrix(['100000', '100000', '100000', '000000', '111011', '111011', '000000', '000000', '100001', '000000', '000000']) },
  { name: 'Auditor (read only)', users: 2, scope: 'All', limit: '—', perms: matrix(Array(11).fill('100001')) },
];

/* ───────────── ERP integration ───────────── */

export type ErpKey = 'odoo' | 'sapb1' | 's4hana';

export const erpSystems: { key: ErpKey; name: string; protocol: string; version: string; status: 'Active' | 'Inactive' | 'Not configured'; note: string }[] = [
  { key: 'odoo', name: 'Odoo', protocol: 'JSON-RPC / XML-RPC', version: '17.0 Enterprise', status: 'Inactive', note: 'Last test 02 Nov, passed' },
  { key: 'sapb1', name: 'SAP Business One', protocol: 'Service Layer (REST)', version: '10.0 FP 2405', status: 'Active', note: 'Last sync 09:42 · 3 errors today' },
  { key: 's4hana', name: 'SAP S/4HANA', protocol: 'OData v2 / v4', version: 'Cloud, public edition', status: 'Not configured', note: 'Set up now to switch later' },
];

export interface SyncObject {
  id: string;
  name: string;
  milco: string;
  direction: 'MILCO → ERP' | 'ERP → MILCO' | 'Both ways';
  when: string;
  enabled: boolean;
  target: Record<ErpKey, string>;
}

export const syncObjects: SyncObject[] = [
  { id: 'farmers', name: 'Farmers', milco: 'Approved farmer', direction: 'MILCO → ERP', when: 'On approval', enabled: true, target: { sapb1: 'Business Partner (Supplier)', odoo: 'res.partner (supplier_rank)', s4hana: 'Business Partner, supplier role' } },
  { id: 'items', name: 'Feed, vet drugs, cans', milco: 'Deduction item', direction: 'ERP → MILCO', when: 'Nightly 01:00', enabled: true, target: { sapb1: 'Items (OITM)', odoo: 'product.product', s4hana: 'Product master' } },
  { id: 'receipts', name: 'Milk receipts', milco: 'Accepted deliveries per farmer per day', direction: 'MILCO → ERP', when: 'On shift close', enabled: true, target: { sapb1: 'Goods Receipt PO (OPDN)', odoo: 'stock.picking (receipt)', s4hana: 'Goods movement 101' } },
  { id: 'bills', name: 'Farmer bills', milco: 'Approved payment run lines', direction: 'MILCO → ERP', when: 'On run approval', enabled: true, target: { sapb1: 'A/P Invoice (OPCH)', odoo: 'account.move (in_invoice)', s4hana: 'Supplier invoice API' } },
  { id: 'deductions', name: 'Deductions', milco: 'Loans, feed, cans, advances', direction: 'MILCO → ERP', when: 'On run approval', enabled: true, target: { sapb1: 'A/P Credit Memo (ORPC)', odoo: 'account.move (in_refund)', s4hana: 'Supplier credit memo' } },
  { id: 'payments', name: 'Payments', milco: 'Bank transfer confirmation', direction: 'Both ways', when: 'On bank file release', enabled: true, target: { sapb1: 'Outgoing Payment (OVPM)', odoo: 'account.payment', s4hana: 'Payment run (F110)' } },
  { id: 'centers', name: 'Collection centers', milco: 'Collection center', direction: 'ERP → MILCO', when: 'Nightly 01:00', enabled: false, target: { sapb1: 'Profit centers', odoo: 'account.analytic.account', s4hana: 'Profit center' } },
];

export interface FieldMap {
  milco: string;
  type: string;
  erp: string;
  transform: string;
  required: boolean;
  sample: string;
}

export const fieldMappings: Record<string, FieldMap[]> = {
  'Farmer → Business Partner': [
    { milco: 'farmer.code', type: 'Text', erp: 'CardCode', transform: 'Prefix "F-"', required: true, sample: 'F-MF-004812' },
    { milco: 'farmer.fullName', type: 'Text', erp: 'CardName', transform: 'None', required: true, sample: 'W. M. Sunil Bandara' },
    { milco: '(constant)', type: 'Text', erp: 'CardType', transform: 'Constant "cSupplier"', required: true, sample: 'cSupplier' },
    { milco: 'farmer.category', type: 'Enum', erp: 'GroupCode', transform: 'Lookup table', required: true, sample: 'Gold → 104' },
    { milco: 'farmer.nic', type: 'Text', erp: 'FederalTaxID', transform: 'None', required: false, sample: '198512345678' },
    { milco: 'farmer.mobile', type: 'Phone', erp: 'Cellular', transform: 'E.164 format', required: false, sample: '+94712345678' },
    { milco: 'farmer.bank.account', type: 'Text', erp: 'BPBankAccounts[0].AccountNo', transform: 'None', required: true, sample: '0071234471' },
    { milco: 'farmer.bank.branchCode', type: 'Text', erp: 'BPBankAccounts[0].BankCode', transform: 'Lookup table', required: true, sample: 'BOC-7010' },
    { milco: 'farmer.center.code', type: 'Ref', erp: 'U_MILCO_CC (UDF)', transform: 'None', required: false, sample: 'CC-HNG' },
    { milco: 'farmer.status', type: 'Enum', erp: 'Frozen', transform: 'Active → tNO', required: true, sample: 'tNO' },
  ],
  'Milk receipt → Goods Receipt PO': [
    { milco: 'receipt.farmer.code', type: 'Ref', erp: 'CardCode', transform: 'Prefix "F-"', required: true, sample: 'F-MF-004812' },
    { milco: 'receipt.date', type: 'Date', erp: 'DocDate', transform: 'yyyy-MM-dd', required: true, sample: '2026-11-12' },
    { milco: '(constant)', type: 'Text', erp: 'DocumentLines[0].ItemCode', transform: 'Constant "RM-MILK-RAW"', required: true, sample: 'RM-MILK-RAW' },
    { milco: 'receipt.litres', type: 'Number', erp: 'DocumentLines[0].Quantity', transform: 'None', required: true, sample: '44.0' },
    { milco: 'receipt.rate', type: 'Money', erp: 'DocumentLines[0].UnitPrice', transform: 'None', required: true, sample: '152.50' },
    { milco: 'receipt.center.code', type: 'Ref', erp: 'DocumentLines[0].WarehouseCode', transform: 'Lookup table', required: true, sample: 'WH-HNG' },
    { milco: 'receipt.fat', type: 'Number', erp: 'U_FAT (UDF)', transform: 'None', required: false, sample: '4.10' },
    { milco: 'receipt.snf', type: 'Number', erp: 'U_SNF (UDF)', transform: 'None', required: false, sample: '8.60' },
  ],
  'Payment line → A/P Invoice': [
    { milco: 'line.farmer.code', type: 'Ref', erp: 'CardCode', transform: 'Prefix "F-"', required: true, sample: 'F-MF-004812' },
    { milco: 'run.code', type: 'Text', erp: 'NumAtCard', transform: 'None', required: true, sample: 'PR-2026-11A' },
    { milco: 'line.milkValue', type: 'Money', erp: 'DocumentLines[0].LineTotal', transform: 'None', required: true, sample: '184032.00' },
    { milco: 'line.incentives', type: 'Money', erp: 'DocumentLines[1].LineTotal', transform: 'None', required: false, sample: '9634.00' },
    { milco: 'run.periodEnd', type: 'Date', erp: 'DocDueDate', transform: '+1 day', required: true, sample: '2026-11-16' },
  ],
};

export interface SyncLogEntry {
  id: string;
  time: string;
  direction: 'MILCO → ERP' | 'ERP → MILCO';
  record: string;
  object: string;
  doc: string;
  attempts: string;
  result: 'Posted' | 'Failed' | 'Retrying';
  message: string;
}

export const syncLog: SyncLogEntry[] = [
  { id: 'L-1', time: '09:42:10', direction: 'MILCO → ERP', record: 'PR-2026-11A/0412', object: 'A/P Invoice', doc: '—', attempts: '5 / 5', result: 'Failed', message: 'Business partner F-MF-008410 does not exist. Sync the farmer first.' },
  { id: 'L-2', time: '09:42:08', direction: 'MILCO → ERP', record: 'PR-2026-11A/0411', object: 'A/P Invoice', doc: '4500021901', attempts: '1', result: 'Posted', message: 'Created' },
  { id: 'L-3', time: '09:40:55', direction: 'MILCO → ERP', record: 'GRN-HNG-1112-AM', object: 'Goods Receipt PO', doc: '—', attempts: '2 / 5', result: 'Retrying', message: 'Service Layer timeout after 30 s. Next try at 09:45.' },
  { id: 'L-4', time: '09:31:02', direction: 'MILCO → ERP', record: 'FARMER MF-004998', object: 'Business Partner', doc: 'F-MF-004998', attempts: '1', result: 'Posted', message: 'Created' },
  { id: 'L-5', time: '08:15:44', direction: 'MILCO → ERP', record: 'DED-26-1188-03', object: 'A/P Credit Memo', doc: '—', attempts: '5 / 5', result: 'Failed', message: 'Posting period Nov-2026 is locked in SAP B1.' },
  { id: 'L-6', time: '07:02:19', direction: 'MILCO → ERP', record: 'GRN-KUR-1112-AM', object: 'Goods Receipt PO', doc: '3100008812', attempts: '1', result: 'Posted', message: 'Created, 986 lines' },
  { id: 'L-7', time: '01:00:31', direction: 'ERP → MILCO', record: 'Items (feed, vet, cans)', object: 'Items', doc: '214 records', attempts: '1', result: 'Posted', message: '6 new, 12 price updates' },
  { id: 'L-8', time: '01:00:12', direction: 'ERP → MILCO', record: 'Collection centers', object: 'Profit centers', doc: '146 records', attempts: '1', result: 'Posted', message: 'No changes' },
  { id: 'L-9', time: '00:58:40', direction: 'MILCO → ERP', record: 'DED-26-1190-01', object: 'A/P Credit Memo', doc: '—', attempts: '5 / 5', result: 'Failed', message: 'Item VD-OXY-100 is inactive in SAP B1.' },
];

/* ───────────── Topbar notifications & dashboard alerts ───────────── */

export const notifications = [
  { id: 'n1', title: 'Payment run PR-2026-11A is waiting for your approval', time: '2 h ago', unread: true, to: '/approvals' },
  { id: 'n2', title: '3 documents failed to post to SAP Business One', time: '09:42', unread: true, to: '/erp/sync' },
  { id: 'n3', title: 'Dispute DSP-2026-0318 is past its 72-hour target', time: '08:00', unread: true, to: '/quality' },
  { id: 'n4', title: 'Tanker NP-LK 4521 is 45 minutes late on route R-07', time: '07:50', unread: true, to: '/logistics' },
  { id: 'n5', title: '132 farmer contracts expire within 30 days', time: 'Yesterday', unread: false, to: '/contracts' },
];

export const alerts: { tone: 'danger' | 'warning' | 'info'; title: string; text: string; to: string }[] = [
  { tone: 'danger', title: 'Quality', text: 'Hingurakgoda CC: 6 cans failed the alcohol test this morning.', to: '/quality' },
  { tone: 'warning', title: 'Delay', text: 'Tanker NP-LK 4521 on route R-07 is 45 minutes behind schedule.', to: '/logistics' },
  { tone: 'warning', title: 'Contracts', text: '132 farmer contracts expire within 30 days.', to: '/contracts' },
  { tone: 'danger', title: 'ERP', text: '3 A/P documents failed to post to SAP B1.', to: '/erp/sync' },
  { tone: 'info', title: 'Disputes', text: '5 open disputes, 1 past its 72-hour response target.', to: '/quality' },
];

/* ───────────── Farmer detail extras ───────────── */

export const farmerDeductions = [
  { type: 'Cattle feed (on credit)', ref: 'FD-26-1188', total: 24000, perPeriod: 6000, outstanding: 12000, status: 'Recovering' },
  { type: 'Milk can (40 L)', ref: 'CN-26-0412', total: 9500, perPeriod: 1900, outstanding: 3800, status: 'Recovering' },
  { type: 'Vet drugs', ref: 'VD-26-0790', total: 3250, perPeriod: 3250, outstanding: 3250, status: 'Next period' },
  { type: 'Cash advance', ref: 'ADV-26-0201', total: 20000, perPeriod: 5000, outstanding: 5000, status: 'Approved' },
];

export const farmerPayments = [
  { period: '16–31 Oct 2026', litres: 1388, gross: 197640, deductions: 12904, net: 184736, erpDoc: '4500021877', paid: '01 Nov 2026' },
  { period: '1–15 Oct 2026', litres: 1302, gross: 184210, deductions: 12900, net: 171310, erpDoc: '4500020412', paid: '16 Oct 2026' },
  { period: '16–30 Sep 2026', litres: 1275, gross: 179880, deductions: 11000, net: 168880, erpDoc: '4500019008', paid: '01 Oct 2026' },
  { period: '1–15 Sep 2026', litres: 1240, gross: 174540, deductions: 11000, net: 163540, erpDoc: '4500017755', paid: '16 Sep 2026' },
];

export const farmerCompliance = [
  { item: 'Farm hygiene inspection', status: 'Passed', note: '02 Oct 2026 · next due Apr 2027' },
  { item: 'Veterinary registration', status: 'Valid', note: 'Valid to Jun 2027' },
  { item: 'Antibiotic withdrawal log', status: 'Valid', note: 'Up to date' },
  { item: 'Food safety training', status: 'Due', note: 'Due 30 Nov 2026' },
  { item: 'Water source test', status: 'Missing', note: 'Not uploaded' },
];

export const farmerDocuments = [
  { name: 'National ID (both sides).pdf', type: 'Identity', uploaded: '14 Feb 2024', status: 'Verified' },
  { name: 'Bank passbook.jpg', type: 'Bank', uploaded: '14 Feb 2024', status: 'Verified' },
  { name: 'Land lease agreement.pdf', type: 'Land', uploaded: '14 Feb 2024', status: 'Verified' },
  { name: 'Supply agreement CT-2026-0412.pdf', type: 'Contract', uploaded: '14 Oct 2026', status: 'Verified' },
  { name: 'Vet certificate 2026.pdf', type: 'Compliance', uploaded: '02 Jun 2026', status: 'Verified' },
];

export const farmerAudit = [
  { time: '12 Nov 06:42', text: 'Delivery of 44.0 L recorded by K. Dissanayake (mobile, Hingurakgoda CC)' },
  { time: '01 Nov 10:15', text: 'Category changed Silver → Gold by Regional Manager (approved)' },
  { time: '31 Oct 18:02', text: 'Payment Rs 184,736 posted to SAP B1 (document 4500021877)' },
  { time: '14 Oct 09:30', text: 'Contract CT-2026-0412 renewed to 31 Mar 2027' },
  { time: '02 Oct 11:20', text: 'Farm hygiene inspection passed (field officer K. Dissanayake)' },
];

/** 90 days of supply for one farmer, for the profile chart */
export const farmerSupplySeries = (avg: number, fat: number, snf: number) =>
  Array.from({ length: 45 }, (_, i) => {
    const d = new Date(2026, 8, 29 + i * 1);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      litres: Math.round(avg * (0.92 + 0.12 * Math.sin(i / 2.7)) * 10) / 10,
      fat: Math.round((fat + 0.08 * Math.sin(i / 3.3)) * 100) / 100,
      snf: Math.round((snf + 0.05 * Math.cos(i / 4.1)) * 100) / 100,
    };
  });
