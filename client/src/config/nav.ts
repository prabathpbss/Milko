import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  FileSignature,
  KeyRound,
  Navigation,
  Layers,
  LayoutDashboard,
  Map,
  Milk,
  PlugZap,
  RefreshCw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sprout,
  Tags,
  Truck,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: number;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Farmers',
    items: [
      { to: '/farmers', label: 'Farmer list', icon: Users },
      { to: '/onboarding', label: 'Onboarding', icon: UserPlus, badge: 3 },
      { to: '/contracts', label: 'Contracts', icon: FileSignature },
      { to: '/price-templates', label: 'Price templates', icon: Tags },
    ],
  },
  {
    label: 'Collection',
    items: [
      { to: '/collection', label: 'Daily collection', icon: Milk },
      { to: '/logistics', label: 'Centers & tankers', icon: Truck },
      { to: '/quality', label: 'Quality & disputes', icon: ShieldAlert, badge: 5 },
    ],
  },
  {
    label: 'Finance',
    items: [
      { to: '/payments', label: 'Payment runs', icon: Wallet },
      { to: '/approvals', label: 'Approvals', icon: CheckCircle2, badge: 7 },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Field forms',
    items: [
      { to: '/field/collect', label: 'Field collection', icon: Smartphone },
      { to: '/field/driver', label: 'Tanker driver', icon: Navigation },
      { to: '/field/farmer', label: 'Farmer portal', icon: Sprout },
    ],
  },
  {
    label: 'Masters',
    items: [
      { to: '/masters/regions', label: 'Regions', icon: Map },
      { to: '/masters/categories', label: 'Farmer categories', icon: Award },
      { to: '/masters/roles', label: 'Roles', icon: ShieldCheck },
      { to: '/masters/scopes', label: 'Access scopes', icon: Layers },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/erp', label: 'ERP connectors', icon: PlugZap, end: true },
      { to: '/erp/sync', label: 'Mapping & sync log', icon: RefreshCw },
      { to: '/users', label: 'Users & roles', icon: KeyRound },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];
