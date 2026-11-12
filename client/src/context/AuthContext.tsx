import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export interface SessionUser {
  name: string;
  email: string;
  role: string;
  scope: string;
}

interface AuthValue {
  user: SessionUser | null;
  login: (user: SessionUser) => void;
  logout: () => void;
}

const KEY = 'milco.session';
const AuthContext = createContext<AuthValue | null>(null);

function readSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(readSession);

  const login = useCallback((next: SessionUser) => {
    setUser(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable: session lasts for this tab only */
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
