import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { Eye, EyeOff, Lock, Milk, ShieldCheck, Smartphone, Truck } from 'lucide-react';
import logo from '@/assets/milco-logo.jpg';
import { useAuth } from '@/context/AuthContext';
import { Field } from '@/components/ui/Field';

type Mode = 'staff' | 'field';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const [mode, setMode] = useState<Mode>('staff');
  const [username, setUsername] = useState('n.perera@milco.lk');
  const [password, setPassword] = useState('');
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
      if (!username.trim() || !password) return setError('Enter your username and password.');
    } else {
      if (!otpSent) {
        if (!/^\+?\d[\d ]{8,}$/.test(mobile.trim())) return setError('Enter a valid mobile number, for example +94 71 234 5678.');
        setOtpSent(true);
        return;
      }
      if (!/^\d{6}$/.test(otp)) return setError('Enter the 6-digit code from the SMS.');
    }
    setBusy(true);
    // TODO: replace with POST /api/auth/login or /api/auth/otp/verify
    window.setTimeout(() => {
      login(
        mode === 'staff'
          ? { name: 'Nadeesha Perera', email: username, role: 'Finance manager', scope: 'All regions' }
          : { name: 'K. Dissanayake', email: mobile, role: 'Field officer', scope: 'Hingurakgoda CC' },
      );
      navigate(mode === 'field' ? '/mobile/collect' : from, { replace: true });
    }, 500);
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Brand panel */}
      <section className="relative hidden w-[46%] max-w-[640px] flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600 opacity-60"
        />
        <div aria-hidden className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-800 opacity-70" />
        <div className="relative inline-flex w-fit rounded-2xl bg-white p-4 shadow-lg">
          <img src={logo} alt="MILCO" className="h-16 w-auto" />
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Farmer &amp; Milk Collection Management
          </h1>
          <p className="mt-4 text-base leading-relaxed text-brand-100">
            Farmers, daily collection, quality, payments and approvals in one place, posted straight to your ERP.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            {[
              { icon: Milk, text: '182,000+ litres recorded every day across 146 collection centers' },
              { icon: Truck, text: 'Live tanker tracking from farm to plant' },
              { icon: ShieldCheck, text: 'Odoo, SAP Business One and SAP S/4HANA connectors' },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="pt-1.5 text-brand-50">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-brand-100">© 2026 Milk Industries of Lanka Company Ltd.</p>
      </section>

      {/* Form */}
      <section className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[400px]">
          <img src={logo} alt="MILCO" className="mb-8 h-14 w-auto lg:hidden" />
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
              <p className="mt-1 text-sm text-zinc-500">Use your MILCO account.</p>
            </div>
            <label>
              <span className="sr-only">Language</span>
              <select className="input h-9 w-auto pr-8 text-xs" defaultValue="en">
                <option value="en">English</option>
                <option value="si">සිංහල</option>
                <option value="ta">தமிழ்</option>
              </select>
            </label>
          </div>

          <div role="tablist" className="mb-6 grid grid-cols-2 rounded-lg bg-zinc-100 p-1">
            {(
              [
                { id: 'staff', label: 'Office staff', icon: Lock },
                { id: 'field', label: 'Field staff', icon: Smartphone },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={mode === t.id}
                onClick={() => {
                  setMode(t.id);
                  setError('');
                }}
                className={clsx(
                  'flex h-9 items-center justify-center gap-2 rounded-md text-sm font-medium transition',
                  mode === t.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900',
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {mode === 'staff' ? (
              <>
                <Field label="Username or email">
                  <input
                    id="username"
                    className="input h-11"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </Field>
                <Field label="Password">
                  <div className="relative">
                    <input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      className="input h-11 pr-11"
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-zinc-600">
                    <input id="remember" type="checkbox" className="h-4 w-4 rounded border-zinc-300 accent-brand-600" />
                    Remember this device
                  </label>
                  <a href="#forgot" className="font-medium text-brand-700 hover:underline">
                    Forgot password?
                  </a>
                </div>
              </>
            ) : (
              <>
                <Field label="Mobile number" hint="Registered with your center supervisor">
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
                  <Field label="6-digit code" hint={`Sent to ${mobile}. Code expires in 5 minutes.`}>
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
              {busy ? 'Signing in…' : mode === 'field' && !otpSent ? 'Send code' : 'Sign in'}
            </button>

            {mode === 'staff' && (
              <>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="h-px flex-1 bg-zinc-200" /> OR <span className="h-px flex-1 bg-zinc-200" />
                </div>
                <button
                  type="button"
                  className="btn btn-secondary h-11 w-full"
                  onClick={() => {
                    login({ name: 'Nadeesha Perera', email: 'n.perera@milco.lk', role: 'Finance manager', scope: 'All regions' });
                    navigate(from, { replace: true });
                  }}
                >
                  Sign in with company SSO (Microsoft)
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
                Use a different number
              </button>
            )}
          </form>

          <p className="mt-8 text-xs leading-relaxed text-zinc-500">
            After 5 failed attempts the account locks for 15 minutes. Two-step verification is required for Finance and
            Admin roles.
          </p>
        </div>
      </section>
    </div>
  );
}
