/**
 * Role master, access scope master and the user list that refers to them.
 * Map to the future Prisma models Role, RolePermission, AccessScope, AccessScopeMember and User.
 */
import { useMemo } from 'react';
import { createStore, useStore } from '@/lib/store';
import { permissionActions, permissionModules, roles as seedRoles, users as seedUsers, type AppUser, type PermissionMatrix } from '@/data/mock';
import type { MasterStatus } from '@/data/masters';

/* ───────────── Access scopes ───────────── */

/** How much data a user sees. Company = everything; the others list the regions, centers or routes covered. */
export type ScopeLevel = 'Company' | 'Region' | 'Center' | 'Route';
export const SCOPE_LEVELS: ScopeLevel[] = ['Company', 'Region', 'Center', 'Route'];

export interface ScopeMaster {
  code: string;
  name: string;
  level: ScopeLevel;
  /** Region names, center ids or route ids, depending on level. Empty for Company. */
  members: string[];
  description: string;
  users: number;
  status: MasterStatus;
}

export const scopeStore = createStore<ScopeMaster[]>([
  { code: 'ALL', name: 'All regions', level: 'Company', members: [], description: 'Whole company — head office roles', users: 22, status: 'Active' },
  { code: 'RG-NC', name: 'North Central', level: 'Region', members: ['North Central'], description: '', users: 14, status: 'Active' },
  { code: 'RG-NW', name: 'North Western', level: 'Region', members: ['North Western'], description: '', users: 9, status: 'Active' },
  { code: 'RG-CE', name: 'Central', level: 'Region', members: ['Central'], description: '', users: 8, status: 'Active' },
  { code: 'RG-EA', name: 'Eastern', level: 'Region', members: ['Eastern'], description: '', users: 6, status: 'Active' },
  { code: 'RG-UV', name: 'Uva', level: 'Region', members: ['Uva'], description: '', users: 5, status: 'Active' },
  { code: 'RG-NORTH', name: 'North zone (NC + NW)', level: 'Region', members: ['North Central', 'North Western'], description: 'Zonal QA team covering two regions', users: 2, status: 'Active' },
  { code: 'CC-HNG', name: 'Hingurakgoda CC', level: 'Center', members: ['CC-HNG'], description: '', users: 31, status: 'Active' },
  { code: 'CC-KUR', name: 'Kurunegala CC', level: 'Center', members: ['CC-KUR'], description: '', users: 24, status: 'Active' },
  { code: 'CC-NUW', name: 'Nuwara Eliya CC', level: 'Center', members: ['CC-NUW'], description: '', users: 19, status: 'Active' },
  { code: 'CC-ANU', name: 'Anuradhapura CC', level: 'Center', members: ['CC-ANU'], description: '', users: 27, status: 'Active' },
  { code: 'CC-AMP', name: 'Ampara CC', level: 'Center', members: ['CC-AMP'], description: '', users: 15, status: 'Active' },
  { code: 'CC-BAD', name: 'Badulla CC', level: 'Center', members: ['CC-BAD'], description: '', users: 11, status: 'Active' },
  { code: 'RT-07', name: 'Route R-07', level: 'Route', members: ['R-07'], description: 'Yaya 1–6', users: 3, status: 'Active' },
  { code: 'RT-03', name: 'Route R-03', level: 'Route', members: ['R-03'], description: 'Kurunegala North', users: 2, status: 'Active' },
  { code: 'RT-14', name: 'Route R-14', level: 'Route', members: ['R-14'], description: 'Anuradhapura West', users: 0, status: 'Inactive' },
]);

/* ───────────── Roles ───────────── */

export type SignIn = AppUser['signIn'];
export type ApprovalMode = 'None' | 'Limit' | 'Unlimited';

export interface RoleMaster {
  code: string;
  name: string;
  description: string;
  /** Scope levels a user with this role may be given. */
  levels: ScopeLevel[];
  approvalMode: ApprovalMode;
  /** Rs, only when approvalMode = 'Limit' */
  approvalLimit: number;
  signIn: SignIn;
  twoStep: boolean;
  /** Mobile OTP roles: one phone per user */
  bindDevice: boolean;
  perms: PermissionMatrix;
  users: number;
  /** Built-in roles can be edited but not deactivated or deleted. */
  system: boolean;
  status: MasterStatus;
}

export const PERM_MODULES = permissionModules as readonly string[];
export const PERM_ACTIONS = permissionActions as readonly string[];

const permsOf = (name: string) => seedRoles.find((r) => r.name === name)!.perms;
const matrix = (rows: string[]): PermissionMatrix =>
  Object.fromEntries(PERM_MODULES.map((m, i) => [m, Object.fromEntries(PERM_ACTIONS.map((a, j) => [a, rows[i]?.[j] === '1']))]));
export const emptyPerms = () => matrix([]);

