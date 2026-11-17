/**
 * Master data: regions, farmer categories, plants, collection centers and routes.
 * Map to the future Prisma models of the same names.
 */
import { useMemo } from 'react';
import { createStore, useStore } from '@/lib/store';
import { centers as seedCenters } from '@/data/mock';

export type MasterStatus = 'Active' | 'Inactive';

export interface RegionMaster {
  code: string;
  name: string;
  districts: string[];
  manager: string;
  phone: string;
  centers: number;
  farmers: number;
  status: MasterStatus;
}

export interface CategoryMaster {
  code: string;
  name: string;
  /** Lower number = higher tier (shown first) */
  rank: number;
  description: string;
  minLitres: number;
  minScore: number;
  minReliability: number;
  maxRejections: number;
  /** Default premium used when creating a price template for this category */
  defaultPremium: number;
  maxAdvance: number;
  review: 'Monthly' | 'Quarterly' | 'Half-yearly' | 'Yearly';
  farmers: number;
  status: MasterStatus;
}

export const regionStore = createStore<RegionMaster[]>([
  { code: 'NC', name: 'North Central', districts: ['Anuradhapura', 'Polonnaruwa'], manager: 'R. Abeysekara', phone: '+94 25 222 1408', centers: 34, farmers: 5260, status: 'Active' },
  { code: 'NW', name: 'North Western', districts: ['Kurunegala', 'Puttalam'], manager: 'P. Wickrama', phone: '+94 37 222 3311', centers: 28, farmers: 4120, status: 'Active' },
  { code: 'CE', name: 'Central', districts: ['Kandy', 'Matale', 'Nuwara Eliya'], manager: 'S. Herath', phone: '+94 52 222 4410', centers: 31, farmers: 3980, status: 'Active' },
  { code: 'EA', name: 'Eastern', districts: ['Ampara', 'Batticaloa', 'Trincomalee'], manager: 'M. Ismail', phone: '+94 63 222 5520', centers: 22, farmers: 2210, status: 'Active' },
  { code: 'UV', name: 'Uva', districts: ['Badulla', 'Monaragala'], manager: 'T. Karunaratne', phone: '+94 55 222 6631', centers: 17, farmers: 1560, status: 'Active' },
  { code: 'SA', name: 'Sabaragamuwa', districts: ['Ratnapura', 'Kegalle'], manager: '', phone: '', centers: 0, farmers: 0, status: 'Inactive' },
]);

export const categoryStore = createStore<CategoryMaster[]>([
  { code: 'PLT', name: 'Platinum', rank: 1, description: 'Large, consistent, top-quality suppliers', minLitres: 150, minScore: 92, minReliability: 97, maxRejections: 0, defaultPremium: 6, maxAdvance: 100000, review: 'Quarterly', farmers: 412, status: 'Active' },
  { code: 'GLD', name: 'Gold', rank: 2, description: 'Reliable suppliers with high quality', minLitres: 60, minScore: 85, minReliability: 92, maxRejections: 1, defaultPremium: 4, maxAdvance: 50000, review: 'Quarterly', farmers: 2940, status: 'Active' },
  { code: 'SLV', name: 'Silver', rank: 3, description: 'Regular suppliers meeting standard quality', minLitres: 25, minScore: 75, minReliability: 85, maxRejections: 3, defaultPremium: 2, maxAdvance: 25000, review: 'Quarterly', farmers: 6118, status: 'Active' },
  { code: 'STD', name: 'Standard', rank: 4, description: 'All other active farmers, including new suppliers', minLitres: 0, minScore: 0, minReliability: 0, maxRejections: 99, defaultPremium: 0, maxAdvance: 10000, review: 'Quarterly', farmers: 8042, status: 'Active' },
]);

export const useRegionMaster = () => useStore(regionStore);
export const useCategoryMaster = () => useStore(categoryStore);

/** Active region names, for dropdowns. */
export function useRegionNames() {
  const all = useRegionMaster();
  return useMemo(() => all.filter((r) => r.status === 'Active').map((r) => r.name), [all]);
}

/** Active category names in tier order, for dropdowns. */
export function useCategoryNames() {
  const all = useCategoryMaster();
  return useMemo(
    () => all.filter((c) => c.status === 'Active').sort((a, b) => a.rank - b.rank).map((c) => c.name),
    [all],
  );
}

/* ───────────── Plants ───────────── */

