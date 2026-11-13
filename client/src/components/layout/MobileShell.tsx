import { Suspense } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from '@/components/ui/ThemeToggle';
import PageSkeleton from '@/components/ui/PageSkeleton';

const apps = [
  { to: '/mobile/collect', label: 'Field collection' },
  { to: '/mobile/driver', label: 'Tanker driver' },
  { to: '/mobile/farmer', label: 'Farmer app' },
];

/**
 * Mobile app screens. On a phone they fill the screen; on a desktop they are
 * shown inside a phone-sized frame so they can be reviewed in the browser.
 */
export default function MobileShell() {
  return (
    <div className="min-h-screen bg-zinc-100 sm:py-8">
      <div className="mx-auto mb-4 hidden max-w-[420px] flex-col gap-3 sm:flex">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" /> Back to web app
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {apps.map((a) => (
            <NavLink
              key={a.to}
              to={a.to}
              className={({ isActive }) => clsx('chip', isActive ? 'chip-on' : 'chip-off')}
            >
              {a.label}
            </NavLink>
          ))}
          <ThemeToggle className="ml-auto" />
        </div>
      </div>
      <div className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col overflow-hidden bg-zinc-50 sm:min-h-0 sm:h-[860px] sm:rounded-[2rem] sm:border-[10px] sm:border-zinc-900 sm:shadow-2xl">
        <Suspense fallback={<div className="p-4"><PageSkeleton compact /></div>}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
}
