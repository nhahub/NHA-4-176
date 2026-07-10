import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { foodAdsApi } from '../lib/api';
import {
  clearSession,
  getSession,
  setSession,
  subscribe,
  toCurrentUser,
  type AuthSession,
} from '../lib/session';
import type { CurrentUserResponse, LoginRequest, RegisterRequest } from '../lib/types';

type AuthContextValue = {
  session: AuthSession | null;
  user: CurrentUserResponse | null;
  isAuthenticated: boolean;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [session, setLocalSession] = useState<AuthSession | null>(() => getSession());

  useEffect(() => subscribe(() => setLocalSession(getSession())), []);

  async function login(request: LoginRequest) {
    const nextSession = await foodAdsApi.login(request);
    setSession(nextSession);
    navigate('/app', { replace: true });
  }

  async function register(request: RegisterRequest) {
    const nextSession = await foodAdsApi.register(request);
    setSession(nextSession);
    navigate('/app', { replace: true });
  }

  async function logout() {
    const refreshToken = getSession()?.refreshToken;
    clearSession();
    if (refreshToken) {
      try {
        await foodAdsApi.logout({ refreshToken });
      } catch {
        // Local logout should succeed even if the server token was already revoked.
      }
    }
    navigate('/login', { replace: true });
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: toCurrentUser(session),
      isAuthenticated: Boolean(session?.accessToken),
      login,
      register,
      logout,
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return value;
}
