import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Eye, EyeOff, Lock, Smartphone } from 'lucide-react';
import LoginLayout from '@/components/layout/LoginLayout';
import { useAppearance } from '@/lib/appearance';
import { useAuth } from '@/context/AuthContext';
import { Field } from '@/components/ui/Field';
import ThemeToggle from "@/components/ui/ThemeToggle";
import LanguageSwitch from "@/components/ui/LanguageSwitch";
import { useLang } from "@/i18n/LanguageContext";

type Mode = 'staff' | 'field';

const DEMO_ADMIN = { username: 'udari', password: 'Udari@123' };

/** Office accounts with full access (System admin). Prototype only: the live system checks these on the server. */
const ADMIN_ACCOUNTS: Record<string, { password: string; name: string; email: string }> = {
  [DEMO_ADMIN.username]: { password: DEMO_ADMIN.password, name: 'Udari', email: 'udari@milco.lk' },
};

export default function Login() {
  const { user, login } = useAuth();
  const { t } = useLang();
  const look = useAppearance();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [mode, setMode] = useState<Mode>('staff');
  // Demo admin account, pre-filled for testing. Remove before go-live.
  const [username, setUsername] = useState(DEMO_ADMIN.username);
  const [password, setPassword] = useState(DEMO_ADMIN.password);
  const [showPw, setShowPw] = useState(false);
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'staff') {
      if (!username.trim() || !password) return setError(t("Enter your username and password."));
    } else {
      if (!otpSent) {
        if (!/^\+?\d[\d ]{8,}$/.test(mobile.trim())) return setError(t("Enter a valid mobile number, for example +94 71 234 5678."));
        setOtpSent(true);
        return;
      }
      if (!/^\d{6}$/.test(otp)) return setError(t("Enter the 6-digit code from the SMS."));
    }
    const admin = mode === 'staff' ? ADMIN_ACCOUNTS[username.trim().toLowerCase()] : undefined;
    if (admin && password !== admin.password) return setError(t('Wrong username or password.'));
    setBusy(true);
    // Field staff go back to the field form they opened (e.g. a driver's /field/driver link), else field collection.
    const fieldDest = from.startsWith('/field/') ? from : '/field/collect';
    const isDriver = fieldDest === '/field/driver';
    // TODO: replace with POST /api/auth/login or /api/auth/otp/verify
    window.setTimeout(() => {
      login(
        mode === 'staff'
          ? admin
            ? { name: admin.name, email: admin.email, role: 'System admin', scope: 'All regions' }
            : { name: 'Nadeesha Perera', email: username, role: 'Finance manager', scope: 'All regions' }
          : isDriver
            ? { name: 'M. Ajith Kumara', email: mobile, role: 'Tanker driver', scope: 'Route R-07' }
            : { name: 'K. Dissanayake', email: mobile, role: 'Field officer', scope: 'Hingurakgoda CC' },
      );
      navigate(mode === 'field' ? fieldDest : from, { replace: true });
    }, 500);
  };

  return (
    <LoginLayout look={look}>
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{t(look.login.formTitle)}</h2>
              {look.login.formSubtitle.trim() && <p className="mt-1 text-sm text-zinc-500">{t(look.login.formSubtitle)}</p>}
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <LanguageSwitch />
            </div>
          </div>

          <div role="tablist" className="mb-6 grid grid-cols-2 rounded-lg bg-zinc-100 p-1">
            {(
              [
                { id: 'staff', label: 'Office staff', icon: Lock },
                { id: 'field', label: 'Field staff', icon: Smartphone },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={mode === tab.id}
                onClick={() => {
                  setMode(tab.id);
                  setError('');
                }}
                className={clsx(
                  'flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition',
                  mode === tab.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900',
                )}
              >
                <tab.icon className="h-4 w-4" />
                {t(tab.label)}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {mode === 'staff' ? (
              <>
                <Field label={t("Username or email")}>
                  <input
                    id="username"
                    className="input h-11"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </Field>
                <Field label={t("Password")}>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      className="input h-11 pr-11"
                      autoComplete="current-password"
                      placeholder={t("Enter your password")}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
                      aria-label={showPw ? t("Hide password") : t("Show password")}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-zinc-600">
                    <input id="remember" type="checkbox" className="h-4 w-4 rounded border-zinc-300 accent-brand-600" />
                    {t("Remember this device")}
                  </label>
                  <a href="#forgot" className="font-medium text-brand-700 hover:underline">
                    {t("Forgot password?")}
                  </a>
                </div>
              </>
            ) : (
              <>
                <Field label={t("Mobile number")} hint={t("Registered with your center supervisor")}>
                  <input
                    id="mobile"
                    className="input h-11"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+94 71 234 5678"
                    value={mobile}
                    disabled={otpSent}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </Field>
                {otpSent && (
                  <Field label={t("6-digit code")} hint={t("Sent to {mobile}. Code expires in 5 minutes.", { mobile })}>
                    <input
                      id="otp"
                      className="input num h-11 text-center text-lg tracking-[0.5em]"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </Field>
                )}
              </>
            )}

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary h-11 w-full" disabled={busy}>
              {busy ? t("Signing in…") : mode === "field" && !otpSent ? t("Send code") : t("Sign in")}
            </button>

            {mode === 'staff' && (
              <>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="h-px flex-1 bg-zinc-200" /> {t("OR")} <span className="h-px flex-1 bg-zinc-200" />
                </div>
                <button
                  type="button"
                  className="btn btn-secondary h-11 w-full"
                  onClick={() => {
                    login({ name: 'Nadeesha Perera', email: 'n.perera@milco.lk', role: 'Finance manager', scope: 'All regions' });
                    navigate(from, { replace: true });
                  }}
                >
                  {t("Sign in with company SSO (Microsoft)")}
                </button>
              </>
            )}
            {mode === 'field' && otpSent && (
              <button
                type="button"
                className="w-full text-center text-sm font-medium text-brand-700 hover:underline"
                onClick={() => {
                  setOtpSent(false);
                  setOtp('');
                }}
              >
                {t("Use a different number")}
              </button>
            )}
          </form>

          {mode === 'staff' && (
            <div className="mt-6 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              <p className="mb-1">{t('Demo admin account (full access). Click to fill it in:')}</p>
              <ul className="space-y-0.5">
                {Object.entries(ADMIN_ACCOUNTS).map(([name, a]) => (
                  <li key={name}>
                    <button
                      type="button"
                      className="rounded px-1 py-0.5 text-left hover:bg-zinc-200"
                      onClick={() => {
                        setUsername(name);
                        setPassword(a.password);
                        setError('');
                      }}
                    >
                      <span className="text-zinc-500">{a.name}:</span> <span className="num font-medium text-zinc-900">{name}</span> /{' '}
                      <span className="num font-medium text-zinc-900">{a.password}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-8 text-xs leading-relaxed text-zinc-500">
            {t("After 5 failed attempts the account locks for 15 minutes. Two-step verification is required for Finance and Admin roles.")}
          </p>
    </LoginLayout>
  );
}