const r = (x: Omit<RoleMaster, 'perms' | 'twoStep' | 'bindDevice' | 'system' | 'status'> & Partial<RoleMaster>): RoleMaster => ({
  perms: permsOf(x.name),
  twoStep: x.signIn !== 'Mobile OTP',
  bindDevice: x.signIn === 'Mobile OTP',
  system: false,
  status: 'Active',
  ...x,
});

export const roleStore = createStore<RoleMaster[]>([
  r({ code: 'ADMIN', name: 'System admin', description: 'IT administrators — users, settings and ERP connections', levels: ['Company'], approvalMode: 'None', approvalLimit: 0, signIn: 'SSO', users: 3, system: true }),
  r({ code: 'GM', name: 'General manager', description: 'Final approver for prices and large payment runs', levels: ['Company'], approvalMode: 'Unlimited', approvalLimit: 0, signIn: 'SSO', users: 2 }),
  r({ code: 'FIN-MGR', name: 'Finance manager', description: 'Approves payment runs, deductions and advances', levels: ['Company', 'Region'], approvalMode: 'Limit', approvalLimit: 250_000_000, signIn: 'SSO', users: 4 }),
  r({
    code: 'FIN-OFF', name: 'Finance officer', description: 'Prepares payment runs and deductions', levels: ['Company', 'Region'], approvalMode: 'None', approvalLimit: 0, signIn: 'Password', users: 6,
    perms: matrix(['100001', '100001', '100001', '000000', '100001', '110001', '111001', '111001', '100001', '000000', '000000']),
  }),
  r({
    code: 'PROC', name: 'Procurement officer', description: 'Contracts and price templates', levels: ['Company', 'Region'], approvalMode: 'None', approvalLimit: 0, signIn: 'SSO', users: 3,
    perms: matrix(['111001', '111001', '100001', '100000', '100000', '100000', '100000', '000000', '100001', '000000', '000000']),
  }),
  r({ code: 'RM', name: 'Regional manager', description: 'Runs one or more regions', levels: ['Region'], approvalMode: 'Limit', approvalLimit: 5_000_000, signIn: 'SSO', users: 9 }),
  r({ code: 'CC-SUP', name: 'Center supervisor', description: 'Runs one collection center', levels: ['Center'], approvalMode: 'Limit', approvalLimit: 50_000, signIn: 'Password', users: 38 }),
  r({ code: 'FO', name: 'Field officer', description: 'Collects milk and onboards farmers in the field', levels: ['Center', 'Route'], approvalMode: 'None', approvalLimit: 0, signIn: 'Mobile OTP', users: 112 }),
  r({ code: 'DRV', name: 'Tanker driver', description: 'Tanker driver form only — route, stops and loading on the phone', levels: ['Route'], approvalMode: 'None', approvalLimit: 0, signIn: 'Mobile OTP', users: 31 }),
  r({ code: 'QA', name: 'QA officer', description: 'Quality exceptions and disputes', levels: ['Region', 'Center'], approvalMode: 'Limit', approvalLimit: 100_000, signIn: 'Password', users: 8 }),
  r({ code: 'AUDIT', name: 'Auditor (read only)', description: 'Internal and external audit', levels: ['Company'], approvalMode: 'None', approvalLimit: 0, signIn: 'Password', users: 2 }),
]);

/* ───────────── Users ───────────── */

export const userStore = createStore<AppUser[]>(seedUsers.map((u) => (u.scope === 'All' ? { ...u, scope: 'All regions' } : u)));

/* ───────────── Hooks ───────────── */

export const useRoleMaster = () => useStore(roleStore);
export const useScopeMaster = () => useStore(scopeStore);
export const useUsers = () => useStore(userStore);

export function useActiveRoles() {
  const all = useRoleMaster();
  return useMemo(() => all.filter((x) => x.status === 'Active'), [all]);
}

/** Active scopes a role may be given, in level order. */
export function useScopesForRole(roleName: string) {
  const roles = useRoleMaster();
  const scopes = useScopeMaster();
  return useMemo(() => {
    const role = roles.find((x) => x.name === roleName);
    const levels = role?.levels ?? SCOPE_LEVELS;
    return scopes
      .filter((s) => s.status === 'Active' && levels.includes(s.level))
      .sort((a, b) => SCOPE_LEVELS.indexOf(a.level) - SCOPE_LEVELS.indexOf(b.level));
  }, [roles, scopes, roleName]);
}

export const approvalText = (x: Pick<RoleMaster, 'approvalMode' | 'approvalLimit'>) =>
  x.approvalMode === 'Unlimited' ? 'No limit' : x.approvalMode === 'None' ? 'Cannot approve' : `Rs ${x.approvalLimit.toLocaleString('en-LK')}`;

export const mfaFor = (role: RoleMaster): AppUser['mfa'] => (role.signIn === 'Mobile OTP' ? 'OTP' : role.twoStep ? 'On' : 'Off');
