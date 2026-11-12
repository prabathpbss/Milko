import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CheckCircle2,
  FileSignature,
  KeyRound,
  LayoutDashboard,
  Milk,
  Navigation,
  PlugZap,
  RefreshCw,
  Settings,
  ShieldAlert,
  Smartphone,
  Sprout,
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
      { to: '/contracts', label: 'Contracts & pricing', icon: FileSignature },
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
    label: 'Administration',
    items: [
      { to: '/erp', label: 'ERP connectors', icon: PlugZap, end: true },
      { to: '/erp/sync', label: 'Mapping & sync log', icon: RefreshCw },
      { to: '/users', label: 'Users & roles', icon: KeyRound },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    label: 'Mobile apps',
    items: [
      { to: '/mobile/collect', label: 'Field collection', icon: Smartphone },
      { to: '/mobile/driver', label: 'Tanker driver', icon: Navigation },
      { to: '/mobile/farmer', label: 'Farmer app', icon: Sprout },
    ],
  },
];
