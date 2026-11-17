/**
 * Region master and farmer category master.
 * Map to the future Prisma models Region and FarmerCategory.
 */
import { useMemo } from 'react';
import { createStore, useStore } from '@/lib/store';

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

/* ───────────── Collection routes ───────────── */

export type RouteShift = 'Morning' | 'Evening' | 'Both';
export const ROUTE_SHIFTS: RouteShift[] = ['Morning', 'Evening', 'Both'];

/** Plants a route can deliver to. */
export const PLANTS = ['Polonnaruwa plant', 'Kurunegala plant', 'Ambewela plant', 'Anuradhapura plant', 'Badulla plant', 'Ampara plant'];

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
  destination: string;
  distanceKm: number;
  /** Default tanker plate; '' = not assigned */
  tanker: string;
  farmers: number;
  status: MasterStatus;
}

export const routeStore = createStore<RouteMaster[]>([
  { code: 'R-03', name: 'Kurunegala North', centerId: 'CC-KUR', shift: 'Morning', departure: '05:00', arriveBy: '08:40', stops: ['Wariyapola FMS', 'Mawathagama FMS', 'Kurunegala CC'], destination: 'Kurunegala plant', distanceKm: 64, tanker: 'NP-LH 2290', farmers: 612, status: 'Active' },
  { code: 'R-07', name: 'Yaya 1–6', centerId: 'CC-HNG', shift: 'Morning', departure: '05:10', arriveBy: '08:45', stops: ['Yaya 1 FMS', 'Yaya 3 FMS', 'Yaya 4 FMS', 'Hingurakgoda CC'], destination: 'Polonnaruwa plant', distanceKm: 48, tanker: 'NP-LK 4521', farmers: 845, status: 'Active' },
  { code: 'R-11', name: 'Ambewela – Pattipola', centerId: 'CC-NUW', shift: 'Morning', departure: '05:30', arriveBy: '08:55', stops: ['Ambewela FMS', 'Pattipola FMS', 'Nuwara Eliya CC'], destination: 'Ambewela plant', distanceKm: 37, tanker: 'NC-KA 7713', farmers: 520, status: 'Active' },
  { code: 'R-14', name: 'Anuradhapura West', centerId: 'CC-ANU', shift: 'Morning', departure: '05:30', arriveBy: '09:00', stops: ['Thambuttegama FMS', 'Galnewa FMS', 'Anuradhapura CC'], destination: 'Anuradhapura plant', distanceKm: 71, tanker: '', farmers: 704, status: 'Active' },
  { code: 'R-18', name: 'Welimada – Badulla', centerId: 'CC-BAD', shift: 'Morning', departure: '05:40', arriveBy: '08:40', stops: ['Welimada FMS', 'Bandarawela FMS', 'Badulla CC'], destination: 'Badulla plant', distanceKm: 52, tanker: 'UP-LC 3390', farmers: 388, status: 'Active' },
  { code: 'R-21', name: 'Uhana – Damana', centerId: 'CC-AMP', shift: 'Both', departure: '04:50', arriveBy: '08:30', stops: ['Uhana FMS', 'Damana FMS', 'Ampara CC'], destination: 'Ampara plant', distanceKm: 58, tanker: 'EP-LJ 0418', farmers: 541, status: 'Active' },
  { code: 'R-09', name: 'Mawathagama Evening', centerId: 'CC-KUR', shift: 'Evening', departure: '16:30', arriveBy: '19:30', stops: ['Mawathagama FMS', 'Kurunegala CC'], destination: 'Kurunegala plant', distanceKm: 22, tanker: '', farmers: 0, status: 'Inactive' },
]);

export const useRouteMaster = () => useStore(routeStore);

/** Active routes, for dropdowns. */
export function useActiveRoutes() {
  const all = useRouteMaster();
  return useMemo(() => all.filter((r) => r.status === 'Active'), [all]);
}
