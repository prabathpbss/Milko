import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Bell, ChevronDown, LogOut, Menu, Search, UserCircle2, X } from 'lucide-react';
import logo from '@/assets/milco-logo.jpg';
import { navGroups } from '@/config/nav';
import { useAuth } from '@/context/AuthContext';
import { useClickOutside } from '@/hooks/useClickOutside';
import { notifications } from '@/data/mock';
import { Avatar } from '@/components/ui/misc';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageSwitch from "@/components/ui/LanguageSwitch";
import { useLang } from "@/i18n/LanguageContext";
import PageSkeleton from '@/components/ui/PageSkeleton';

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useLang();
  return (
    <div className="flex h-full flex-col">
      <Link
        to="/"
        onClick={onNavigate}
        className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-100 px-5"
      >
        <img src={logo} alt="MILCO" className="h-10 w-auto rounded-md bg-[#fff] p-1" />
        <span className="text-xs font-medium leading-tight text-zinc-500">
          {t("Farmer & Milk")}
          <br />
          {t("Collection")}
        </span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label={t("Main")}>
        {navGroups.map((g) => (
          <div key={g.label} className="mb-5">
            <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">{t(g.label)}</p>
            <ul className="space-y-0.5">
              {g.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      clsx(
                        'group flex min-h-[38px] items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={clsx(
                            'h-[18px] w-[18px] shrink-0',
                            isActive ? 'text-brand-600' : 'text-zinc-400 group-hover:text-zinc-600',
                          )}
                        />
                        <span className="flex-1 truncate">{t(item.label)}</span>
                        {item.badge ? (
                          <span className="num rounded-full bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                            {item.badge}
                          </span>
                        ) : null}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-zinc-100 px-5 py-3 text-xs text-zinc-500">MILCO FMS v1.0 · © 2026</div>
    </div>
  );
}

function NotificationsMenu() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  const unread = notifications.filter((n) => n.unread).length;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn btn-ghost btn-icon relative"
        aria-label={t("Notifications, {n} unread", { n: unread })}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-white" aria-hidden />
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <span className="text-sm font-semibold">{t("Notifications")}</span>
            <button type="button" className="text-xs font-medium text-brand-700 hover:underline">
              {t("Mark all as read")}
            </button>
          </div>
          <ul className="max-h-96 divide-y divide-zinc-100 overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link to={n.to} onClick={close} className="flex gap-3 px-4 py-3 hover:bg-zinc-50">
                  <span
                    className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.unread ? 'bg-brand-600' : 'bg-zinc-300')}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm text-zinc-900">{t(n.title)}</span>
                    <span className="block text-xs text-zinc-500">{t(n.time)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const { t } = useLang();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);
  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-zinc-100"
      >
        <Avatar name={user.name} size="sm" />
        <span className="hidden text-left md:block">
          <span className="block text-sm font-medium leading-tight">{user.name}</span>
          <span className="block text-xs leading-tight text-zinc-500">{user.role}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-zinc-400 md:block" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-60 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-xl">
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
            <p className="mt-1 text-xs text-zinc-500">{user.scope}</p>
          </div>
          <Link to="/users" onClick={close} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-zinc-50">
            <UserCircle2 className="h-4 w-4 text-zinc-500" /> {t("My profile")}
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" /> {t("Sign out")}
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const { t } = useLang();
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();

  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setDrawer(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : '';
    if (!drawer) return;
    drawerCloseRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      menuBtnRef.current?.focus();
    };
  }, [drawer]);

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only z-[60] rounded-lg bg-white px-4 py-2 text-sm font-medium shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        {t("Skip to content")}
      </a>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("Main menu")}>
          <div className="absolute inset-0 bg-zinc-950/50" onClick={() => setDrawer(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 w-[min(288px,85vw)] overscroll-contain bg-white pb-[env(safe-area-inset-bottom)] shadow-xl">
            <button
              ref={drawerCloseRef}
              type="button"
              onClick={() => setDrawer(false)}
              className="btn btn-ghost btn-icon absolute right-2 top-3"
              aria-label={t("Close menu")}
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6 lg:px-8">
            <button
              ref={menuBtnRef}
              type="button"
              className="btn btn-ghost btn-icon -ml-2 lg:hidden"
              onClick={() => setDrawer(true)}
              aria-label={t("Open menu")}
              aria-expanded={drawer}
            >
              <Menu className="h-5 w-5" />
            </button>
            <label className="relative hidden max-w-md flex-1 sm:block">
              <span className="sr-only">{t("Search")}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input className="input pl-9" placeholder={t("Search farmer, center, tanker, document…")} />
            </label>
            <div className="flex-1 sm:hidden" />
            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <Link
                to="/erp/sync"
                className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 md:inline-flex"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {t("SAP B1 · synced {time}", { time: "09:42" })}
              </Link>
              <LanguageSwitch />
              <ThemeToggle />
              <NotificationsMenu />
              <UserMenu />
            </div>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1480px] px-4 py-6 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 sm:px-6 lg:px-8 lg:py-8">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