/** A processing plant that routes deliver to. Maps to the future Prisma model Plant. */
export interface PlantMaster {
  code: string;
  name: string;
  region: string;
  district: string;
  address: string;
  gps: string;
  /** Intake capacity, litres per day */
  capacity: number;
  /** Milk reception window, e.g. 06:00–11:00 */
  intakeHours: string;
  manager: string;
  phone: string;
  status: MasterStatus;
}

export const plantStore = createStore<PlantMaster[]>([
  { code: 'PL-POL', name: 'Polonnaruwa plant', region: 'North Central', district: 'Polonnaruwa', address: 'Industrial Zone, Polonnaruwa', gps: '7.9403, 81.0188', capacity: 120000, intakeHours: '06:00–11:00 · 17:00–21:00', manager: 'N. Jayasuriya', phone: '+94 27 222 6610', status: 'Active' },
  { code: 'PL-KUR', name: 'Kurunegala plant', region: 'North Western', district: 'Kurunegala', address: 'Negombo Road, Kurunegala', gps: '7.4675, 80.3520', capacity: 90000, intakeHours: '06:00–11:00 · 17:00–21:00', manager: 'D. Rathnayake', phone: '+94 37 222 8820', status: 'Active' },
  { code: 'PL-AMB', name: 'Ambewela plant', region: 'Central', district: 'Nuwara Eliya', address: 'Ambewela Farm, Nuwara Eliya', gps: '6.8840, 80.8040', capacity: 60000, intakeHours: '06:30–11:30', manager: 'S. Bandara', phone: '+94 52 222 7745', status: 'Active' },
  { code: 'PL-ANU', name: 'Anuradhapura plant', region: 'North Central', district: 'Anuradhapura', address: 'Puttalam Road, Anuradhapura', gps: '8.3350, 80.3890', capacity: 80000, intakeHours: '06:00–11:00 · 17:00–21:00', manager: 'H. Perera', phone: '+94 25 222 9034', status: 'Active' },
  { code: 'PL-BAD', name: 'Badulla plant', region: 'Uva', district: 'Badulla', address: 'Bandarawela Road, Badulla', gps: '6.9850, 81.0490', capacity: 40000, intakeHours: '06:30–11:30', manager: 'A. Senanayake', phone: '+94 55 222 4471', status: 'Active' },
  { code: 'PL-AMP', name: 'Ampara plant', region: 'Eastern', district: 'Ampara', address: 'Inginiyagala Road, Ampara', gps: '7.2900, 81.6640', capacity: 50000, intakeHours: '06:00–11:00', manager: 'F. Rahman', phone: '+94 63 222 3392', status: 'Active' },
]);

export const usePlantMaster = () => useStore(plantStore);

/** Active plants, for dropdowns. */
export function useActivePlants() {
  const all = usePlantMaster();
  return useMemo(() => all.filter((p) => p.status === 'Active'), [all]);
}

export const plantName = (code: string) => plantStore.get().find((p) => p.code === code)?.name ?? code;

/* ───────────── Collection centers ───────────── */

/** A chilling/collection center fed by FMS pickup points. Maps to the future Prisma model CollectionCenter. */
export interface CenterMaster {
  code: string;
  name: string;
  region: string;
  district: string;
  gps: string;
  /** Chilling capacity in litres */
  capacity: number;
  chillers: number;
  /** Collection hours, e.g. 05:30–09:00 · 16:00–19:00 */
  hours: string;
  /** Farm milk stations (pickup points) that feed this center */
  fms: string[];
  supervisor: string;
  phone: string;
  /** Default plant code; pre-fills new routes */
  plant: string;
  farmers: number;
  status: MasterStatus;
}

const DEFAULT_PLANT: Record<string, string> = { 'CC-HNG': 'PL-POL', 'CC-KUR': 'PL-KUR', 'CC-NUW': 'PL-AMB', 'CC-ANU': 'PL-ANU', 'CC-AMP': 'PL-AMP', 'CC-BAD': 'PL-BAD' };

export const centerStore = createStore<CenterMaster[]>(
  seedCenters.map((c) => ({
    code: c.id,
    name: c.name,
    region: c.region,
    district: c.district,
    gps: c.gps,
    capacity: c.capacity,
    chillers: c.chillers,
    hours: c.hours,
    fms: [...c.fms],
    supervisor: c.supervisor,
    phone: '',
    plant: DEFAULT_PLANT[c.id] ?? '',
    farmers: c.farmers,
    status: 'Active' as MasterStatus,
  })),
);

export const useCenterMaster = () => useStore(centerStore);

/** Active centers, for dropdowns. */
export function useActiveCenters() {
  const all = useCenterMaster();
  return useMemo(() => all.filter((c) => c.status === 'Active'), [all]);
}

export const centerName = (code: string) => centerStore.get().find((c) => c.code === code)?.name ?? code;

/* ───────────── Collection routes ───────────── */

export type RouteShift = 'Morning' | 'Evening' | 'Both';
export const ROUTE_SHIFTS: RouteShift[] = ['Morning', 'Evening', 'Both'];

/** A fixed tanker run: FMS pickup points in order, ending at a plant. Maps to the future Prisma model Route. */
export interface RouteMaster {
  code: string;
  name: string;
  centerId: string;
  shift: RouteShift;
  /** HH:MM */
  departure: string;
  /** Planned arrival at the plant, HH:MM */
  arriveBy: string;
  /** Pickup points in driving order */
  stops: string[];
  /** Plant code the route delivers to */
  destination: string;
  distanceKm: number;
  /** Default tanker plate; '' = not assigned */
  tanker: string;
  farmers: number;
  status: MasterStatus;
}

export const routeStore = createStore<RouteMaster[]>([
  { code: 'R-03', name: 'Kurunegala North', centerId: 'CC-KUR', shift: 'Morning', departure: '05:00', arriveBy: '08:40', stops: ['Wariyapola FMS', 'Mawathagama FMS', 'Kurunegala CC'], destination: 'PL-KUR', distanceKm: 64, tanker: 'NP-LH 2290', farmers: 612, status: 'Active' },
  { code: 'R-07', name: 'Yaya 1–6', centerId: 'CC-HNG', shift: 'Morning', departure: '05:10', arriveBy: '08:45', stops: ['Yaya 1 FMS', 'Yaya 3 FMS', 'Yaya 4 FMS', 'Hingurakgoda CC'], destination: 'PL-POL', distanceKm: 48, tanker: 'NP-LK 4521', farmers: 845, status: 'Active' },
  { code: 'R-11', name: 'Ambewela – Pattipola', centerId: 'CC-NUW', shift: 'Morning', departure: '05:30', arriveBy: '08:55', stops: ['Ambewela FMS', 'Pattipola FMS', 'Nuwara Eliya CC'], destination: 'PL-AMB', distanceKm: 37, tanker: 'NC-KA 7713', farmers: 520, status: 'Active' },
  { code: 'R-14', name: 'Anuradhapura West', centerId: 'CC-ANU', shift: 'Morning', departure: '05:30', arriveBy: '09:00', stops: ['Thambuttegama FMS', 'Galnewa FMS', 'Anuradhapura CC'], destination: 'PL-ANU', distanceKm: 71, tanker: '', farmers: 704, status: 'Active' },
  { code: 'R-18', name: 'Welimada – Badulla', centerId: 'CC-BAD', shift: 'Morning', departure: '05:40', arriveBy: '08:40', stops: ['Welimada FMS', 'Bandarawela FMS', 'Badulla CC'], destination: 'PL-BAD', distanceKm: 52, tanker: 'UP-LC 3390', farmers: 388, status: 'Active' },
  { code: 'R-21', name: 'Uhana – Damana', centerId: 'CC-AMP', shift: 'Both', departure: '04:50', arriveBy: '08:30', stops: ['Uhana FMS', 'Damana FMS', 'Ampara CC'], destination: 'PL-AMP', distanceKm: 58, tanker: 'EP-LJ 0418', farmers: 541, status: 'Active' },
  { code: 'R-09', name: 'Mawathagama Evening', centerId: 'CC-KUR', shift: 'Evening', departure: '16:30', arriveBy: '19:30', stops: ['Mawathagama FMS', 'Kurunegala CC'], destination: 'PL-KUR', distanceKm: 22, tanker: '', farmers: 0, status: 'Inactive' },
]);

export const useRouteMaster = () => useStore(routeStore);

/** Active routes, for dropdowns. */
export function useActiveRoutes() {
  const all = useRouteMaster();
  return useMemo(() => all.filter((r) => r.status === 'Active'), [all]);
}
